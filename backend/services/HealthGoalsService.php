<?php
require_once 'BaseService.php';
require_once 'backend\dao\HealthGoalsDao.php';

class HealthGoalsService extends BaseService {
    private $healthGoalsDao;

    public function __construct() {
        parent::__construct();
        $this->healthGoalsDao = new HealthGoalsDao();
        $this->dao = $this->healthGoalsDao; // Set the base DAO as well
    }

    public function addHealthGoal($data) {
        error_log("Adding health goal with data: " . print_r($data, true));
        
        if (empty($data['user_id'])) {
            error_log("Missing user_id field");
        }
        if (empty($data['goal_type'])) {
            error_log("Missing goal_type field");
        }
        if (empty($data['target_value'])) {
            error_log("Missing target_value field");
        }
        if (!isset($data['current_value']) || $data['current_value'] === '') {
            error_log("Missing current_value field");
        }
        if (empty($data['deadline'])) {
            error_log("Missing deadline field");
        }
        
        if (empty($data['user_id']) || empty($data['goal_type']) || empty($data['target_value']) || 
            (!isset($data['current_value']) || $data['current_value'] === '') || empty($data['deadline'])) {
            throw new Exception("Missing required fields: user_id, goal_type, target_value, current_value, or deadline.");
        }

        try {
            $result = $this->healthGoalsDao->add($data);
            error_log("Health goal add result: " . ($result ? "Success" : "Failed"));
            if (!$result) {
                error_log("Failed to create health goal. DAO returned false.");
                throw new Exception("Failed to create health goal.");
            }
            return $result;
        } catch (Exception $e) {
            error_log("Exception in addHealthGoal: " . $e->getMessage());
            throw $e;
        }
    }

    public function updateCurrentValue($goalId, $currentValue) {
        $goal = $this->healthGoalsDao->getById($goalId);
        if (!$goal) {
            throw new Exception("Health goal not found.");
        }

        return $this->healthGoalsDao->update($goalId, ['current_value' => $currentValue]);
    }

    public function updateDeadline($goalId, $deadline) {
        $goal = $this->healthGoalsDao->getById($goalId);
        if (!$goal) {
            throw new Exception("Health goal not found.");
        }

        return $this->healthGoalsDao->update($goalId, ['deadline' => $deadline]);
    }

    public function getHealthGoalById($id) {
        return $this->healthGoalsDao->getById($id);
    }

    public function getHealthGoalsByUserId($userId) {
        return $this->healthGoalsDao->getByUserId($userId);
    }

    public function calculateProgress($goalId) {
        $goal = $this->healthGoalsDao->getById($goalId);
        if (!$goal) {
            throw new Exception("Health goal not found.");
        }
        $progress = ($goal['current_value'] / $goal['target_value']) * 100;
        return min($progress, 100); 
    }

    public function checkGoalCompletion($goalId) {
        $goal = $this->healthGoalsDao->getById($goalId);
        if ($goal['current_value'] >= $goal['target_value']) {
            $this->healthGoalsDao->update($goalId, ['status' => 'Completed']);
        }
    }

    public function getAllHealthGoals() {
        try {
            $query = "SELECT hg.*, u.username 
                     FROM healthgoals hg 
                     LEFT JOIN users u ON hg.user_id = u.id";
            return $this->healthGoalsDao->query($query);
        } catch (Exception $e) {
            error_log("Error in getAllHealthGoals: " . $e->getMessage());
            throw $e;
        }
    }

    public function updateHealthGoal($id, $data) {
        try {
            $goal = $this->healthGoalsDao->getById($id);
            if (!$goal) {
                return null;
            }

            // Validate required fields
            if (empty($data['goal_type']) || empty($data['target_value']) || 
                !isset($data['current_value']) || empty($data['deadline'])) {
                throw new Exception("Missing required fields: goal_type, target_value, current_value, or deadline.");
            }

            // Update the goal
            $result = $this->healthGoalsDao->update($id, $data);
            if (!$result) {
                throw new Exception("Failed to update health goal.");
            }

            // Return the updated goal
            return $this->healthGoalsDao->getById($id);
        } catch (Exception $e) {
            error_log("Error in updateHealthGoal: " . $e->getMessage());
            throw $e;
        }
    }

    public function deleteHealthGoal($id) {
        try {
            $goal = $this->healthGoalsDao->getById($id);
            if (!$goal) {
                return false;
            }

            return $this->healthGoalsDao->delete($id);
        } catch (Exception $e) {
            error_log("Error in deleteHealthGoal: " . $e->getMessage());
            throw $e;
        }
    }
}
?>