<?php
require 'vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// ================== CONFIGURATION ================== //
require_once 'backend/dao/config.php';
require_once 'backend/data/roles.php'; // Role constants

// ================== SERVICE REGISTRATION ================== //
require_once 'backend/services/AuthService.php';
require_once 'backend/middleware/AuthMiddleware.php';

Flight::register('auth_service', 'AuthService');
Flight::register('auth_middleware', 'AuthMiddleware');

// ================== ROUTE INCLUDES ================== //
require_once 'backend/routes/AuthRoutes.php';
require_once 'backend/routes/userRoute.php';
require_once 'backend/routes/appointmentRoute.php';
require_once 'backend/routes/healthGoalsRoute.php';
require_once 'backend/routes/mealPlansRoute.php';
require_once 'backend/routes/contactFormRoute.php';

// ================== MIDDLEWARE ================== //
Flight::route('/*', function() {
    error_log("Middleware triggered for: " . Flight::request()->url);
    
    // Public routes (no JWT required)
    $publicRoutes = [
        '/', 
        '/index.html',
        '/auth/login', 
        '/backend/auth/login',
        '/auth/register',
        '/backend/auth/register',
        '/debug/db',
        '/debug/table',
        '/debug/db-test',
        '/debug/health-goals/user', // For health goals retrieval
        '/debug/update-healthgoal', // For updating health goals
        '/debug/add-healthgoal'     // For adding health goals
    ];
    
    $currentUrl = rtrim(strtok(Flight::request()->url, '?'), '/');
    error_log("Current URL: $currentUrl");

    // Try both with and without trailing slash, and log the match
    $isPublicRoute = false;
    foreach ($publicRoutes as $route) {
        $normalizedRoute = rtrim($route, '/');
        
        // Check for exact match
        if ($currentUrl === $normalizedRoute || $currentUrl === $route) {
            error_log("Matched public route: $route");
            $isPublicRoute = true;
            break;
        }
        
        // Check for routes with parameters (starting with the base route)
        if (strpos($currentUrl, $normalizedRoute . '/') === 0) {
            error_log("Matched public route with parameters: $route");
            $isPublicRoute = true;
            break;
        }
    }
    
    if ($isPublicRoute) {
        return true;
    }

    // Skip authentication for static assets and frontend files
    if (strpos($currentUrl, '/assets/') === 0 || 
        strpos($currentUrl, '/frontend/') === 0 ||
        strpos($currentUrl, '/utils/') === 0 ||
        strpos($currentUrl, '/services/') === 0 ||
        strpos($currentUrl, '/pages/') === 0) {
        return true;
    }

    // Special handling for health-goals POST requests during registration
    if (strpos($currentUrl, '/health-goals') === 0 && Flight::request()->method === 'POST') {
        // For registration flow, we'll validate the user in the route handler
        return true;
    }

    // JWT Verification for protected routes
    try {
        $headers = getallheaders();
        error_log("Headers: " . print_r($headers, true));
        
        if (!isset($headers['Authorization'])) {
            error_log("Missing Authorization header");
            Flight::halt(401, json_encode([
                'success' => false,
                'error' => 'Missing authorization header'
            ]));
            return false;
        }

        $authHeader = $headers['Authorization'];
        if (strpos($authHeader, 'Bearer ') !== 0) {
            error_log("Invalid Authorization header format");
            Flight::halt(401, json_encode([
                'success' => false,
                'error' => 'Invalid authorization header format'
            ]));
            return false;
        }

        $token = substr($authHeader, 7);
        error_log("Token received: " . substr($token, 0, 20) . "...");
        
        // Decode and verify token
        $decoded = JWT::decode($token, new Key(Config::JWT_SECRET(), 'HS256'));
        error_log("Decoded token data: " . print_r($decoded, true));
        
        // Store user data in Flight
        if (isset($decoded->user)) {
            // Store the decoded token and user data as objects
            Flight::set('decoded_token', $decoded);
            Flight::set('user', $decoded->user);
            
            error_log("User data stored in Flight: " . print_r($decoded->user, true));
            error_log("Decoded token stored in Flight: " . print_r($decoded, true));
            
            // Verify the data was stored
            $storedUser = Flight::get('user');
            $storedToken = Flight::get('decoded_token');
            error_log("Verification - Stored user data: " . print_r($storedUser, true));
            error_log("Verification - Stored token data: " . print_r($storedToken, true));
            
            // Also store in session for persistence
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $_SESSION['user'] = $decoded->user;
            $_SESSION['decoded_token'] = $decoded;
            
            error_log("User data stored in session: " . print_r($_SESSION['user'], true));
        } else {
            error_log("Token missing user data");
            Flight::halt(401, json_encode([
                'success' => false,
                'error' => 'Invalid token structure - missing user data'
            ]));
            return false;
        }
        
        return true;
        
    } catch (Exception $e) {
        error_log("JWT Error: " . $e->getMessage());
        Flight::halt(401, json_encode([
            'success' => false,
            'error' => 'Invalid or expired token',
            'details' => $e->getMessage()
        ]));
        return false;
    }
});

// ================== BASE ROUTE ================== //
Flight::route('/', function() {
    echo 'Welcome to the NutriLife API!';
});

// ================== DEBUG ROUTES ================== //
Flight::route('/debug/db', function() {
    try {
        $conn = Database::connect();
        $test = $conn->query("SELECT 1")->fetch();
        Flight::json(['success' => true, 'db' => $test]);
    } catch (PDOException $e) {
        Flight::json(['success' => false, 'error' => $e->getMessage()]);
    }
});

Flight::route('/debug/table', function() {
    try {
        $conn = Database::connect();
        $structure = $conn->query("DESCRIBE users")->fetchAll(PDO::FETCH_ASSOC);
        Flight::json(['success' => true, 'data' => $structure]);
    } catch (PDOException $e) {
        Flight::json(['success' => false, 'error' => $e->getMessage()]);
    }
});

Flight::route('/debug/healthgoals-table', function() {
    try {
        $conn = Database::connect();
        $structure = $conn->query("DESCRIBE healthgoals")->fetchAll(PDO::FETCH_ASSOC);
        Flight::json(['success' => true, 'data' => $structure]);
    } catch (PDOException $e) {
        Flight::json(['success' => false, 'error' => $e->getMessage()]);
    }
});

Flight::route('/debug/test-healthgoal', function() {
    try {
        $conn = Database::connect();
        // Get a valid user ID from the database
        $user = $conn->query("SELECT id FROM users ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        $userId = $user['id'];
        
        // Try to insert a health goal directly
        $stmt = $conn->prepare("INSERT INTO healthgoals (user_id, goal_type, target_value, current_value, deadline) VALUES (?, ?, ?, ?, ?)");
        $goalType = 'LoseWeight';
        $targetValue = '100';
        $currentValue = '0';
        $deadline = date('Y-m-d', strtotime('+3 months'));
        
        $result = $stmt->execute([$userId, $goalType, $targetValue, $currentValue, $deadline]);
        $newId = $conn->lastInsertId();
        
        if ($result) {
            $newGoal = $conn->query("SELECT * FROM healthgoals WHERE id = $newId")->fetch(PDO::FETCH_ASSOC);
            Flight::json([
                'success' => true, 
                'message' => 'Health goal created successfully',
                'data' => $newGoal
            ]);
        } else {
            Flight::json([
                'success' => false, 
                'message' => 'Failed to create health goal',
                'error' => $stmt->errorInfo()
            ]);
        }
    } catch (PDOException $e) {
        Flight::json([
            'success' => false, 
            'error' => $e->getMessage(),
            'code' => $e->getCode()
        ]);
    }
});

Flight::route('/debug/db-test', function() {
    try {
        $conn = Database::connect();
        $testInsert = $conn->exec("INSERT INTO users (username, email, password, role) VALUES ('phptest', 'phptest@test.com', 'testpass', 'Client')");
        $id = $conn->lastInsertId();
        $user = $conn->query("SELECT * FROM users WHERE id = $id")->fetch(PDO::FETCH_ASSOC);
        
        // Clean up test data
        $conn->exec("DELETE FROM users WHERE id = $id");
        
        Flight::json([
            'success' => true,
            'data' => [
                'insert_result' => $testInsert,
                'last_id' => $id,
                'user' => $user
            ]
        ]);
    } catch (PDOException $e) {
        Flight::json(['success' => false, 'error' => $e->getMessage()]);
    }
});

Flight::route('/debug/insert-healthgoal', function() {
    try {
        $conn = Database::connect();
        
        // Get the latest user ID as our test subject
        $userQuery = $conn->query("SELECT id FROM users ORDER BY id DESC LIMIT 1");
        $user = $userQuery->fetch(PDO::FETCH_ASSOC);
        $userId = $user['id'];
        
        error_log("Attempting to insert health goal for user ID: " . $userId);
        
        // Check database table structure
        $tableInfo = $conn->query("DESCRIBE healthgoals")->fetchAll(PDO::FETCH_ASSOC);
        error_log("Table structure: " . print_r($tableInfo, true));
        
        // Insert a test goal directly using PDO
        $stmt = $conn->prepare("INSERT INTO healthgoals (user_id, goal_type, target_value, current_value, deadline) VALUES (?, ?, ?, ?, ?)");
        $goalType = 'LoseWeight'; // Make sure this is a valid value in the SET
        $targetValue = '100';
        $currentValue = '0';
        $deadline = date('Y-m-d', strtotime('+3 months'));
        
        error_log("Executing with parameters: " . print_r([$userId, $goalType, $targetValue, $currentValue, $deadline], true));
        
        $result = $stmt->execute([$userId, $goalType, $targetValue, $currentValue, $deadline]);
        $newId = $conn->lastInsertId();
        
        if (!$result) {
            $errorInfo = $stmt->errorInfo();
            error_log("SQL error: " . print_r($errorInfo, true));
            Flight::json([
                'success' => false,
                'message' => 'Failed to create health goal',
                'error' => $errorInfo
            ], 400);
            return;
        }
        
        // Verify the insert worked by retrieving the new record
        $goal = $conn->query("SELECT * FROM healthgoals WHERE id = $newId")->fetch(PDO::FETCH_ASSOC);
        
        Flight::json([
            'success' => true,
            'message' => 'Test health goal created',
            'data' => [
                'inserted_id' => $newId,
                'goal' => $goal,
                'parameters_used' => [
                    'user_id' => $userId,
                    'goal_type' => $goalType,
                    'target_value' => $targetValue,
                    'current_value' => $currentValue,
                    'deadline' => $deadline
                ]
            ]
        ]);
    } catch (PDOException $e) {
        error_log("PDO Exception: " . $e->getMessage() . "\nCode: " . $e->getCode() . "\nTrace: " . $e->getTraceAsString());
        Flight::json([
            'success' => false,
            'error' => $e->getMessage(),
            'code' => $e->getCode(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

Flight::route('/debug/zero-value-test', function() {
    try {
        $conn = Database::connect();
        
        // Get the latest user ID as our test subject
        $userQuery = $conn->query("SELECT id FROM users ORDER BY id DESC LIMIT 1");
        $user = $userQuery->fetch(PDO::FETCH_ASSOC);
        $userId = $user['id'];
        
        error_log("Testing zero current_value for user ID: " . $userId);
        
        // Test various types of zero values to see what works
        $testValues = [
            'string_zero' => [
                'user_id' => $userId,
                'goal_type' => 'LoseWeight',
                'target_value' => '100',
                'current_value' => '0',
                'deadline' => date('Y-m-d', strtotime('+3 months'))
            ],
            'int_zero' => [
                'user_id' => $userId,
                'goal_type' => 'BuildMuscle',
                'target_value' => '100',
                'current_value' => 0,
                'deadline' => date('Y-m-d', strtotime('+3 months'))
            ],
            'float_zero' => [
                'user_id' => $userId,
                'goal_type' => 'ImproveStamina',
                'target_value' => '100',
                'current_value' => 0.0,
                'deadline' => date('Y-m-d', strtotime('+3 months'))
            ]
        ];
        
        $results = [];
        
        foreach ($testValues as $testName => $data) {
            try {
                $stmt = $conn->prepare("INSERT INTO healthgoals (user_id, goal_type, target_value, current_value, deadline) VALUES (?, ?, ?, ?, ?)");
                $result = $stmt->execute([
                    $data['user_id'],
                    $data['goal_type'],
                    $data['target_value'],
                    $data['current_value'],
                    $data['deadline']
                ]);
                
                if ($result) {
                    $newId = $conn->lastInsertId();
                    $goal = $conn->query("SELECT * FROM healthgoals WHERE id = $newId")->fetch(PDO::FETCH_ASSOC);
                    $results[$testName] = [
                        'success' => true,
                        'id' => $newId,
                        'data' => $goal,
                        'input' => $data
                    ];
                } else {
                    $results[$testName] = [
                        'success' => false,
                        'error' => $stmt->errorInfo(),
                        'input' => $data
                    ];
                }
            } catch (Exception $e) {
                $results[$testName] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                    'input' => $data
                ];
            }
        }
        
        Flight::json([
            'success' => true,
            'message' => 'Zero value tests completed',
            'results' => $results
        ]);
    } catch (PDOException $e) {
        Flight::json([
            'success' => false,
            'error' => $e->getMessage(),
            'code' => $e->getCode()
        ], 500);
    }
});

// ================== PROTECTED ROUTE EXAMPLE ================== //
Flight::route('GET /auth/me', function() {
    $user = Flight::get('user');
    Flight::json([
        'success' => true,
        'data' => $user
    ]);
});

Flight::route('/debug/health-goals/user/@userId', function($userId) {
    try {
        $conn = Database::connect();
        
        // Get health goals for the specified user
        $stmt = $conn->prepare("SELECT * FROM healthgoals WHERE user_id = ?");
        $stmt->execute([$userId]);
        $goals = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Flight::json([
            'success' => true,
            'data' => $goals
        ]);
    } catch (PDOException $e) {
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

Flight::route('/debug/add-healthgoal/@userId/@goalType/@targetValue/@currentValue', function($userId, $goalType, $targetValue, $currentValue) {
    try {
        $conn = Database::connect();
        
        // Insert a health goal with the provided parameters
        $stmt = $conn->prepare("INSERT INTO healthgoals (user_id, goal_type, target_value, current_value, deadline) VALUES (?, ?, ?, ?, ?)");
        $deadline = date('Y-m-d', strtotime('+3 months'));
        
        $result = $stmt->execute([
            $userId, 
            $goalType, 
            $targetValue, 
            $currentValue, 
            $deadline
        ]);
        $newId = $conn->lastInsertId();
        
        if (!$result) {
            $errorInfo = $stmt->errorInfo();
            error_log("SQL error: " . print_r($errorInfo, true));
            Flight::json([
                'success' => false,
                'message' => 'Failed to create health goal',
                'error' => $errorInfo
            ], 400);
            return;
        }
        
        // Retrieve the new record
        $goal = $conn->query("SELECT * FROM healthgoals WHERE id = $newId")->fetch(PDO::FETCH_ASSOC);
        
        Flight::json([
            'success' => true,
            'message' => 'Health goal created successfully',
            'data' => $goal
        ]);
    } catch (PDOException $e) {
        error_log("PDO Exception: " . $e->getMessage());
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

Flight::route('/debug/update-healthgoal/@id/@currentValue', function($id, $currentValue) {
    try {
        $conn = Database::connect();
        
        // Validate the goal exists
        $stmt = $conn->prepare("SELECT * FROM healthgoals WHERE id = ?");
        $stmt->execute([$id]);
        $goal = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$goal) {
            Flight::json([
                'success' => false,
                'message' => 'Health goal not found'
            ], 404);
            return;
        }
        
        // Update the current value
        $updateStmt = $conn->prepare("UPDATE healthgoals SET current_value = ? WHERE id = ?");
        $result = $updateStmt->execute([$currentValue, $id]);
        
        if (!$result) {
            $errorInfo = $updateStmt->errorInfo();
            Flight::json([
                'success' => false,
                'message' => 'Failed to update health goal',
                'error' => $errorInfo
            ], 400);
            return;
        }
        
        // Get the updated goal
        $stmt = $conn->prepare("SELECT * FROM healthgoals WHERE id = ?");
        $stmt->execute([$id]);
        $updatedGoal = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Flight::json([
            'success' => true,
            'message' => 'Health goal updated successfully',
            'data' => $updatedGoal
        ]);
    } catch (PDOException $e) {
        error_log("Error updating health goal: " . $e->getMessage());
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// DEBUG ROUTE - REMOVE AFTER TESTING
Flight::route('GET /debug/userdata', function() {
    header('Content-Type: application/json');
    echo json_encode([
        'user_data' => Flight::get('user'),
        'decoded_token' => Flight::get('decoded_token'),
        'server' => [
            'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'NOT FOUND',
            'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD']
        ]
    ], JSON_PRETTY_PRINT);
});

// Add this if you want to check middleware execution
Flight::route('GET /debug/middleware', function() {
    echo "<pre>Middleware Debug:\n";
    print_r(Flight::router()->getRoutes());
    echo "</pre>";
});

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Authorization, Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");

Flight::start();