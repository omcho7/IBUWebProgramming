<?php
require_once 'BaseDao.php';

class ContactFormDao extends BaseDao {
    public function __construct() {
        parent::__construct("contactform");
    }

    public function insert($data) {
        $sql = "INSERT INTO contactform (fullName, email, topic, message) VALUES (:fullName, :email, :topic, :message)";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($data);
        return $this->connection->lastInsertId();
    }
}
?>