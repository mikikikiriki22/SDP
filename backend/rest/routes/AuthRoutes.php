<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

require_once __DIR__ . "/../services/AuthService.php";


// making parfume service class accesible
Flight::register('authService', 'AuthService');



//REGISTER

/**
 * @OA\Post(
 *     path="/register",
 *     tags={"Auth"},
 *     summary="Register a new user",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"email", "username", "password", "gender"},
 *             @OA\Property(property="email", type="string", example="user@example.com"),
 *             @OA\Property(property="username", type="string", example="john_doe"),
 *             @OA\Property(property="password", type="string", example="securePass123"),
 *             @OA\Property(property="gender", type="string", example="male")
 *         )
 *     ),
 *     @OA\Response(
 *         response=201,
 *         description="User registered successfully"
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Registration failed due to validation error or existing user"
 *     )
 * )
 */

Flight::route('POST /register', function () {
    
    // Get the request data (email, username, password, gender)
    $data = Flight::request()->data->getData();

    try {
        // Call register method of AuthService
        $authService = new AuthService();
        $result = $authService->register($data);  // Register the user

        // Return a success response
        Flight::json(['message' => 'User registered successfully', 'user' => $result['data']], 201);
    
    } catch (Exception $e) {
        // In case of error (validation or already existing user), return an error message
        Flight::json(['error' => $e->getMessage()], 400);
    }
});



//LOGIN

/**
 * @OA\Post(
 *     path="/login",
 *     tags={"Auth"},
 *     summary="User login",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"email", "password"},
 *             @OA\Property(property="email", type="string", example="user@example.com"),
 *             @OA\Property(property="password", type="string", example="securePass123")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Login successful"
 *     ),
 *     @OA\Response(
 *         response=401,
 *         description="Unauthorized - invalid credentials"
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Bad request - missing data or server error"
 *     )
 * )
 */

Flight::route('POST /login', function () {
    $data = Flight::request()->data->getData();
    try {
        $authService = new AuthService();
        $result = $authService->login($data);  // Try to login with provided credentials
        if ($result['success']) {
            Flight::json(['message' => 'Login successful', 'user' => $result['data']], 200);
        } else {
            Flight::json(['error' => $result['error']], 401);
        }
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

Flight::group('/auth', function() {
    /**
     * @OA\Post(
     *     path="/auth/register",
     *     summary="Register new user",
     *     description="Add a new user to the database",
     *     tags={"auth"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email", "password", "username"},
     *             @OA\Property(property="email", type="string", format="email", example="user@example.com"),
     *             @OA\Property(property="password", type="string", format="password", example="password123"),
     *             @OA\Property(property="username", type="string", example="johndoe")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="User registered successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="User registered successfully"),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Invalid input data"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Internal server error"
     *     )
     * )
     */
    Flight::route("POST /register", function() {
        $data = Flight::request()->data->getData();
        
        // Validate required fields
        if (!isset($data['email']) || !isset($data['password']) || !isset($data['username'])) {
            Flight::halt(400, json_encode([
                'error' => 'Missing required fields'
            ]));
        }

        // Validate email format
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            Flight::halt(400, json_encode([
                'error' => 'Invalid email format'
            ]));
        }

        $response = Flight::auth_service()->register($data);
        
        if ($response['success']) {
            Flight::json([
                'message' => 'User registered successfully',
                'data' => $response['data']
            ]);
        } else {
            Flight::halt(500, json_encode([
                'error' => $response['error']
            ]));
        }
    });

    /**
     * @OA\Post(
     *     path="/auth/login",
     *     summary="Login to system",
     *     description="Login using email and password",
     *     tags={"auth"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email", "password"},
     *             @OA\Property(property="email", type="string", format="email", example="user@example.com"),
     *             @OA\Property(property="password", type="string", format="password", example="password123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Login successful"),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="token", type="string"),
     *                 @OA\Property(property="user", type="object")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Invalid credentials"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Internal server error"
     *     )
     * )
     */
    Flight::route('POST /login', function() {
        $data = Flight::request()->data->getData();
        
        // Validate required fields
        if (!isset($data['email']) || !isset($data['password'])) {
            Flight::halt(400, json_encode([
                'error' => 'Missing required fields'
            ]));
        }

        $response = Flight::auth_service()->login($data);
        
        if ($response['success']) {
            Flight::json([
                'message' => 'Login successful',
                'data' => $response['data']
            ]);
        } else {
            Flight::halt(401, json_encode([
                'error' => $response['error']
            ]));
        }
    });

    /**
     * @OA\Get(
     *     path="/auth/verify",
     *     summary="Verify JWT token",
     *     description="Verify if the provided JWT token is valid",
     *     tags={"auth"},
     *     security={{"bearerAuth": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Token is valid",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Token is valid"),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Invalid or expired token"
     *     )
     * )
     */
    Flight::route('GET /verify', function() {
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

        if (!$token) {
            Flight::halt(401, json_encode([
                'error' => 'No token provided'
            ]));
        }

        try {
            $decoded = JWT::decode($token, new Key(Flight::JWT_SECRET(), 'HS256'));
            Flight::json([
                'message' => 'Token is valid',
                'data' => $decoded
            ]);
        } catch (Exception $e) {
            Flight::halt(401, json_encode([
                'error' => 'Invalid token'
            ]));
        }
    });
});
?>

