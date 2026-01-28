<?php
require_once __DIR__ . '/BaseDao.php';

class AuthDao extends BaseDao {
    protected $table_name;

    public function __construct() {
        $this->table_name = "users";
        parent::__construct($this->table_name);
    }

    public function get_user_by_email($email) {
        $stmt = $this->connection->prepare("SELECT * FROM " . $this->table_name . " WHERE email = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function get_user_by_username($username) {
        $stmt = $this->connection->prepare("SELECT * FROM " . $this->table_name . " WHERE username = :username");
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create_user($user_data) {
        // Hash the password before storing
        if (isset($user_data['password'])) {
            $user_data['password'] = password_hash($user_data['password'], PASSWORD_DEFAULT);
        }
        return $this->insert($user_data);
    }

    public function verify_password($email, $password) {
        $user = $this->get_user_by_email($email);
        if ($user && isset($user['password'])) {
            return password_verify($password, $user['password']);
        }
        return false;
    }

    public function update_user_password($user_id, $new_password) {
        $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
        return $this->update($user_id, ['password' => $hashed_password]);
    }
}
?>
