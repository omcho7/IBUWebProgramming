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

    public function deleteUser($id) {
        // First check if user exists and is a client
        $stmt = $this->connection->prepare("SELECT role FROM " . $this->table . " WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $user = $stmt->fetch();

        if (!$user) {
            throw new Exception("User not found");
        }

        if ($user['role'] !== 'Client') {
            throw new Exception("Only clients can be deleted");
        }

        // Delete the user
        $stmt = $this->connection->prepare("DELETE FROM " . $this->table . " WHERE id = :id");
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}
?>