<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware {
    public function verifyToken($token) {
        try {
            error_log("Verifying token: " . substr($token, 0, 20) . "...");
            
            // Remove 'Bearer ' prefix if present
            if (strpos($token, 'Bearer ') === 0) {
                $token = substr($token, 7);
            }
            
            $decoded = JWT::decode($token, new Key(Config::JWT_SECRET(), 'HS256'));
            error_log("Decoded token: " . print_r($decoded, true));
            
            // Ensure we have user data with role
            if (!isset($decoded->user) || !isset($decoded->user->role)) {
                throw new Exception("Invalid token structure - missing user role");
            }

            // Store the decoded token and user data
            Flight::set('decoded_token', $decoded);
            Flight::set('user', $decoded->user);
            
            error_log("Token verified successfully for user: " . $decoded->user->email);
            error_log("Stored user data: " . print_r($decoded->user, true));
            return true;
        } catch (Exception $e) {
            error_log("Token verification failed: " . $e->getMessage());
            Flight::halt(401, json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));
            return false;
        }
    }

    public function authorizeRole($requiredRole) {
        $user = Flight::get('user');
        $decoded = Flight::get('decoded_token');
        
        error_log("Authorizing role. Required: $requiredRole");
        error_log("User data from Flight: " . print_r($user, true));
        error_log("Decoded token from Flight: " . print_r($decoded, true));
        
        // Get role from either source
        $role = null;
        if ($user && isset($user->role)) {
            $role = $user->role;
        } elseif ($decoded && isset($decoded->user->role)) {
            $role = $decoded->user->role;
        }
        
        if (!$role) {
            error_log("Critical: No role data available in token");
            Flight::halt(401, json_encode([
                'success' => false,
                'error' => 'No role data available in token',
                'debug' => [
                    'user_data' => $user,
                    'decoded_token' => $decoded
                ]
            ]));
            return false;
        }
        
        if (strtolower($role) !== strtolower($requiredRole)) {
            error_log("Role authorization failed. Has: $role, Needs: $requiredRole");
            Flight::halt(403, json_encode([
                'success' => false,
                'error' => 'Insufficient privileges'
            ]));
            return false;
        }
        
        error_log("Role authorized successfully: $role");
        return true;
    }

    public function authorizeRoles($allowedRoles) {
        try {
            // Get the token from the request header
            $headers = getallheaders();
            if (!isset($headers['Authorization'])) {
                throw new Exception('No authorization header');
            }

            $token = $headers['Authorization'];
            if (strpos($token, 'Bearer ') === 0) {
                $token = substr($token, 7);
            }

            // Decode the token directly
            $decoded = JWT::decode($token, new Key(Config::JWT_SECRET(), 'HS256'));
            error_log("Direct token decode in authorizeRoles: " . print_r($decoded, true));

            // Get role from decoded token
            $role = null;
            if (isset($decoded->user->role)) {
                $role = $decoded->user->role;
            }

            error_log("Authorizing roles. Allowed: " . implode(', ', $allowedRoles));
            error_log("Role from token: " . ($role ?? 'null'));
            
            if (!$role) {
                error_log("Critical: No role data available in token");
                Flight::halt(401, json_encode([
                    'success' => false,
                    'error' => 'No role data available in token',
                    'debug' => [
                        'decoded_token' => $decoded
                    ]
                ]));
                return false;
            }
            
            if (!in_array($role, $allowedRoles)) {
                error_log("Role authorization failed. Has: $role, Allowed: " . implode(', ', $allowedRoles));
                Flight::halt(403, json_encode([
                    'success' => false,
                    'error' => 'Insufficient privileges'
                ]));
                return false;
            }
            
            // Store user data in Flight after successful authorization
            Flight::set('user', $decoded->user);
            Flight::set('decoded_token', $decoded);
            
            error_log("User data stored in Flight after authorization: " . print_r($decoded->user, true));
            error_log("Role authorized successfully: $role");
            return true;
        } catch (Exception $e) {
            error_log("Authorization error: " . $e->getMessage());
            Flight::halt(401, json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));
            return false;
        }
    }

    public function authorizePermission($permission) {
        $user = Flight::get('user');
        if (!in_array($permission, $user['permissions'])) {
            Flight::halt(403, 'Access denied: permission missing');
        }
    }

    public function getUser() {
        return Flight::get('user');
    }
}