<?php
require_once 'BaseDao.php';

class MealPlansDao extends BaseDao {
    public function __construct() {
        parent::__construct("mealplans");
    }

    public function getByUserId($user_id) {
        $stmt = $this->connection->prepare("SELECT * FROM mealplans WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getByNutritionistId($nutritionist_id) {
        $stmt = $this->connection->prepare("SELECT * FROM mealplans WHERE nutritionist_id = :nutritionist_id");
        $stmt->bindParam(':nutritionist_id', $nutritionist_id);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getMealPlanById($id) {
        $query = "SELECT mp.*, u.username 
                 FROM mealplans mp 
                 LEFT JOIN users u ON mp.user_id = u.id 
                 WHERE mp.id = :id";
        $stmt = $this->connection->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function deleteMealPlan($id) {
        $stmt = $this->connection->prepare("DELETE FROM mealplans WHERE id = :id");
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}
?>