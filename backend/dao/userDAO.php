<?php
require_once 'BaseDao.php';

class UserDao extends BaseDao {
    public function __construct() {
        parent::__construct("users");
    }

    public function getByEmail($email) {
        $stmt = $this->connection->prepare("SELECT * FROM users WHERE email = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        return $stmt->fetch();
    }

    // Add this method if it doesn't exist
    public function getAllByRole($role) {
        $stmt = $this->connection->prepare("SELECT * FROM " . $this->table . " WHERE role = :role");
        $stmt->bindParam(':role', $role);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
?>