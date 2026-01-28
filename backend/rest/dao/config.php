<?php
/**
 * App and DB config. For production: set env vars (DB_*, JWT_SECRET, FRONTEND_BASE_URL)
 * or keep defaults and override in deployment.
 */
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT);


class Config
{
   public static function DB_NAME()
   {
       return Config::get_env("DB_NAME", "parfumes"); 
   }
   public static function DB_PORT()
   {
       return Config::get_env("DB_PORT", 3306);
   }
   public static function DB_USER()
   {
       return Config::get_env("DB_USER", 'root');
   }
   public static function DB_PASSWORD()
   {
       return Config::get_env("DB_PASSWORD", '0000');
   }
   public static function DB_HOST()
   {
       return Config::get_env("DB_HOST", '127.0.0.1');
   }

   public static function JWT_SECRET() {
       return Config::get_env("JWT_SECRET", 'mileLegenda333');
   }

   public static function FRONTEND_BASE_URL() {
       return rtrim(Config::get_env("FRONTEND_BASE_URL", 'http://localhost/projekt/frontend/'), '/') . '/';
   }

   public static function get_env($name, $default){
       if (isset($_ENV[$name]) && trim($_ENV[$name]) !== "") {
           return $_ENV[$name];
       }
       $val = getenv($name);
       if ($val !== false && trim($val) !== "") {
           return $val;
       }
       if (isset($_SERVER[$name]) && trim($_SERVER[$name]) !== "") {
           return $_SERVER[$name];
       }
       return $default;
   }

}

class Database {
   private static $connection = null;


   public static function connect() {
       if (self::$connection === null) {
           try {
               self::$connection = new PDO(
                   "mysql:host=" . Config::DB_HOST() . 
                   ";dbname=" . Config::DB_NAME().
                   ";port=" . Config::DB_PORT(),
                   Config::DB_USER(),
                   Config::DB_PASSWORD(),
                   [
                       PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                       PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                   ]
               );
           } catch (PDOException $e) {
               throw new Exception("Connection failed: " . $e->getMessage());
           }
       }
       return self::$connection;
   }
}
?>

