<?php
require_once 'C:\xampp\htdocs\OmarOsmanovic\IBUWebProgramming\backend\services\UserService.php';
require_once 'backend/data/roles.php'; // Include roles constants

$userService = new UserService();

/**
 * @OA\Post(
 *     path="/backend/users/register",
 *     tags={"Users"},
 *     summary="Register a new user",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"username", "email", "password", "role"},
 *             @OA\Property(property="username", type="string", example="John Doe"),
 *             @OA\Property(property="email", type="string", example="john@example.com"),
 *             @OA\Property(property="password", type="string", example="password123"),
 *             @OA\Property(property="role", type="string", example="Client")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="User registered successfully"
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error"
 *     )
 * )
 */
Flight::route('POST /backend/users/register', function() use ($userService) {
    $data = Flight::request()->data->getData();
    try {
        $user = $userService->registerUser($data);
        Flight::json($user);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

/**
 * @OA\Post(
 *     path="/backend/users/login",
 *     tags={"Users"},
 *     summary="Login a user",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"email", "password"},
 *             @OA\Property(property="email", type="string", example="john@example.com"),
 *             @OA\Property(property="password", type="string", example="password123")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="User logged in successfully"
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Invalid credentials"
 *     )
 * )
 */
Flight::route('POST /backend/users/login', function() use ($userService) {
    $data = Flight::request()->data->getData();
    try {
        $user = $userService->loginUser($data['email'], $data['password']);
        Flight::json($user);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

/**
 * @OA\Get(
 *     path="/backend/users/clients",
 *     tags={"Users"},
 *     summary="Get all clients",
 *     @OA\Response(
 *         response=200,
 *         description="List of clients"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - only nutritionists can view client list"
 *     )
 * )
 */
Flight::route('GET /backend/users/clients', function() use ($userService) {
    try {
        // First verify the token
        $headers = getallheaders();
        if (!isset($headers['Authorization'])) {
            throw new Exception('Missing authorization header', 401);
        }
        
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        Flight::auth_middleware()->verifyToken($token);
        
        // Then verify the Nutritionist role
        Flight::auth_middleware()->authorizeRole('Nutritionist');
        
        $clients = $userService->getAllClients();
        Flight::json([
            'success' => true,
            'data' => $clients
        ]);
    } catch (Exception $e) {
        error_log("Error in /backend/users/clients: " . $e->getMessage());
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], $e->getCode() ?: 500);
    }
});

/**
 * @OA\Get(
 *     path="/backend/users/nutritionists",
 *     tags={"Users"},
 *     summary="Get all nutritionists",
 *     @OA\Response(
 *         response=200,
 *         description="List of nutritionists"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - only clients can view nutritionist list"
 *     )
 * )
 */
Flight::route('GET /backend/users/nutritionists', function() use ($userService) {
    // Only clients can view the list of nutritionists
    Flight::auth_middleware()->authorizeRole(Roles::CLIENT);
    Flight::json($userService->getAllNutritionists());
});

/**
 * @OA\Post(
 *     path="/backend/users/email",
 *     tags={"Users"},
 *     summary="Get user by email",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"email"},
 *             @OA\Property(property="email", type="string", example="john@example.com")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="User details"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - only admins can look up users by email"
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="User not found"
 *     )
 * )
 */
Flight::route('POST /backend/users/email', function() use ($userService) {
    // Only admins can look up users by email
    Flight::auth_middleware()->authorizeRole(Roles::ADMIN);
    
    $data = Flight::request()->data->getData();
    $userDao = new UserDao();
    $user = $userDao->getByEmail($data['email']);
    if ($user) {
        Flight::json($user);
    } else {
        Flight::json(['error' => 'User not found.'], 404);
    }
});

/**
 * @OA\Delete(
 *     path="/backend/users/delete/{id}",
 *     tags={"Users"},
 *     summary="Delete a client",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         description="Client ID",
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Client deleted successfully"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - only nutritionists can delete clients"
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Client not found"
 *     )
 * )
 */
Flight::route('DELETE /backend/users/delete/@id', function($id) use ($userService) {
    try {
        // First verify the token
        $headers = getallheaders();
        if (!isset($headers['Authorization'])) {
            throw new Exception('Missing authorization header', 401);
        }
        
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        Flight::auth_middleware()->verifyToken($token);
        
        // Then verify the Nutritionist role
        Flight::auth_middleware()->authorizeRole('Nutritionist');
        
        $result = $userService->deleteClient($id);
        Flight::json($result);
    } catch (Exception $e) {
        error_log("Error in /backend/users/delete: " . $e->getMessage());
        Flight::json([
            'success' => false,
            'message' => $e->getMessage()
        ], $e->getCode() ?: 500);
    }
});
?>