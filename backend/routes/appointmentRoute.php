<?php
require_once 'C:\xampp\htdocs\OmarOsmanovic\IBUWebProgramming\backend\services\AppointmentsService.php';
require_once 'backend/data/roles.php'; 

$appointmentsService = new AppointmentsService();

/**
 * @OA\Post(
 *     path="/backend/appointments",
 *     tags={"Appointments"},
 *     security={{"ApiKey": {}}},
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
    // Both clients and nutritionists can create appointments
    Flight::auth_middleware()->authorizeRoles([Roles::CLIENT, Roles::NUTRITIONIST]);
    
    $data = Flight::request()->data->getData();
    $currentUser = Flight::get('user');
    
    // If the current user is a client, they can only create appointments for themselves
    if ($currentUser->role === Roles::CLIENT && $currentUser->id != $data['user_id']) {
        Flight::json([
            'success' => false,
            'error' => 'You can only create appointments for yourself'
        ], 403);
        return;
    }
    
    // If the current user is a nutritionist, they can create appointments for any client
    if ($currentUser->role === Roles::NUTRITIONIST) {
        $data['nutritionist_id'] = $currentUser->id;
    }
    
    try {
        $appointment = $appointmentsService->createAppointment($data);
        Flight::json([
            'success' => true,
            'data' => $appointment
        ]);
    } catch (Exception $e) {
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 400);
    }
});

/**
 * @OA\Put(
 *     path="/backend/appointments/{id}/status",
 *     tags={"Appointments"},
 *     security={{"ApiKey": {}}},
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
    Flight::auth_middleware()->authorizeRoles([Roles::CLIENT, Roles::NUTRITIONIST]);
    try {
        $data = Flight::request()->data->getData();
        $appointment = $appointmentsService->updateAppointmentStatus($id, $data['status']);
        Flight::json([
            'success' => true,
            'data' => $appointment,
            'message' => 'Appointment status updated successfully'
        ]);
    } catch (Exception $e) {
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 400);
    }
});

/**
 * @OA\Delete(
 *     path="/backend/appointments/{id}",
 *     tags={"Appointments"},
 *     security={{"ApiKey": {}}},
 *     summary="Delete an appointment",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Appointment deleted successfully"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - only nutritionists can delete appointments"
 *     )
 * )
 */
Flight::route('DELETE /backend/appointments/@id', function($id) use ($appointmentsService) {
    Flight::auth_middleware()->authorizeRoles([Roles::CLIENT, Roles::NUTRITIONIST]);
    try {
        $result = $appointmentsService->deleteAppointment($id);
        if ($result) {
            Flight::json([
                'success' => true,
                'message' => 'Appointment deleted successfully'
            ]);
        } else {
            Flight::json([
                'success' => false,
                'error' => 'Failed to delete appointment'
            ], 404);
        }
    } catch (Exception $e) {
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 400);
    }
});

/**
 * @OA\Get(
 *     path="/backend/appointments/user/{userId}",
 *     tags={"Appointments"},
 *     security={{"ApiKey": {}}},
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
    try {
        // Both clients and nutritionists can view appointments
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

        // Clients can only view their own appointments
        if ($currentUser->role === Roles::CLIENT && $currentUser->id != $userId) {
            Flight::json([
                'success' => false,
                'error' => 'You can only view your own appointments'
            ], 403);
            return;
        }

        $appointments = $appointmentsService->getAppointmentsByUserId($userId);
        Flight::json([
            'success' => true,
            'data' => $appointments
        ]);
    } catch (Exception $e) {
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 400);
    }
});

/**
 * @OA\Get(
 *     path="/backend/appointments",
 *     tags={"Appointments"},
 *     summary="Get all appointments",
 *     @OA\Response(
 *         response=200,
 *         description="List of appointments"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - only nutritionists can view all appointments"
 *     )
 * )
 */
Flight::route('GET /backend/appointments', function() {
    $appointmentService = new AppointmentsService();
    try {
        $appointments = $appointmentService->getAllAppointments();
        Flight::json([
            'success' => true,
            'data' => $appointments
        ]);
    } catch (Exception $e) {
        Flight::json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}, true);
?>