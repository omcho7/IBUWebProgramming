<?php
require_once 'BaseDao.php';


class ContactFormDao extends BaseDao {
   public function __construct() {
       parent::__construct("contactform");
   }


   public function getByUserId($user_id) {
       $stmt = $this->connection->prepare("SELECT * FROM contactform WHERE user_id = :user_id");
       $stmt->bindParam(':user_id', $user_id);
       $stmt->execute();
       return $stmt->fetch();
   }
}
?>
