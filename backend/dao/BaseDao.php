<?php
require_once 'config.php';

class BaseDao {
    protected $table;
    protected $connection;

    public function __construct($table) {
        $this->table = $table;
        $this->connection = Database::connect();
    }

  
    public function query_unique($query, $params) {
        $stmt = $this->connection->prepare($query);
        $stmt->execute($params);
        return $stmt->fetch();
    }

    
    public function getAll() {
        try {
            $query = "SELECT * FROM " . $this->table;
            $stmt = $this->connection->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in getAll: " . $e->getMessage());
            throw $e;
        }
    }

    public function getById($id) {
        return $this->query_unique(
            "SELECT * FROM " . $this->table . " WHERE id = :id",
            ['id' => $id]
        );
    }

    public function insert($data) {
        $columns = implode(", ", array_keys($data));
        $placeholders = ":" . implode(", :", array_keys($data));
        $sql = "INSERT INTO " . $this->table . " ($columns) VALUES ($placeholders)";
        $stmt = $this->connection->prepare($sql);
        return $stmt->execute($data);
    }

    public function update($id, $data) {
        $fields = "";
        foreach ($data as $key => $value) {
            $fields .= "$key = :$key, ";
        }
        $fields = rtrim($fields, ", ");
        $sql = "UPDATE " . $this->table . " SET $fields WHERE id = :id";
        $stmt = $this->connection->prepare($sql);
        $data['id'] = $id;
        return $stmt->execute($data);
    }

    public function delete($id) {
        $stmt = $this->connection->prepare("DELETE FROM " . $this->table . " WHERE id = :id");
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    public function add($entity) {
        try {
            $columns = implode(",", array_keys($entity));
            $placeholders = ":".implode(",:", array_keys($entity));
            $sql = "INSERT INTO {$this->table} ($columns) VALUES ($placeholders)";
            
            error_log("BaseDao::add SQL: " . $sql);
            error_log("BaseDao::add entity: " . print_r($entity, true));
            
            $stmt = $this->connection->prepare($sql);
            if ($stmt->execute($entity)) {
                $id = $this->connection->lastInsertId();
                error_log("BaseDao::add success, new ID: " . $id);
                return $this->getById($id); // Return full record
            }
            $error = $stmt->errorInfo();
            error_log("BaseDao::add failed, error: " . print_r($error, true));
            throw new PDOException($error[2], $error[1]);
        } catch (PDOException $e) {
            error_log("DAO Add Error: " . $e->getMessage());
            error_log("DAO Add Error Code: " . $e->getCode());
            error_log("DAO Add Error Trace: " . $e->getTraceAsString());
            throw $e;
        }
    }

    public function query($sql) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error in query: " . $e->getMessage());
            throw $e;
        }
    }
}