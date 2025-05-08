<?php
require_once 'BaseDao.php';

class HealthGoalsDao extends BaseDao {
    public function __construct() {
        parent::__construct("healthgoals");
    }

    public function getByUserId($user_id) {
        $stmt = $this->connection->prepare("SELECT * FROM healthgoals WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
?>