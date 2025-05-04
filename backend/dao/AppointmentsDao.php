<?php
require_once 'BaseDao.php';

class AppointmentsDao extends BaseDao {
    public function __construct() {
        parent::__construct("appointments");
    }

    public function getByUserId($user_id) {
        $stmt = $this->connection->prepare("SELECT * FROM appointments WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getByDate($date) {
        $stmt = $this->connection->prepare("SELECT * FROM appointments WHERE date = :date");
        $stmt->bindParam(':date', $date);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getByStatus($status) {
        $stmt = $this->connection->prepare("SELECT * FROM appointments WHERE status = :status");
        $stmt->bindParam(':status', $status);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
?>