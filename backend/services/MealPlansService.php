<?php
require_once 'BaseService.php';
require_once 'backend\dao\MealPlansDao.php';

class MealPlansService extends BaseService {
    public function __construct() {
        parent::__construct(new MealPlansDao());
    }

    public function createMealPlan($data) {
        if (empty($data['user_id']) || empty($data['nutritionist_id']) || empty($data['title']) || empty($data['description']) || empty($data['meals'])) {
            throw new Exception("Missing required fields: user_id, nutritionist_id, title, description, or meals.");
        }

        return $this->dao->insert($data);
    }

    public function shareMealPlan($mealPlanId, $userIds) {
        foreach ($userIds as $userId) {
            $this->dao->insert([
                'meal_plan_id' => $mealPlanId,
                'user_id' => $userId
            ]);
        }
    }

    public function getMealPlansByDate($date) {
        return $this->dao->getByDate($date);
    }
}
?>