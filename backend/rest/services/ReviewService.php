<?php

require_once 'BaseService.php';
require_once __DIR__ . '/../dao/ReviewDao.php';

/**
 * ReviewService - Handles review-related business logic
 */
class ReviewService extends BaseService
{
    public function __construct()
    {
        $this->dao = new ReviewDao();
        parent::__construct($this->dao);
    }

    /**
     * Get all reviews
     */
    public function getAllReviews()
    {
        return $this->dao->getAll();
    }

    /**
     * Get review by ID
     */
    public function getReviewById($id)
    {
        $review = $this->dao->getById($id);
        if (!$review) {
            throw new Exception("Review not found.");
        }
        return $review;
    }

    /**
     * Create new review
     */
    public function createReview($reviewData)
    {
        if (empty($reviewData['user_id']) || empty($reviewData['parfume_id']) || empty($reviewData['rating'])) {
            throw new Exception("Missing required fields: user_id, fragrance_id, or rating.");
        }
        return parent::create($reviewData);
    }

    /**
     * Update review
     */
    public function updateReview($id, $data)
    {
        $review = $this->dao->getById($id);
        if (!$review) {
            throw new Exception("Review not found.");
        }
        return $this->dao->update($id, $data);
    }

    /**
     * Delete review
     */
    public function deleteReview($id)
    {
        $review = $this->dao->getById($id);
        if (!$review) {
            throw new Exception("Review not found.");
        }
        return $this->dao->delete($id);
    }

    /**
     * Get reviews by fragrance ID
     */
    public function getReviewsByFragranceId($fragranceId)
    {
        return $this->dao->getReviewsByFragranceId($fragranceId);
    }

    /**
     * Get reviews by user ID
     */
    public function getReviewsByUserId($userId)
    {
        return $this->dao->getReviewsByUserId($userId);
    }

    /**
     * Get review with fragrance data for sharing
     */
    public function getReviewWithFragranceForShare($id)
    {
        $data = $this->dao->getReviewWithFragrance($id);
        if (!$data) {
            throw new Exception("Review not found.");
        }
        return $data;
    }
}
