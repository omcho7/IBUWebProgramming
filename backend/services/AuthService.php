<?php
require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/../dao/AuthDao.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthService extends BaseService {
    private $auth_dao;

    public function __construct() {
        $this->auth_dao = new AuthDao();
        parent::__construct($this->auth_dao);
    }

    public function get_user_by_email($email) {
        return $this->auth_dao->get_user_by_email($email);
    }

    public function register($user) {
    try {
        $required = ['username', 'email', 'password', 'role'];
        foreach ($required as $field) {
            if (empty($user[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        if (!in_array($user['role'], ['Client', 'Nutritionist'])) {
            throw new Exception("Role must be either 'Client' or 'Nutritionist'");
        }

        if ($this->auth_dao->get_user_by_email($user['email'])) {
            throw new Exception("Email already registered");
        }

        $user['password'] = password_hash($user['password'], PASSWORD_BCRYPT);

        $registered_user = parent::add($user);
        error_log("Registration result: " . print_r($registered_user, true));
        
        if (empty($registered_user) || !is_array($registered_user)) {
            throw new Exception("Registration failed - invalid response from database");
        }

        if (array_key_exists('password', $registered_user)) {
            unset($registered_user['password']);
        }

        return [
            'success' => true,
            'data' => $registered_user
        ];

    } catch (Exception $e) {
        error_log("Registration Error: " . $e->getMessage());
        return $this->returnError($e->getMessage());
    }
}

    public function login($user) {
        try {
            if (empty($user['email']) || empty($user['password'])) {
                throw new Exception('Email and password are required');
            }

            $db_user = $this->auth_dao->get_user_by_email($user['email']);
            if (!$db_user) {
                throw new Exception('Invalid credentials');
            }

            if (!password_verify($user['password'], $db_user['password'])) {
                throw new Exception('Invalid credentials');
            }

            unset($db_user['password']);
            
            // Create properly nested user data structure
            $user_data = [
                'id' => $db_user['id'],
                'username' => $db_user['username'],
                'email' => $db_user['email'],
                'role' => $db_user['role']
            ];

            error_log("User data before token creation: " . print_r($user_data, true));

            $jwt_payload = [
                'user' => $user_data,  // Nest user data under 'user' key
                'iat' => time(),
                'exp' => time() + (60 * 60 * 24) // 24 hours expiration
            ];

            error_log("JWT payload before encoding: " . print_r($jwt_payload, true));
            error_log("Using JWT secret: " . substr(Config::JWT_SECRET(), 0, 5) . "...");

            $token = JWT::encode(
                $jwt_payload,
                Config::JWT_SECRET(),
                'HS256'
            );

            error_log("Generated token: " . $token);
            
            // Verify the token can be decoded
            try {
                $decoded = JWT::decode($token, new Key(Config::JWT_SECRET(), 'HS256'));
                error_log("Token verification successful. Decoded data: " . print_r($decoded, true));
            } catch (Exception $e) {
                error_log("Token verification failed after generation: " . $e->getMessage());
                throw new Exception("Token generation failed: " . $e->getMessage());
            }

            return [
                'success' => true,
                'data' => [
                    'token' => $token,
                    'user' => $user_data
                ]
            ];

        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}