<?php
require_once 'BaseDao.php';

class ReviewDao extends BaseDao
{
    public function __construct()
    {
        parent::__construct('reviews');
    }

    public function getById($id)
    {
        $stmt = $this->connection->prepare("SELECT * FROM reviews WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch();
    }

    /**
     * Get review with fragrance details (name, image_url, parfume_id) for sharing.
     */
    public function getReviewWithFragrance($id)
    {
        $stmt = $this->connection->prepare("
            SELECT r.*, u.username AS reviewer_name,
                   p.name AS fragrance_name, p.image_url AS fragrance_image_url, p.id AS parfume_id
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN parfumes p ON r.parfume_id = p.id
            WHERE r.id = :id
        ");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function getReviewsByFragranceId($fragranceId)
    {
        $stmt = $this->connection->prepare("
            SELECT r.*, u.username AS reviewer_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.parfume_id = :fragranceId
            ORDER BY r.date DESC
        ");
        $stmt->bindParam(':fragranceId', $fragranceId);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getReviewsByUserId($userId)
    {
        $stmt = $this->connection->prepare("
            SELECT r.*, p.name AS fragrance_name
            FROM reviews r
            JOIN parfumes p ON r.parfume_id = p.id
            WHERE r.user_id = :userId
            ORDER BY r.date DESC
        ");
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getAll()
    {
        $stmt = $this->connection->prepare('
            SELECT r.*, u.username AS reviewer_name, p.name AS fragrance_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN parfumes p ON r.parfume_id = p.id
            ORDER BY r.date DESC
        ');
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
