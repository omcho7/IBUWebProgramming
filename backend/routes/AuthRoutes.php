<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Register routes for both /auth and /backend/auth paths
$authRoutes = function() {
    /**
     * @OA\Post(
     *     path="/auth/register",
     *     tags={"auth"},
     *     summary="Register new user",
     *     @OA\RequestBody(
     *         description="User registration data",
     *         required=true,
     *         @OA\JsonContent(
     *             required={"username","email","password","role"},
     *             @OA\Property(property="username", type="string", example="testuser"),
     *             @OA\Property(property="email", type="string", example="user@example.com"),
     *             @OA\Property(property="password", type="string", example="securepassword"),
     *             @OA\Property(property="role", type="string", enum={"Client", "Nutritionist"}, example="Client")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="User registered successfully"
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Invalid input"
     *     )
     * )
     */
    Flight::route('POST /register', function() {
        $data = Flight::request()->data->getData();
        $response = Flight::auth_service()->register($data);
        
        if ($response['success']) {
            Flight::json($response);
        } else {
            Flight::halt(400, json_encode($response));
        }
    });

    /**
     * @OA\Post(
     *     path="/auth/login",
     *     tags={"auth"},
     *     summary="Login to system",
     *     @OA\RequestBody(
     *         description="Login credentials",
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","password"},
     *             @OA\Property(property="email", type="string", example="user@example.com"),
     *             @OA\Property(property="password", type="string", example="securepassword")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="token", type="string", example="eyJhbGciOiJ...")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Invalid credentials"
     *     )
     * )
     */
    Flight::route('POST /login', function() {
        $data = Flight::request()->data->getData();
        $response = Flight::auth_service()->login($data);
        
        if ($response['success']) {
            Flight::json($response);
        } else {
            Flight::halt(401, json_encode($response));
        }
    });
};

// Register routes for both paths
Flight::group('/auth', $authRoutes);
Flight::group('/backend/auth', $authRoutes);