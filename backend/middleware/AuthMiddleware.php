<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware {
    public function verifyToken($token) {
        if (!$token) {
            Flight::halt(401, "Missing authentication header");
        }

        try {
            // Log attempts to decode JWT for easier debugging
            error_log("Attempting to decode token with secret: " . Flight::JWT_SECRET());
            $decoded_token = JWT::decode($token, new Key(Flight::JWT_SECRET(), 'HS256'));
            error_log("Token decoded successfully");

            Flight::set('user', $decoded_token->user);
            Flight::set('jwt_token', $token);
            return TRUE;
        } catch (\Exception $e) {
            // Log the exact JWT error and return a clear 401 message
            error_log("JWT decode error: " . $e->getMessage());
            Flight::halt(401, "Invalid token: " . $e->getMessage());
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