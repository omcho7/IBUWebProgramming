<?php
require_once __DIR__ . '/BaseDao.php';

class ContactFormDao extends BaseDao {
    public function __construct() {
        parent::__construct('contactform');
    }

    public function add($data) {
        $sql = "INSERT INTO contactform (fullName, email, topic, message) 
                VALUES (:fullName, :email, :topic, :message)";
        
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute([
                ':fullName' => $data['fullName'],
                ':email' => $data['email'],
                ':topic' => $data['topic'],
                ':message' => $data['message']
            ]);
            
            return $this->connection->lastInsertId();
        } catch (PDOException $e) {
            error_log("Error in ContactFormDao::add: " . $e->getMessage());
            throw $e;
        }
    }

    public function getAll() {
        $sql = "SELECT * FROM contactform ORDER BY id DESC";
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in ContactFormDao::getAll: " . $e->getMessage());
            throw $e;
        }
    }
}
?>