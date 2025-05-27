<?php
require_once 'backend\services\MealPlansService.php';
require_once 'backend/data/roles.php'; // Include roles constants

$mealPlansService = new MealPlansService();

/**
 * @OA\Post(
 *     path="/meal-plans",
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
Flight::route('POST /meal-plans', function() use ($mealPlansService) {
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
 *     path="/meal-plans/{id}",
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
Flight::route('PUT /meal-plans/@id', function($id) use ($mealPlansService) {
    // Only nutritionists can update meal plans
    Flight::auth_middleware()->authorizeRole(Roles::NUTRITIONIST);
    
    $data = Flight::request()->data->getData();
    
    // Get the meal plan to verify ownership
    $mealPlan = $mealPlansService->getMealPlanById($id);
    if (!$mealPlan) {
        Flight::halt(404, json_encode(['error' => 'Meal plan not found']));
    }
    
    // Verify the nutritionist owns this meal plan
    $currentUser = Flight::get('user');
    if ($currentUser->id != $mealPlan['nutritionist_id']) {
        Flight::halt(403, json_encode([
            'error' => 'You can only update your own meal plans'
        ]));
    }
    
    try {
        $mealPlan = $mealPlansService->updateMealPlan($id, $data);
        Flight::json($mealPlan);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

/**
 * @OA\Get(
 *     path="/meal-plans/client/{clientId}",
 *     tags={"Meal Plans"},
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
 */
Flight::route('GET /meal-plans/client/@clientId', function($clientId) use ($mealPlansService) {
    // Both clients and nutritionists can view meal plans
    Flight::auth_middleware()->authorizeRoles([Roles::CLIENT, Roles::NUTRITIONIST]);
    
    $currentUser = Flight::get('user');
    
    // Clients can only view their own meal plans
    if ($currentUser->role === Roles::CLIENT && $currentUser->id != $clientId) {
        Flight::halt(403, json_encode([
            'error' => 'You can only view your own meal plans'
        ]));
    }
    
    // For nutritionists, we'll filter the results to only show plans they created
    if ($currentUser->role === Roles::NUTRITIONIST) {
        $plans = $mealPlansService->getMealPlansByClientId($clientId);
        $filteredPlans = array_filter($plans, function($plan) use ($currentUser) {
            return $plan['nutritionist_id'] == $currentUser->id;
        });
        Flight::json(array_values($filteredPlans));
        return;
    }
    
    Flight::json($mealPlansService->getMealPlansByClientId($clientId));
});
?>