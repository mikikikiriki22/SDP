<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware {
    public function verifyToken($token) {
        error_log("=== AUTH MIDDLEWARE START ===");
        error_log("Token received: " . ($token ? "YES (length: " . strlen($token) . ")" : "NO"));
        
        if (!$token) {
            error_log("AUTH FAILED: No token provided");
            Flight::halt(401, json_encode([
                'error' => 'Missing authentication header',
                'debug' => 'No token found in Authentication header'
            ]));
        }

        try {
            $secret = Flight::JWT_SECRET();
            error_log("JWT_SECRET: " . substr($secret, 0, 10) . "...");
            error_log("Attempting to decode token...");
            
            $decoded_token = JWT::decode($token, new Key($secret, 'HS256'));
            error_log("Token decoded successfully");
            error_log("Decoded token structure: " . json_encode($decoded_token));
            
            if (!isset($decoded_token->user)) {
                error_log("AUTH FAILED: Token missing 'user' property");
                Flight::halt(401, json_encode([
                    'error' => 'Invalid token structure',
                    'debug' => 'Token does not contain user property',
                    'token_keys' => array_keys((array)$decoded_token)
                ]));
            }
            
            error_log("Setting user in Flight: " . json_encode($decoded_token->user));
            Flight::set('user', $decoded_token->user);
            Flight::set('jwt_token', $token);
            
            error_log("AUTH SUCCESS: User set successfully - ID: " . $decoded_token->user->id);
            error_log("=== AUTH MIDDLEWARE END ===");
            return TRUE;
        } catch (\Firebase\JWT\ExpiredException $e) {
            error_log("AUTH FAILED: Token expired - " . $e->getMessage());
            Flight::halt(401, json_encode([
                'error' => 'Token expired',
                'message' => $e->getMessage()
            ]));
        } catch (\Firebase\JWT\SignatureInvalidException $e) {
            error_log("AUTH FAILED: Invalid signature - " . $e->getMessage());
            Flight::halt(401, json_encode([
                'error' => 'Invalid token signature',
                'message' => $e->getMessage()
            ]));
        } catch (\Exception $e) {
            error_log("AUTH FAILED: JWT decode error - " . $e->getMessage());
            error_log("Exception type: " . get_class($e));
            Flight::halt(401, json_encode([
                'error' => 'Invalid token',
                'message' => $e->getMessage(),
                'type' => get_class($e)
            ]));
        }
    }

    public function authorizeRole($requiredRole) {
        $user = Flight::get('user');
        if ($user->role !== $requiredRole) {
            Flight::halt(403, 'Access denied: insufficient privileges');
        }
    }

    public function authorizeRoles($roles) {
        $user = Flight::get('user');
        if (!in_array($user->role, $roles)) {
            Flight::halt(403, 'Forbidden: role not allowed');
        }
    }

    function authorizePermission($permission) {
        $user = Flight::get('user');
        if (!in_array($permission, $user->permissions)) {
            Flight::halt(403, 'Access denied: permission missing');
        }
    }
}
?> 