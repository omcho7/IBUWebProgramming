<?php
require_once 'UserDao.php';
require_once 'AppointmentsDao.php';
require_once 'HealthGoalsDao.php';
require_once 'MealPlansDao.php';
require_once 'ContactFormDao.php';



$userDao = new UserDao();
$appointmentsDao = new AppointmentsDao();
$mealplansDao = new MealPlansDao();
$healthgoalsDao = new HealthGoalsDao();
$contactformDao = new ContactFormDao();




$userDao->insert([
   'username' => 'Samatnha Doe',
   'email' => 'sam@example.com',
   'password' => password_hash('password123', PASSWORD_DEFAULT),
   'role' => 'Nutritionist'
]);


$appointmentsDao->insert([
   'user_id' => 1,
   'nutritionist_id' => 1,
   'date' => '2023-10-01',
   'time' => '10:00:00',
   'status' => 'Confirmed'
]);

$mealplansDao->insert([
   'user_id' => 1,
   'nutritionist_id' => 1,
   'title' => 'Keto',
    'description' => 'Keto meal plan for weight loss',
    'meals' => json_encode([
        'Breakfast' => 'Eggs and Avocado',
        'Lunch' => 'Grilled Chicken Salad',
        'Dinner' => 'Salmon with Asparagus'
    ]),
]);

$healthgoalsDao->insert([
   'user_id' => 1,
   'goal_type' => 'LoseWeight',
   'target_value' => 70,
   'current_value' => 80,
   'deadline' => '2024-01-01'
]);

$contactformDao->insert([
   'fullName' => 'John Doe',
   'email' => 'john@example.com',
   'topic' => 'Consultation',
   'message' => 'I would like to know more about your services and schedule a consultation.'
   
]);



// Fetch all users
$users = $userDao->getAll();
print_r($users);

$appointments = $appointmentsDao->getAll();
print_r($appointments);

$mealplans = $mealplansDao->getAll();
print_r($mealplans);

$healthgoals = $healthgoalsDao->getAll();
print_r($healthgoals);

$contactform = $contactformDao->getAll();
print_r($contactform);

?>
