<?php
require_once 'BaseService.php'; 
require_once 'C:\xampp\htdocs\OmarOsmanovic\IBUWebProgramming\backend\dao\UserDao.php';

class UserService extends BaseService {
    public function __construct() {
        parent::__construct(new UserDao());
    }

    public function registerUser($data) {
        
        $existingUser = $this->dao->getByEmail($data['email']);
        if ($existingUser) {
            throw new Exception("The E-mail entered already in use.");
        }

        $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);

        return $this->dao->insert($data);
    }

  
    public function loginUser($email, $password) {
       
        $user = $this->dao->getByEmail($email);
        if (!$user) {
            throw new Exception("Invalid E-mail, please try again.");
        }

        if (!password_verify($password, $user['password'])) {
            throw new Exception("Invalid password, please try again.");
        }

        unset($user['password']);
        return $user;
    }

    public function getAllClients() {
        return $this->dao->getAllByRole('Client');
    }

    public function getAllNutritionists() {
        return $this->dao->getAllByRole('Nutritionist');
    }

    public function resetPassword($email, $newPassword) {
        $user = $this->dao->getByEmail($email);
        if (!$user) {
            throw new Exception("User not found.");
        }
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        return $this->dao->update($user['id'], ['password' => $hashedPassword]);
    }

    public function deleteClient($id) {
        try {
            if ($this->dao->deleteUser($id)) {
                return ['success' => true, 'message' => 'Client deleted successfully'];
            }
            return ['success' => false, 'message' => 'Failed to delete client'];
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    public function isAuthorized($user, $requiredRole) {
        return $user['role'] === $requiredRole;
    }
}
?>