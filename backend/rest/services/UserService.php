<?php

require_once 'BaseService.php';
require_once __DIR__ . '/../dao/UserDao.php';

/**
 * UserService - Handles user-related business logic
 */
class UserService extends BaseService
{
    public function __construct()
    {
        $dao = new UserDao();
        parent::__construct($dao);
    }

    /**
     * Get all users (admin only)
     */
    public function getAllUsers()
    {
        return $this->dao->getAll();
    }

    /**
     * Get user by ID
     */
    public function getUserById($id)
    {
        $user = $this->dao->getById($id);
        if (!$user) {
            throw new Exception("User not found.");
        }
        return $user;
    }

    /**
     * Delete user (allowed to user and admin)
     */
    public function deleteUser($id)
    {
        $user = $this->dao->getById($id);
        if (!$user) {
            throw new Exception("User not found.");
        }
        return $this->dao->delete($id);
    }

    /**
     * Update user profile
     */
    public function updateUser($id, $userData)
    {
        $user = $this->dao->getById($id);
        if (!$user) {
            throw new Exception("User not found.");
        }

        // Hash password if provided
        if (!empty($userData['password'])) {
            $userData['password'] = password_hash($userData['password'], PASSWORD_BCRYPT);
        }

        return $this->dao->update($id, $userData);
    }
}
