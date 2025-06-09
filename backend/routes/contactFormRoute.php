<?php
require_once 'backend\services\ContactFormService.php';
require_once 'backend/data/roles.php'; // Include roles constants

$contactFormService = new ContactFormService();

/**
 * @OA\Post(
 *     path="/backend/contact-form",
 *     tags={"Contact Form"},
 *     summary="Submit a contact form",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"fullName", "email", "topic", "message"},
 *             @OA\Property(property="fullName", type="string", example="John Doe"),
 *             @OA\Property(property="email", type="string", example="john@example.com"),
 *             @OA\Property(property="topic", type="string", example="Consultation"),
 *             @OA\Property(property="message", type="string", example="I need help with my diet plan.")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Contact form submitted successfully"
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error"
 *     )
 * )
 */
Flight::route('POST /backend/contact-form', function() use ($contactFormService) {
    // Public route - no authentication required for submissions
    $data = Flight::request()->data->getData();
    try {
        $submission = $contactFormService->submitContactForm($data);
        
        // Optional: If you want to send acknowledgment only to authenticated users
        if ($user = Flight::get('user')) {
            $contactFormService->sendAcknowledgmentEmail($data['email']);
        }
        
        Flight::json($submission);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

/**
 * @OA\Get(
 *     path="/backend/contact-form",
 *     tags={"Contact Form"},
 *     summary="Get all contact form submissions",
 *     @OA\Response(
 *         response=200,
 *         description="List of all contact form submissions"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - admin access required"
 *     )
 * )
 */
Flight::route('GET /backend/contact-form', function() use ($contactFormService) {
    // Only admins can view all submissions
    Flight::auth_middleware()->authorizeRole(Roles::ADMIN);
    
    try {
        $submissions = $contactFormService->getAllSubmissions();
        Flight::json($submissions);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

/**
 * @OA\Get(
 *     path="/backend/contact-form/{id}",
 *     tags={"Contact Form"},
 *     summary="Get a specific contact form submission by ID",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Contact form submission details"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - admin access required"
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Submission not found"
 *     )
 * )
 */
Flight::route('GET /backend/contact-form/@id', function($id) use ($contactFormService) {
    // Only admins can view specific submissions
    Flight::auth_middleware()->authorizeRole(Roles::ADMIN);
    
    try {
        $submission = $contactFormService->getSubmissionById($id);
        Flight::json($submission);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});

/**
 * @OA\Delete(
 *     path="/backend/contact-form/{id}",
 *     tags={"Contact Form"},
 *     summary="Delete a contact form submission by ID",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Submission deleted successfully"
 *     ),
 *     @OA\Response(
 *         response=403,
 *         description="Forbidden - admin access required"
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Submission not found"
 *     )
 * )
 */
Flight::route('DELETE /backend/contact-form/@id', function($id) use ($contactFormService) {
    // Only admins can delete submissions
    Flight::auth_middleware()->authorizeRole(Roles::ADMIN);
    
    try {
        $contactFormService->deleteSubmission($id);
        Flight::json(['message' => 'Submission deleted successfully']);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 400);
    }
});
?>