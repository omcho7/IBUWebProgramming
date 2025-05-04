<?php
require_once 'backend\services\HealthGoalsService.php';

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
 *     )
 * )
 */
Flight::route('POST /health-goals', function() use ($healthGoalsService) {
    $data = Flight::request()->data->getData();
    try {
        $goal = $healthGoalsService->addHealthGoal($data);
        Flight::json($goal);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
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
 *     )
 * )
 */
Flight::route('PUT /health-goals/@id/current-value', function($id) use ($healthGoalsService) {
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
 *     )
 * )
 */
Flight::route('PUT /health-goals/@id/deadline', function($id) use ($healthGoalsService) {
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
 *     )
 * )
 */
Flight::route('GET /health-goals/user/@userId', function($userId) use ($healthGoalsService) {
    Flight::json($healthGoalsService->getHealthGoalsByUserId($userId));
});
?>