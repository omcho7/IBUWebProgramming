<?php
require_once 'C:\xampp\htdocs\OmarOsmanovic\IBUWebProgramming\backend\services\AppointmentsService.php';

$appointmentsService = new AppointmentsService();

/**
 * @OA\Post(
 *     path="/appointments",
 *     tags={"Appointments"},
 *     summary="Create a new appointment",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"user_id", "nutritionist_id", "date", "time"},
 *             @OA\Property(property="user_id", type="integer", example=1),
 *             @OA\Property(property="nutritionist_id", type="integer", example=2),
 *             @OA\Property(property="date", type="string", format="date", example="2023-10-01"),
 *             @OA\Property(property="time", type="string", format="time", example="10:00:00")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Appointment created successfully"
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error"
 *     )
 * )
 */
Flight::route('POST /appointments', function() use ($appointmentsService) {
    $data = Flight::request()->data->getData();
    try {
        $appointment = $appointmentsService->createAppointment($data);
        Flight::json($appointment);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

/**
 * @OA\Put(
 *     path="/appointments/{id}/status",
 *     tags={"Appointments"},
 *     summary="Update appointment status",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"status"},
 *             @OA\Property(property="status", type="string", example="Confirmed")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Appointment status updated successfully"
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error"
 *     )
 * )
 */
Flight::route('PUT /appointments/@id/status', function($id) use ($appointmentsService) {
    $data = Flight::request()->data->getData();
    try {
        $appointment = $appointmentsService->updateAppointmentStatus($id, $data['status']);
        Flight::json($appointment);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

/**
 * @OA\Get(
 *     path="/appointments/user/{userId}",
 *     tags={"Appointments"},
 *     summary="Get appointments by user ID",
 *     @OA\Parameter(
 *         name="userId",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="List of appointments"
 *     )
 * )
 */
Flight::route('GET /appointments/user/@userId', function($userId) use ($appointmentsService) {
    Flight::json($appointmentsService->getAppointmentsByUserId($userId));
});
?>