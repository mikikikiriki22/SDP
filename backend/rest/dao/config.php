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

   /** DigitalOcean Spaces (S3-compatible) – env: SPACES_KEY, SPACES_SECRET, SPACES_REGION, SPACES_BUCKET */
   public static function SPACES_KEY() {
       return Config::get_env("SPACES_KEY", '');
   }
   public static function SPACES_SECRET() {
       return Config::get_env("SPACES_SECRET", '');
   }
   public static function SPACES_REGION() {
       return Config::get_env("SPACES_REGION", 'nyc3');
   }
   public static function SPACES_BUCKET() {
       return Config::get_env("SPACES_BUCKET", '');
   }
   public static function spacesEnabled() {
       $k = Config::SPACES_KEY();
       $s = Config::SPACES_SECRET();
       $b = Config::SPACES_BUCKET();
       return $k !== '' && $s !== '' && $b !== '';
   }

   public static function FRONTEND_BASE_URL() {
       return rtrim(Config::get_env("FRONTEND_BASE_URL", 'http://localhost/projekt/frontend/'), '/') . '/';
   }

   public static function get_env($name, $default){
       return isset($_ENV[$name]) && trim($_ENV[$name]) != "" ? $_ENV[$name] : $default;
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

