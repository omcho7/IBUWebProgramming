<?php
require 'vendor/autoload.php';

// Include route files
require_once 'backend/routes/userRoute.php';
require_once 'backend/routes/appointmentRoute.php';
require_once 'backend/routes/healthGoalsRoute.php';
require_once 'backend/routes/mealPlansRoute.php';
require_once 'backend/routes/contactFormRoute.php';

// Default route
Flight::route('/', function() {
    echo 'Welcome to the NutriLife API!';
});

Flight::start();
?>
