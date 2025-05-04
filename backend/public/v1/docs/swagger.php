<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require __DIR__ . '/../../../../vendor/autoload.php';


use OpenApi\Generator;

// Define the base URL for the API
if ($_SERVER['SERVER_NAME'] == 'localhost' || $_SERVER['SERVER_NAME'] == '127.0.0.1') {
    define('BASE_URL', 'http://localhost/OmarOsmanovic/IBUWebProgramming');
} else {
    define('BASE_URL', 'https://add-production-server-after-deployment/backend/');
}

// Scan for OpenAPI annotations
$openapi = \OpenApi\Generator::scan([
    __DIR__ . '/doc_setup.php', // Include OpenAPI metadata
    __DIR__ . '/../../../../backend/routes' // Scan the routes directory for annotations
]);

// Output the generated OpenAPI documentation as JSON
header('Content-Type: application/json');
echo $openapi->toJson();

