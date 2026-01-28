<?php

require_once 'BaseService.php';
require_once __DIR__ . '/../dao/NoteDao.php';

/**
 * NoteService - Handles fragrance note-related business logic
 */
class NoteService extends BaseService
{
    public function __construct()
    {
        $dao = new NoteDao();
        parent::__construct($dao);
    }

    /**
     * Get all notes
     */
    public function getAllNotes()
    {
        return $this->dao->getAll();
    }

    /**
     * Get note by ID
     */
    public function getNoteById($id)
    {
        $note = $this->dao->getById($id);
        if (!$note) {
            throw new Exception("Note not found.");
        }
        return $note;
    }

    /**
     * Add new note
     */
    public function addNote($noteData)
    {
        if (empty($noteData['name'])) {
            throw new Exception("Note name is required.");
        }
        return $this->dao->insert($noteData);
    }

    /**
     * Update note
     */
    public function updateNote($id, $noteData)
    {
        $note = $this->dao->getById($id);
        if (!$note) {
            throw new Exception("Note not found.");
        }
        if (empty($noteData['name'])) {
            throw new Exception("Note name is required.");
        }
        return $this->dao->update($id, $noteData);
    }

    /**
     * Delete note
     */
    public function deleteNote($id)
    {
        $note = $this->dao->getById($id);
        if (!$note) {
            throw new Exception("Note not found.");
        }
        return $this->dao->delete($id);
    }
}
