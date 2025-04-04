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
       return $stmt->fetch();
   }
}
?>
