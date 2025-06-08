<?php
require_once 'backend\services\MealPlansService.php';
require_once 'backend/data/roles.php'; // Include roles constants

$mealPlansService = new MealPlansService();

/**
 * @OA\Post(
 *     path="/backend/meal-plans",
 *     tags={"Meal Plans"},
 *     summary="Create a new meal plan",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"user_id", "nutritionist_id", "title", "description", "meals"},
 *             @OA\Property(property="user_id", type="integer", example=1),
 *             @OA\Property(property="nutritionist_id", type="integer", example=2),
 *             @OA\Property(property="title", type="string", example="Weight Loss Plan"),
 *             @OA\Property(property="description", type="string", example="A detailed plan for weight loss."),
 *             @OA\Property(property="meals", type="array", @OA\Items(type="string"), example={"Breakfast: Oatmeal", "Lunch: Grilled Chicken", "Dinner: Salad"})
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Meal plan created successfully"
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - only nutritionists can create meal plans"
 *     )
 * )
 */
Flight::route('POST /backend/meal-plans', function() use ($mealPlansService) {
    // Only nutritionists can create meal plans
    Flight::auth_middleware()->authorizeRole(Roles::NUTRITIONIST);
    
    $data = Flight::request()->data->getData();
    
    // Verify the nutritionist is creating plan for their client
    $currentUser = Flight::get('user');
    if ($currentUser->id != $data['nutritionist_id']) {
        Flight::halt(403, json_encode([
            'error' => 'You can only create meal plans as yourself'
        ]));
    }
    
    try {
        $mealPlan = $mealPlansService->createMealPlan($data);
        Flight::json($mealPlan);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

/**
 * @OA\Put(
 *     path="/backend/meal-plans/{id}",
 *     tags={"Meal Plans"},
 *     summary="Update a meal plan",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Meal plan updated successfully"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - only nutritionists can update meal plans"
 *     )
 * )
 */
Flight::route('PUT /backend/meal-plans/@id', function($id) use ($mealPlansService) {
    try {
        $data = Flight::request()->data->getData();
        $mealPlan = $mealPlansService->updateMealPlan($id, $data);
        Flight::json([
            'success' => true,
            'message' => 'Meal plan updated successfully',
            'data' => $mealPlan
        ]);
    } catch (Exception $e) {
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

Flight::route('DELETE /backend/meal-plans/@id', function($id) use ($mealPlansService) {
    try {
        $result = $mealPlansService->deleteMealPlan($id);
        if ($result) {
            Flight::json([
                'success' => true,
                'message' => 'Meal plan deleted successfully'
            ]);
        } else {
            Flight::json([
                'success' => false,
                'error' => 'Failed to delete meal plan'
            ], 404);
        }
    } catch (Exception $e) {
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

/**
 * @OA\Get(
 *     path="/backend/meal-plans/client/{clientId}",
 *     tags={"Meal Plans"},
 *     security={{"ApiKey": {}}},
 *     summary="Get meal plans by client ID",
 *     @OA\Parameter(
 *         name="clientId",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="List of meal plans"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - can only view your own meal plans or your clients' plans"
 *     )
 * )
 * 
 * 
 * 
 */


Flight::route('GET /backend/meal-plans/client/@clientId', function($clientId) use ($mealPlansService) {
    try {
        // Both clients and nutritionists can view meal plans
        Flight::auth_middleware()->authorizeRoles([Roles::CLIENT, Roles::NUTRITIONIST]);
        
        $currentUser = Flight::get('user');
        error_log("Current user from Flight: " . print_r($currentUser, true));
        
        if (!$currentUser) {
            Flight::json([
                'success' => false,
                'error' => 'User not authenticated'
            ], 401);
            return;
        }
        
        // Clients can only view their own meal plans
        if ($currentUser->role === Roles::CLIENT && $currentUser->id != $clientId) {
            Flight::json([
                'success' => false,
                'error' => 'You can only view your own meal plans'
            ], 403);
            return;
        }
        
        $mealPlans = $mealPlansService->getMealPlansByClientId($clientId);
        error_log("Meal plans for client $clientId: " . print_r($mealPlans, true));
        
        // Ensure we return an array
        if (!$mealPlans) {
            $mealPlans = [];
        }
        
        Flight::json([
            'success' => true,
            'data' => $mealPlans
        ]);
    } catch (Exception $e) {
        error_log("Error in /backend/meal-plans/client: " . $e->getMessage());
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

/**
 * @OA\Get(
 *     path="/backend/meal-plans",
 *     tags={"Meal Plans"},
 *     summary="Get all meal plans",
 *     @OA\Response(
 *         response=200,
 *         description="List of meal plans"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - only nutritionists can view all meal plans"
 *     )
 * )
 */
Flight::route('GET /backend/meal-plans', function() use ($mealPlansService) {
    try {
        $mealPlans = $mealPlansService->getAllMealPlans();
        Flight::json([
            'success' => true,
            'data' => $mealPlans
        ]);
    } catch (Exception $e) {
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Get a single meal plan
Flight::route('GET /backend/meal-plans/@id', function($id) use ($mealPlansService) {
    try {
        $mealPlan = $mealPlansService->getMealPlanById($id);
        if ($mealPlan) {
            Flight::json([
                'success' => true,
                'data' => $mealPlan
            ]);
        } else {
            Flight::json([
                'success' => false,
                'error' => 'Meal plan not found'
            ], 404);
        }
    } catch (Exception $e) {
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});
?>