<?php
require_once 'backend\services\HealthGoalsService.php';
require_once 'backend/data/roles.php';

$healthGoalsService = new HealthGoalsService();

/**
 * @OA\Post(
 *     path="/health-goals",
 *     tags={"Health Goals"},
 *     summary="Add a new health goal",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"user_id", "goal_type", "target_value", "current_value", "deadline"},
 *             @OA\Property(property="user_id", type="integer", example=1),
 *             @OA\Property(property="goal_type", type="string", example="LoseWeight"),
 *             @OA\Property(property="target_value", type="number", example=10),
 *             @OA\Property(property="current_value", type="number", example=2),
 *             @OA\Property(property="deadline", type="string", format="date", example="2023-12-31")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Health goal added successfully"
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - can only add goals for yourself"
 *     )
 * )
 */
Flight::route('POST /health-goals', function() use ($healthGoalsService) {
    // Get all request data, including form data, JSON data, and query parameters
    $formData = Flight::request()->data->getData();
    $queryParams = Flight::request()->query->getData();
    $rawData = file_get_contents('php://input');
    
    error_log("Health goals POST received");
    error_log("Form data: " . print_r($formData, true));
    error_log("Query params: " . print_r($queryParams, true));
    error_log("Raw input: " . $rawData);
    
    // Try to parse raw data as JSON if it's not empty
    if (!empty($rawData)) {
        $jsonData = json_decode($rawData, true);
        error_log("Parsed JSON data: " . ($jsonData ? print_r($jsonData, true) : "Invalid JSON"));
    }
    
    // Merge all data sources to try to get complete data
    $data = array_merge($queryParams, $formData);
    if (!empty($jsonData) && is_array($jsonData)) {
        $data = array_merge($data, $jsonData);
    }
    
    error_log("Final merged data: " . print_r($data, true));
    
    // Check if we're in an authenticated context
    $currentUser = Flight::get('user');
    
    // If we have a user in the context, verify permissions
    if ($currentUser) {
        error_log("Authenticated user creating health goal: " . $currentUser->id);
        // Both clients and nutritionists can add health goals
        Flight::auth_middleware()->authorizeRoles([Roles::CLIENT, Roles::NUTRITIONIST]);
        
        // Users can only add goals for themselves
        if ($currentUser->id != $data['user_id']) {
            Flight::halt(403, json_encode([
                'success' => false,
                'error' => 'You can only add health goals for yourself'
            ]));
        }
    } else {
        error_log("Unauthenticated health goal creation (registration flow)");
    }
    // Otherwise this is likely part of registration flow
    
    try {
        // Ensure all required fields are present
        if (empty($data['user_id'])) {
            error_log("Missing user_id field");
        }
        if (empty($data['goal_type'])) {
            error_log("Missing goal_type field");
        }
        if (empty($data['target_value'])) {
            error_log("Missing target_value field");
        }
        // Special check for current_value since 0 is a valid value but evaluates to empty()
        if (!isset($data['current_value']) || $data['current_value'] === '') {
            error_log("Missing current_value field");
        }
        if (empty($data['deadline'])) {
            error_log("Missing deadline field");
        }
        
        if (empty($data['user_id']) || empty($data['goal_type']) || 
            empty($data['target_value']) || 
            (!isset($data['current_value']) || $data['current_value'] === '') || 
            empty($data['deadline'])) {
            
            error_log("Missing required fields for health goal");
            Flight::json([
                'success' => false,
                'error' => 'Missing required fields for health goal'
            ], 400);
            return;
        }
        
        // Try inserting directly with PDO as a fallback
        try {
            $conn = Database::connect();
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
                $newGoal = $conn->query("SELECT * FROM healthgoals WHERE id = $newId")->fetch(PDO::FETCH_ASSOC);
                error_log("Health goal added directly: " . print_r($newGoal, true));
                Flight::json([
                    'success' => true,
                    'data' => $newGoal,
                    'message' => 'Health goal created successfully with direct PDO'
                ]);
                return;
            } else {
                error_log("PDO direct insert failed: " . print_r($stmt->errorInfo(), true));
            }
        } catch (Exception $directError) {
            error_log("Direct PDO error: " . $directError->getMessage());
        }
        
        // Fall back to regular service method if direct insert fails
        $goal = $healthGoalsService->addHealthGoal($data);
        error_log("Health goal added through service: " . print_r($goal, true));
        Flight::json([
            'success' => true,
            'data' => $goal
        ]);
    } catch (Exception $e) {
        error_log("Error adding health goal: " . $e->getMessage());
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 400);
    }
});

/**
 * @OA\Put(
 *     path="/health-goals/{id}/current-value",
 *     tags={"Health Goals"},
 *     summary="Update the current value of a health goal",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"current_value"},
 *             @OA\Property(property="current_value", type="number", example=5)
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Current value updated successfully"
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - can only update your own goals"
 *     )
 * )
 */
Flight::route('PUT /health-goals/@id/current-value', function($id) use ($healthGoalsService) {
    // Both clients and nutritionists can update their goals
    Flight::auth_middleware()->authorizeRoles([Roles::CLIENT, Roles::NUTRITIONIST]);
    
    // Get the goal to verify ownership
    $goal = $healthGoalsService->getHealthGoalById($id);
    if (!$goal) {
        Flight::halt(404, json_encode(['error' => 'Health goal not found']));
    }
    
    // Users can only update their own goals
    $currentUser = Flight::get('user');
    if ($currentUser->id != $goal['user_id']) {
        Flight::halt(403, json_encode([
            'error' => 'You can only update your own health goals'
        ]));
    }
    
    $data = Flight::request()->data->getData();
    try {
        $goal = $healthGoalsService->updateCurrentValue($id, $data['current_value']);
        Flight::json($goal);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

/**
 * @OA\Put(
 *     path="/health-goals/{id}/deadline",
 *     tags={"Health Goals"},
 *     summary="Update the deadline of a health goal",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"deadline"},
 *             @OA\Property(property="deadline", type="string", format="date", example="2023-12-31")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Deadline updated successfully"
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - can only update your own goals"
 *     )
 * )
 */
Flight::route('PUT /health-goals/@id/deadline', function($id) use ($healthGoalsService) {
    // Both clients and nutritionists can update their goals
    Flight::auth_middleware()->authorizeRoles([Roles::CLIENT, Roles::NUTRITIONIST]);
    
    // Get the goal to verify ownership
    $goal = $healthGoalsService->getHealthGoalById($id);
    if (!$goal) {
        Flight::halt(404, json_encode(['error' => 'Health goal not found']));
    }
    
    // Users can only update their own goals
    $currentUser = Flight::get('user');
    if ($currentUser->id != $goal['user_id']) {
        Flight::halt(403, json_encode([
            'error' => 'You can only update your own health goals'
        ]));
    }
    
    $data = Flight::request()->data->getData();
    try {
        $goal = $healthGoalsService->updateDeadline($id, $data['deadline']);
        Flight::json($goal);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

/**
 * @OA\Get(
 *     path="/health-goals/user/{userId}",
 *     tags={"Health Goals"},
 *     summary="Get health goals by user ID",
 *     @OA\Parameter(
 *         name="userId",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="List of health goals"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - can only view your own goals"
 *     )
 * )
 */
Flight::route('GET /health-goals/user/@userId', function($userId) use ($healthGoalsService) {
    // Both clients and nutritionists can view health goals
    Flight::auth_middleware()->authorizeRoles([Roles::CLIENT, Roles::NUTRITIONIST]);
    
    // Users can only view their own goals
    $currentUser = Flight::get('user');
    if ($currentUser->id != $userId) {
        Flight::halt(403, json_encode([
            'error' => 'You can only view your own health goals'
        ]));
    }
    
    Flight::json($healthGoalsService->getHealthGoalsByUserId($userId));
});
?>