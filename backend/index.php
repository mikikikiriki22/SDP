<?php
require __DIR__ . '/vendor/autoload.php';

// Load services
require __DIR__ . '/rest/services/AuthService.php';
require __DIR__ . '/rest/services/ParfumeService.php';
require __DIR__ . '/rest/services/UserService.php';
require __DIR__ . '/rest/services/ReviewService.php';
require __DIR__ . '/rest/services/BrandService.php';
require __DIR__ . '/rest/services/NoteService.php';

// Load middleware
require_once __DIR__ . '/middleware/AuthMiddleware.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Error reporting - disabled for production
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);

// ===========================================================================
// SERVICE REGISTRATION
// ===========================================================================
Flight::register('auth_service', 'AuthService');
Flight::register('parfume_service', 'ParfumeService');
Flight::register('user_service', 'UserService');
Flight::register('review_service', 'ReviewService');
Flight::register('brand_service', 'BrandService');
Flight::register('note_service', 'NoteService');

Flight::register('auth_middleware', 'AuthMiddleware');
// Use same secret as AuthService (Config::JWT_SECRET) so sign and verify match
require_once __DIR__ . '/rest/dao/config.php';
Flight::map('JWT_SECRET', function () { return Config::JWT_SECRET(); });

// ===========================================================================
// AUTHENTICATION MIDDLEWARE
// ===========================================================================
// GLOBAL MIDDLEWARE (runs before all routes)
// Handles CORS and Authentication
// ===========================================================================
Flight::before('start', function () {
    // CORS headers for all requests
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, Authentication');
    
    if (Flight::request()->method == 'OPTIONS') {
        Flight::halt(200);
    }

    // Authentication check
    $public_routes = [
        '/auth/login', '/auth/register', '/auth/verify',
        '/perfumes', '/parfumes', '/brands', '/notes', '/reviews',
        '/login', '/register'
    ];
    $request_url = rtrim(Flight::request()->url, '/');
    $is_public_route = false;

    if (Flight::request()->method === 'GET') {
        foreach ($public_routes as $route) {
            if ($request_url === $route) { $is_public_route = true; break; }
        }
        if (!$is_public_route && (
            preg_match('#^/parfumes/\d+$#', $request_url) ||
            preg_match('#^/reviews/fragrance/\d+$#', $request_url) ||
            preg_match('#^/reviews/user/\d+$#', $request_url) ||
            preg_match('#^/reviews/\d+$#', $request_url) ||
            preg_match('#^/share/review/\d+$#', $request_url) ||
            preg_match('#^/uploads/.+#', $request_url)
        )) {
            $is_public_route = true;
        }
    }
    if (!$is_public_route && Flight::request()->method === 'POST') {
        if (in_array($request_url, ['/auth/login', '/auth/register', '/login', '/register'])) {
            $is_public_route = true;
        }
        if (strpos($request_url, '/upload/image') !== false) $is_public_route = false;
    }

    if ($is_public_route) {
        error_log("Public route detected: " . $request_url . " - skipping auth");
        return true;
    }

    // Protected routes: require valid JWT
    error_log("Protected route detected: " . $request_url . " - checking auth");
    
    try {
        // Use native headers to be more robust across environments
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $token = null;

        if (!empty($headers)) {
            if (isset($headers['Authentication'])) {
                $token = $headers['Authentication'];
            } elseif (isset($headers['authentication'])) {
                $token = $headers['authentication'];
            }
        }

        // Fallback to Flight's header helper if nothing found
        if (!$token) {
            $token = Flight::request()->getHeader("Authentication");
        }

        // DEBUG - Token extraction
        error_log("=== INDEX.PHP AUTH DEBUG ===");
        error_log("Request URL: " . $request_url);
        error_log("Request Method: " . Flight::request()->method);
        error_log("All headers: " . json_encode($headers));
        error_log("Token extracted: " . ($token ? substr($token, 0, 20) . "..." : "NULL"));
        error_log("============================");

        if (Flight::auth_middleware()->verifyToken($token)) {
            error_log("Middleware verifyToken returned TRUE");
            return TRUE;
        } else {
            error_log("Middleware verifyToken returned FALSE (should not reach here)");
            Flight::halt(401, json_encode(['error' => 'Authentication failed', 'debug' => 'verifyToken returned false']));
        }
    } catch (\Exception $e) {
        error_log("CAUGHT EXCEPTION in index.php middleware: " . $e->getMessage());
        error_log("Exception trace: " . $e->getTraceAsString());
        Flight::halt(401, json_encode([
            'error' => 'Authentication exception',
            'message' => $e->getMessage(),
            'type' => get_class($e)
        ]));
    }
});

// Route definitions...
// ...
// Flight::start(); should be at the end

// ===========================================================================
// ROUTE DEFINITIONS
// ===========================================================================
require_once __DIR__ . '/rest/routes/AuthRoutes.php';
require_once __DIR__ . '/rest/routes/ParfumeRoute.php';
require_once __DIR__ . '/rest/routes/UserRoutes.php';
require_once __DIR__ . '/rest/routes/ReviewRoutes.php';
require_once __DIR__ . '/rest/routes/BrandRoutes.php';
require_once __DIR__ . '/rest/routes/NoteRoutes.php';
require_once __DIR__ . '/rest/routes/UploadRoute.php';
require_once __DIR__ . '/rest/routes/ShareRoute.php';

Flight::route('/', function () { echo 'AromaVerse API'; });
Flight::start();


