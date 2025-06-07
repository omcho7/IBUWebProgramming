<?php
require_once 'C:\xampp\htdocs\OmarOsmanovic\IBUWebProgramming\backend\services\AppointmentsService.php';
require_once 'backend/data/roles.php'; 

$appointmentsService = new AppointmentsService();

/**
 * @OA\Post(
 *     path="/backend/appointments",
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
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - insufficient permissions"
 *     )
 * )
 */
Flight::route('POST /backend/appointments', function() use ($appointmentsService) {
    // Only clients can create appointments
    Flight::auth_middleware()->authorizeRole(Roles::CLIENT);
    
    $data = Flight::request()->data->getData();
    
    // Verify the client is creating appointment for themselves
    $currentUser = Flight::get('user');
    if ($currentUser['id'] != $data['user_id']) {
        Flight::halt(403, json_encode([
            'error' => 'You can only create appointments for yourself'
        ]));
    }
    
    try {
        $appointment = $appointmentsService->createAppointment($data);
        Flight::json($appointment);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

/**
 * @OA\Put(
 *     path="/backend/appointments/{id}/status",
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
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - only nutritionists can update status"
 *     )
 * )
 */
Flight::route('PUT /backend/appointments/@id/status', function($id) use ($appointmentsService) {
    // Only nutritionists can update appointment status
    Flight::auth_middleware()->authorizeRole(Roles::NUTRITIONIST);
    
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
 *     path="/backend/appointments/user/{userId}",
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
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - can only view your own appointments"
 *     )
 * )
 */
Flight::route('GET /backend/appointments/user/@userId', function($userId) use ($appointmentsService) {
    // Both clients and nutritionists can view appointments
    Flight::auth_middleware()->authorizeRoles([Roles::CLIENT, Roles::NUTRITIONIST]);
    
    $currentUser = Flight::get('user');
    
    if ($currentUser['role'] === Roles::CLIENT && $currentUser['id'] != $userId) {
        Flight::halt(403, json_encode([
            'error' => 'You can only view your own appointments'
        ]));
    }
    
    if ($currentUser['role'] === Roles::NUTRITIONIST) {
        $appointments = $appointmentsService->getAppointmentsByUserId($userId);
        $filteredAppointments = array_filter($appointments, function($appt) use ($currentUser) {
            return $appt['nutritionist_id'] == $currentUser['id'];
        });
        Flight::json(array_values($filteredAppointments));
        return;
    }
    
    Flight::json($appointmentsService->getAppointmentsByUserId($userId));
});
?>