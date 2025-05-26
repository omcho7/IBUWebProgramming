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

            // Store the entire decoded token
            Flight::set('decoded_token', $decoded);
            Flight::set('user', $decoded->user);
            
            error_log("Token verified successfully for user: " . $decoded->user->email);
            return true;
        } catch (Exception $e) {
            error_log("Token verification failed: " . $e->getMessage());
            Flight::halt(401, json_encode(['error' => $e->getMessage()]));
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
        
        if ($effectiveRole !== $requiredRole) {
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

    public function authorizeRoles($roles) {
        $user = Flight::get('user');
        if (!in_array($user['role'], $roles)) {
            Flight::halt(403, 'Forbidden: role not allowed');
        }
    }

    public function authorizePermission($permission) {
        $user = Flight::get('user');
        if (!in_array($permission, $user['permissions'])) {
            Flight::halt(403, 'Access denied: permission missing');
        }
    }
}