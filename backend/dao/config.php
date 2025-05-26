<?php
// Set the reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL ^ (E_NOTICE | E_DEPRECATED));


class Config
{
    public static function DB_HOST()
    {
        return 'localhost';
    }
    
    public static function DB_NAME()
    {
        return 'nutrilife';
    }
    
    public static function DB_USER()
    {
        return 'root';
    }
    
    public static function DB_PASSWORD()
    {
        return '240818';
    }
    
    public static function DB_PORT()
    {
        return 3306;
    }
    
    public static function JWT_SECRET()
    {
        return 'nutrilife_ibu_14070902';
    }
}


class Database {
    private static $connection = null;

    public static function connect() {
        if (self::$connection === null) {
            try {
                self::$connection = new PDO(
                    "mysql:host=" . Config::DB_HOST() . ";dbname=" . Config::DB_NAME(),
                    Config::DB_USER(),
                    Config::DB_PASSWORD(),
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ]
                );
            } catch (PDOException $e) {
                die("Connection failed: " . $e->getMessage());
            }
        }
        return self::$connection;
    }
}