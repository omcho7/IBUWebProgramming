<?php
require_once 'backend\services\MealPlansService.php';

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
 *     )
 * )
 */
Flight::route('POST /meal-plans', function() use ($mealPlansService) {
    $data = Flight::request()->data->getData();
    try {
        $mealPlan = $mealPlansService->createMealPlan($data);
        Flight::json($mealPlan);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

// Update a meal plan
Flight::route('PUT /meal-plans/@id', function($id) use ($mealPlansService) {
    $data = Flight::request()->data->getData();
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
 *     )
 * )
 */
Flight::route('GET /meal-plans/client/@clientId', function($clientId) use ($mealPlansService) {
    Flight::json($mealPlansService->getMealPlansByClientId($clientId));
});
?>