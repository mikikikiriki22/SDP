<?php
require_once 'BaseDao.php';

class BrandDao extends BaseDao
{
    public function __construct()
    {
        parent::__construct('brands');
    }

    public function getById($id)
    {
        $stmt = $this->connection->prepare("SELECT * FROM brands WHERE id = :id");
        $stmt->bindParam(' :id', $id);
        $stmt->execute();
        return $stmt->fetch();
    }
}
