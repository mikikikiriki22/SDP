<?php

require_once __DIR__ . "/../services/NoteService.php";

// making note service class accessible
Flight::register('noteService', 'NoteService');


// GET ALL NOTES

/**
 * @OA\Get(
 *     path="/notes",
 *     tags={"Notes"},
 *     summary="Get all notes",
 *     @OA\Response(
 *         response=200,
 *         description="List of all notes"
 *     )
 * )
 */
Flight::route('GET /notes', function () {
    $data = Flight::noteService()->getAllNotes();
    Flight::json($data);
});


// GET NOTE BY ID

/**
 * @OA\Get(
 *     path="/notes/{id}",
 *     tags={"Notes"},
 *     summary="Get note by ID",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Note found"
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Note not found"
 *     )
 * )
 */
Flight::route('GET /notes/@id', function ($id) {
    $note = Flight::noteService()->getNoteById($id);

    if ($note) {
        Flight::json($note);
    } else {
        Flight::json(["error" => "Note not found"], 404);
    }
});


// ADDING NOTE

/**
 * @OA\Post(
 *     path="/notes",
 *     tags={"Notes"},
 *     summary="Add a new note",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"name"},
 *             @OA\Property(property="name", type="string")
 *         )
 *     ),
 *     @OA\Response(
 *         response=201,
 *         description="Note added successfully"
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Failed to add note"
 *     )
 * )
 */
Flight::route('POST /notes', function () {
    $data = Flight::request()->data->getData();

    $noteService = new NoteService();
    $result = $noteService->addNote($data);

    if ($result) {
        Flight::json(['message' => 'Note added successfully'], 201);
    } else {
        Flight::json(['message' => 'Failed to add note'], 500);
    }
});


// UPDATING NOTE

/**
 * @OA\Put(
 *     path="/notes/{id}",
 *     tags={"Notes"},
 *     summary="Update a note",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             @OA\Property(property="name", type="string")
 *         )
 *     ),
 *     @OA\Response(
 *         response=201,
 *         description="Note updated successfully"
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Failed to update note"
 *     )
 * )
 */
Flight::route('PUT /notes/@id', function ($id) {
    $data = Flight::request()->data->getData();

    $noteService = new NoteService();
    $result = $noteService->updateNote($id, $data);

    if ($result) {
        Flight::json(['message' => 'Note updated successfully'], 201);
    } else {
        Flight::json(['message' => 'Failed to update note'], 500);
    }
});


// DELETING NOTE

/**
 * @OA\Delete(
 *     path="/notes/{id}",
 *     tags={"Notes"},
 *     summary="Delete a note",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Note deleted successfully"
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Note not found"
 *     )
 * )
 */
Flight::route('DELETE /notes/@id', function ($id) {
    try {
        Flight::noteService()->deleteNote($id);
        Flight::json(['message' => 'Note deleted successfully']);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 404);
    }
});
