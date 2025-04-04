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
       return $stmt->fetch();
   }
}
?>
