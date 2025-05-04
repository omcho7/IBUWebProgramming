<?php
require_once 'BaseService.php';
require_once 'backend\dao\HealthGoalsDao.php';

class HealthGoalsService extends BaseService {
    public function __construct() {
        parent::__construct(new HealthGoalsDao());
    }

    public function addHealthGoal($data) {
        if (empty($data['user_id']) || empty($data['goal_type']) || empty($data['target_value']) || empty($data['current_value']) || empty($data['deadline'])) {
            throw new Exception("Missing required fields: user_id, goal_type, target_value, current_value, or deadline.");
        }

        return $this->dao->insert($data);
    }

    public function updateCurrentValue($goalId, $currentValue) {
        $goal = $this->dao->getById($goalId);
        if (!$goal) {
            throw new Exception("Health goal not found.");
        }

        return $this->dao->update($goalId, ['current_value' => $currentValue]);
    }

    public function calculateProgress($goalId) {
        $goal = $this->dao->getById($goalId);
        if (!$goal) {
            throw new Exception("Health goal not found.");
        }
        $progress = ($goal['current_value'] / $goal['target_value']) * 100;
        return min($progress, 100); 
    }

    public function checkGoalCompletion($goalId) {
        $goal = $this->dao->getById($goalId);
        if ($goal['current_value'] >= $goal['target_value']) {
            $this->dao->update($goalId, ['status' => 'Completed']);
        }
    }
}
?>