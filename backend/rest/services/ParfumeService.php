<?php

require_once 'BaseService.php';
require_once __DIR__ . '/../dao/ParfumeDao.php';

/**
 * ParfumeService - Handles fragrance-related business logic
 */
class ParfumeService extends BaseService
{
    public function __construct()
    {
        $dao = new ParfumeDao();
        parent::__construct($dao);
    }

    /**
     * Get all fragrances
     */
    public function getAllFragrances()
    {
        return $this->dao->getAll();
    }

    /**
     * Get fragrance by ID
     */
    public function getFragranceById($id)
    {
        $fragrance = $this->dao->getById($id);
        if (!$fragrance) {
            throw new Exception("Fragrance not found.");
        }
        return $fragrance;
    }

    /**
     * Add new fragrance
     */
    public function addFragrance($fragranceData)
    {
        if (empty($fragranceData['name'])) {
            throw new Exception("Fragrance name is required.");
        }
        
        // Accept either brand_id or brand_name
        if (empty($fragranceData['brand_id']) && empty($fragranceData['brand_name'])) {
            throw new Exception("Brand is required.");
        }

        return $this->dao->insert($fragranceData);
    }

    /**
     * Update fragrance
     */
    public function updateFragrance($id, $fragranceData)
    {
        $fragrance = $this->dao->getById($id);
        if (!$fragrance) {
            throw new Exception("Fragrance not found.");
        }
        return $this->dao->update($id, $fragranceData);
    }

    /**
     * Delete fragrance
     */
    public function deleteFragrance($id)
    {
        $fragrance = $this->dao->getById($id);
        if (!$fragrance) {
            throw new Exception("Fragrance not found.");
        }
        return $this->dao->delete($id);
    }
}
