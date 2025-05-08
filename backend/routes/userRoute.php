<?php
require_once 'C:\xampp\htdocs\OmarOsmanovic\IBUWebProgramming\backend\services\UserService.php';

$userService = new UserService();

/**
 * @OA\Post(
 *     path="/users/register",
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
Flight::route('POST /users/register', function() use ($userService) {
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
 *     path="/users/login",
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
Flight::route('POST /users/login', function() use ($userService) {
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
 *     path="/users/clients",
 *     tags={"Users"},
 *     summary="Get all clients",
 *     @OA\Response(
 *         response=200,
 *         description="List of clients"
 *     )
 * )
 */
Flight::route('GET /users/clients', function() use ($userService) {
    Flight::json($userService->getAllClients());
});

/**
 * @OA\Get(
 *     path="/users/nutritionists",
 *     tags={"Users"},
 *     summary="Get all nutritionists",
 *     @OA\Response(
 *         response=200,
 *         description="List of nutritionists"
 *     )
 * )
 */
Flight::route('GET /users/nutritionists', function() use ($userService) {
    Flight::json($userService->getAllNutritionists());
});

/**
 * @OA\Post(
 *     path="/users/email",
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
 *         response=404,
 *         description="User not found"
 *     )
 * )
 */
Flight::route('POST /users/email', function() {
    $data = Flight::request()->data->getData();
    $userDao = new UserDao();
    $user = $userDao->getByEmail($data['email']);
    if ($user) {
        Flight::json($user);
    } else {
        Flight::json(['error' => 'User not found.'], 404);
    }
});
?>