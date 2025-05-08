<?php
require_once 'UserService.php';

$user_service = new UserService();

$new_user = [
    'username' => 'Ronaldo',
    'email' => 'client@email.com',
    'password' => 'password123',
    'role' => 'Client'

];
try {
    $register_user = $user_service->registerUser($new_user);
    print_r($register_user);
    echo "Success";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

try {
    $logged_in_user = $user_service->loginUser('client@email.com', 'password123');
    print_r($logged_in_user);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

$clients = $user_service->getAllClients();
print_r($clients);

$nutritionists = $user_service->getAllNutritionists();
print_r($nutritionists);

?>
