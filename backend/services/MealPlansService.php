<?php
require_once 'BaseService.php';
require_once __DIR__ . '/../dao/MealPlansDao.php';

class MealPlansService extends BaseService {
    private $mealPlansDao;

    public function __construct() {
        parent::__construct();
        $this->mealPlansDao = new MealPlansDao();
        $this->dao = $this->mealPlansDao;
    }

    public function createMealPlan($data) {
        try {
            // Convert meals array to JSON if it's an array
            if (isset($data['meals']) && is_array($data['meals'])) {
                $data['meals'] = json_encode($data['meals']);
            }
            return $this->mealPlansDao->create($data);
        } catch (Exception $e) {
            error_log("Error creating meal plan: " . $e->getMessage());
            throw $e;
        }
    }

    public function shareMealPlan($mealPlanId, $userIds) {
        foreach ($userIds as $userId) {
            $this->mealPlansDao->insert([
                'meal_plan_id' => $mealPlanId,
                'user_id' => $userId
            ]);
        }
    }

    public function getMealPlansByDate($date) {
        return $this->mealPlansDao->getByDate($date);
    }

    public function getAllMealPlans() {
        try {
            $mealPlans = $this->mealPlansDao->getAll();
            // Decode meals JSON for each meal plan
            foreach ($mealPlans as &$mealPlan) {
                if (isset($mealPlan['meals'])) {
                    $mealPlan['meals'] = json_decode($mealPlan['meals'], true) ?: [];
                }
            }
            return $mealPlans;
        } catch (Exception $e) {
            error_log("Error getting all meal plans: " . $e->getMessage());
            throw $e;
        }
    }

    public function getMealPlanById($id) {
        try {
            $mealPlan = $this->mealPlansDao->getById($id);
            if ($mealPlan && isset($mealPlan['meals'])) {
                // Ensure meals is properly decoded as an object
                $decodedMeals = json_decode($mealPlan['meals'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $mealPlan['meals'] = $decodedMeals;
                } else {
                    error_log("Error decoding meals JSON: " . json_last_error_msg());
                    $mealPlan['meals'] = [];
                }
            }
            return $mealPlan;
        } catch (Exception $e) {
            error_log("Error getting meal plan by ID: " . $e->getMessage());
            throw $e;
        }
    }

    public function updateMealPlan($id, $data) {
        try {
            // Convert meals array to JSON if it's an array
            if (isset($data['meals']) && is_array($data['meals'])) {
                $data['meals'] = json_encode($data['meals']);
            }
            return $this->mealPlansDao->update($id, $data);
        } catch (Exception $e) {
            error_log("Error updating meal plan: " . $e->getMessage());
            throw $e;
        }
    }

    public function deleteMealPlan($id) {
        try {
            return $this->mealPlansDao->delete($id);
        } catch (Exception $e) {
            error_log("Error deleting meal plan: " . $e->getMessage());
            throw $e;
        }
    }
}
?>