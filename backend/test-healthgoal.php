<?php
require_once 'dao/config.php';

try {
    // Connect to database
    $conn = Database::connect();
    
    // Get a valid user ID from the database
    $user = $conn->query("SELECT id FROM users ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    $userId = $user['id'];
    
    echo "Using user ID: " . $userId . "\n";
    
    // Try to insert a health goal directly
    $stmt = $conn->prepare("INSERT INTO healthgoals (user_id, goal_type, target_value, current_value, deadline) VALUES (?, ?, ?, ?, ?)");
    $goalType = 'LoseWeight';
    $targetValue = '100';
    $currentValue = '0';
    $deadline = date('Y-m-d', strtotime('+3 months'));
    
    echo "Executing query with values: [$userId, $goalType, $targetValue, $currentValue, $deadline]\n";
    
    $result = $stmt->execute([$userId, $goalType, $targetValue, $currentValue, $deadline]);
    $newId = $conn->lastInsertId();
    
    if ($result) {
        echo "Success! New health goal ID: $newId\n";
        $newGoal = $conn->query("SELECT * FROM healthgoals WHERE id = $newId")->fetch(PDO::FETCH_ASSOC);
        echo "New goal data: " . print_r($newGoal, true) . "\n";
    } else {
        echo "Failed to create health goal\n";
        echo "Error info: " . print_r($stmt->errorInfo(), true) . "\n";
    }
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    echo "Error code: " . $e->getCode() . "\n";
}
?> 