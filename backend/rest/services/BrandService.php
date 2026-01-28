<?php

require_once 'BaseService.php';
require_once __DIR__ . '/../dao/BrandDao.php';

/**
 * BrandService - Handles brand-related business logic
 */
class BrandService extends BaseService
{
    public function __construct()
    {
        $dao = new BrandDao();
        parent::__construct($dao);
    }

    /**
     * Get all brands
     */
    public function getAllBrands()
    {
        return $this->dao->getAll();
    }

    /**
     * Get brand by ID
     */
    public function getBrandById($id)
    {
        $brand = $this->dao->getById($id);
        if (!$brand) {
            throw new Exception("Brand not found.");
        }
        return $brand;
    }

    /**
     * Add new brand
     */
    public function addBrand($brandData)
    {
        if (empty($brandData['name']) || empty($brandData['country'])) {
            throw new Exception("Brand name and country are required.");
        }
        return $this->dao->insert($brandData);
    }

    /**
     * Update brand
     */
    public function updateBrand($id, $brandData)
    {
        $brand = $this->dao->getById($id);
        if (!$brand) {
            throw new Exception("Brand not found.");
        }
        return $this->dao->update($id, $brandData);
    }

    /**
     * Delete brand
     */
    public function deleteBrand($id)
    {
        $brand = $this->dao->getById($id);
        if (!$brand) {
            throw new Exception("Brand not found.");
        }
        return $this->dao->delete($id);
    }
}
