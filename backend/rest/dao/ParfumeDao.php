<?php
require_once 'BaseDao.php';

class ParfumeDao extends BaseDao
{
    public function __construct()
    {
        parent::__construct('parfumes');
    }

    public function getById($id)
    {
        $stmt = $this->connection->prepare("
            SELECT p.*, b.name AS brand_name, b.country AS brand_country,
                (
                    SELECT GROUP_CONCAT(n.name ORDER BY n.name SEPARATOR ', ')
                    FROM parfume_notes pn
                    JOIN notes n ON pn.note_id = n.id
                    WHERE pn.parfume_id = p.id
                ) AS notes
            FROM parfumes p
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.id = :id
        ");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function getAll()
    {
        $stmt = $this->connection->prepare("
            SELECT p.*, b.name AS brand_name,
                (
                    SELECT GROUP_CONCAT(n.name ORDER BY n.name SEPARATOR ', ')
                    FROM parfume_notes pn
                    JOIN notes n ON pn.note_id = n.id
                    WHERE pn.parfume_id = p.id
                ) AS notes
            FROM parfumes p
            LEFT JOIN brands b ON p.brand_id = b.id
        ");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function insert($data) {
        // Convert brand_name to brand_id
        if (!empty($data['brand_name'])) {
            $stmt = $this->connection->prepare('SELECT id FROM brands WHERE name = :name');
            $stmt->bindParam(':name', $data['brand_name']);
            $stmt->execute();
            $brand = $stmt->fetch();
            if ($brand) {
                $data['brand_id'] = $brand['id'];
            } else {
                // Insert new brand if not exists
                $country = !empty($data['brand_country']) ? $data['brand_country'] : 'Unknown';
                $stmt = $this->connection->prepare('INSERT INTO brands (name, country) VALUES (:name, :country)');
                $stmt->bindParam(':name', $data['brand_name']);
                $stmt->bindParam(':country', $country);
                $stmt->execute();
                $data['brand_id'] = $this->connection->lastInsertId();
            }
        }
        $notes = [];
        if (!empty($data['notes'])) {
            $notes = array_map('trim', explode(',', $data['notes']));
        }
        unset($data['brand_name']);
        unset($data['brand_country']);
        unset($data['notes']);
        // Insert parfume
        $columns = implode(", ", array_keys($data));
        $placeholders = ":" . implode(", :", array_keys($data));
        $sql = "INSERT INTO parfumes ($columns) VALUES ($placeholders)";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($data);
        $parfume_id = $this->connection->lastInsertId();
        // Insert notes (many-to-many)
        foreach ($notes as $noteName) {
            $stmt = $this->connection->prepare('SELECT id FROM notes WHERE name = :name');
            $stmt->bindParam(':name', $noteName);
            $stmt->execute();
            $note = $stmt->fetch();
            if (!$note) {
                $stmt = $this->connection->prepare('INSERT INTO notes (name) VALUES (:name)');
                $stmt->bindParam(':name', $noteName);
                $stmt->execute();
                $note_id = $this->connection->lastInsertId();
            } else {
                $note_id = $note['id'];
            }
            $stmt = $this->connection->prepare('INSERT INTO parfume_notes (parfume_id, note_id) VALUES (:parfume_id, :note_id)');
            $stmt->bindParam(':parfume_id', $parfume_id);
            $stmt->bindParam(':note_id', $note_id);
            $stmt->execute();
        }
        return $parfume_id;
    }

    public function update($id, $data) {
        // Convert brand_name to brand_id
        if (!empty($data['brand_name'])) {
            $stmt = $this->connection->prepare('SELECT id FROM brands WHERE name = :name');
            $stmt->bindParam(':name', $data['brand_name']);
            $stmt->execute();
            $brand = $stmt->fetch();
            if ($brand) {
                $data['brand_id'] = $brand['id'];
            } else {
                $country = !empty($data['brand_country']) ? $data['brand_country'] : 'Unknown';
                $stmt = $this->connection->prepare('INSERT INTO brands (name, country) VALUES (:name, :country)');
                $stmt->bindParam(':name', $data['brand_name']);
                $stmt->bindParam(':country', $country);
                $stmt->execute();
                $data['brand_id'] = $this->connection->lastInsertId();
            }
        }
        $notes = [];
        if (!empty($data['notes'])) {
            $notes = array_map('trim', explode(',', $data['notes']));
        }
        unset($data['brand_name']);
        unset($data['brand_country']);
        unset($data['notes']);
        // Update parfume
        $fields = "";
        foreach ($data as $key => $value) {
            $fields .= "$key = :$key, ";
        }
        $fields = rtrim($fields, ", ");
        $sql = "UPDATE parfumes SET $fields WHERE id = :id";
        $stmt = $this->connection->prepare($sql);
        $data['id'] = $id;
        $stmt->execute($data);
        // Update notes (many-to-many)
        $stmt = $this->connection->prepare('DELETE FROM parfume_notes WHERE parfume_id = :parfume_id');
        $stmt->bindParam(':parfume_id', $id);
        $stmt->execute();
        foreach ($notes as $noteName) {
            $stmt = $this->connection->prepare('SELECT id FROM notes WHERE name = :name');
            $stmt->bindParam(':name', $noteName);
            $stmt->execute();
            $note = $stmt->fetch();
            if (!$note) {
                $stmt = $this->connection->prepare('INSERT INTO notes (name) VALUES (:name)');
                $stmt->bindParam(':name', $noteName);
                $stmt->execute();
                $note_id = $this->connection->lastInsertId();
            } else {
                $note_id = $note['id'];
            }
            $stmt = $this->connection->prepare('INSERT INTO parfume_notes (parfume_id, note_id) VALUES (:parfume_id, :note_id)');
            $stmt->bindParam(':parfume_id', $id);
            $stmt->bindParam(':note_id', $note_id);
            $stmt->execute();
        }
        return true;
    }
}
