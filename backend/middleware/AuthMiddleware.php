<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware {
    public function verifyToken($token) {
        try {
            $decoded = JWT::decode($token, new Key(Config::JWT_SECRET(), 'HS256'));
            
            // Double verification
            if (!isset($decoded->user) || !isset($decoded->user->role)) {
                throw new Exception("Invalid token structure");
            }

            // Store the entire decoded token and user data
            Flight::set('decoded_token', $decoded);
            Flight::set('user', $decoded->user);
            
            error_log("Token verified successfully for user: " . $decoded->user->email);
            error_log("Decoded token data: " . print_r($decoded, true));
            error_log("User data: " . print_r($decoded->user, true));
            
            return true;
        } catch (Exception $e) {
            error_log("Token verification failed: " . $e->getMessage());
            Flight::halt(401, json_encode([
                'success' => false,
                'error' => $e->getMessage(),
                'debug' => [
                    'token' => $token
                ]
            ]));
            return false;
        }
    }

    public function authorizeRole($requiredRole) {
        $user = Flight::get('user');
        $decoded = Flight::get('decoded_token');
        
        error_log("Authorizing role. Required: $requiredRole | User data: " . print_r($user, true));
        error_log("Decoded token data: " . print_r($decoded, true));

        // Get the effective role from either source
        $effectiveRole = null;
        if ($user && isset($user->role)) {
            $effectiveRole = $user->role;
        } elseif ($decoded && isset($decoded->user->role)) {
            $effectiveRole = $decoded->user->role;
        }

        if (!$effectiveRole) {
            error_log("Critical: No role data available in token");
            Flight::halt(403, json_encode([
                'success' => false,
                'error' => 'Role information missing in token',
                'debug' => [
                    'user_data' => $user,
                    'decoded_token' => $decoded
                ]
            ]));
            return false;
        }
        
        // Case-insensitive comparison
        if (strtolower($effectiveRole) !== strtolower($requiredRole)) {
            error_log("Role authorization failed. Has: $effectiveRole, Needs: $requiredRole");
            Flight::halt(403, json_encode([
                'success' => false,
                'error' => 'Insufficient privileges',
                'required_role' => $requiredRole,
                'current_role' => $effectiveRole
            ]));
            return false;
        }
        
        error_log("Role authorized successfully: $effectiveRole");
        return true;
    }

    public function authorizeRoles($allowedRoles) {
        $user = Flight::get('user');
        $decoded = Flight::get('decoded_token');
        
        error_log("Authorizing role. Required: " . implode(', ', $allowedRoles) . " | User data: " . print_r($user, true));
        error_log("Decoded token data: " . print_r($decoded, true));
        
        // Get the effective role from either the user object or the decoded token
        $effectiveRole = null;
        
        // First try to get role from user object
        if (is_object($user)) {
            if (isset($user->role)) {
                $effectiveRole = $user->role;
            } elseif (isset($user->user) && isset($user->user->role)) {
                $effectiveRole = $user->user->role;
            }
        } elseif (is_array($user)) {
            if (isset($user['role'])) {
                $effectiveRole = $user['role'];
            } elseif (isset($user['user']) && isset($user['user']['role'])) {
                $effectiveRole = $user['user']['role'];
            }
        }
        
        // If no role found in user object, try decoded token
        if (!$effectiveRole && $decoded) {
            if (isset($decoded->user->role)) {
                $effectiveRole = $decoded->user->role;
            }
        }

        if (!$effectiveRole) {
            error_log("Critical: No role data available in token");
            Flight::halt(401, json_encode([
                'success' => false,
                'error' => 'No role data available in token',
                'debug' => [
                    'user_data' => $user,
                    'decoded_token' => $decoded
                ]
            ]));
            return;
        }

        if (!in_array($effectiveRole, $allowedRoles)) {
            error_log("Role authorization failed. User role: $effectiveRole, Allowed roles: " . implode(', ', $allowedRoles));
            Flight::halt(403, json_encode([
                'success' => false,
                'error' => 'Access denied: Insufficient permissions',
                'debug' => [
                    'user_role' => $effectiveRole,
                    'allowed_roles' => $allowedRoles
                ]
            ]));
            return;
        }

        error_log("Role authorized successfully: $effectiveRole");
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