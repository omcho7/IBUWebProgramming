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
        $users = $this->dao->getAll();
        return array_filter($users, function ($user) {
            return $user['role'] === 'Client';
        });
    }

    public function getAllNutritionists() {
        $users = $this->dao->getAll();
        return array_filter($users, function ($user) {
            return $user['role'] === 'Nutritionist';
        });
    }

    public function resetPassword($email, $newPassword) {
        $user = $this->dao->getByEmail($email);
        if (!$user) {
            throw new Exception("User not found.");
        }
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        return $this->dao->update($user['id'], ['password' => $hashedPassword]);
    }

    
    public function isAuthorized($user, $requiredRole) {
        return $user['role'] === $requiredRole;
    }
    
}
?>