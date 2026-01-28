<?php

require_once __DIR__ . "/../services/UserService.php";
require_once __DIR__ . '/../../data/roles.php';


// making parfume service class accesible
Flight::register('userService', 'UserService');


//GET ALL USERS

Flight::group('/users', function() {
    /**
     * @OA\Get(
     *     path="/users",
     *     summary="Get all users",
     *     tags={"users"},
     *     security={{"bearerAuth": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="List of all users"
     *     )
     * )
     */
    Flight::route('GET /', function() {
        Flight::auth_middleware()->authorizeRole(Roles::ADMIN);
        $users = Flight::userService()->getAllUsers();
        Flight::json($users);
    });

    //GET USER BY ID

    /**
     * @OA\Get(
     *     path="/users/@id",
     *     summary="Get user by ID",
     *     tags={"users"},
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="User details"
     *     )
     * )
     */
    Flight::route('GET /@id', function($id) {
        $user = Flight::get('user');
        if ($user->id != $id && $user->role !== Roles::ADMIN) {
            Flight::halt(403, 'Access denied');
        }
        $result = Flight::userService()->getUserById($id);
        Flight::json($result);
    });

    //EDITING USER PROFILE

    /**
     * @OA\Put(
     *     path="/users/@id",
     *     summary="Update user",
     *     tags={"users"},
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/User")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="User updated successfully"
     *     )
     * )
     */
    Flight::route('PUT /@id', function($id) {
        $user = Flight::get('user');
        if ($user->id != $id && $user->role !== Roles::ADMIN) {
            Flight::halt(403, 'Access denied');
        }
        $data = Flight::request()->data->getData();
        // Prevent regular users from escalating privileges by changing their own role
        if ($user->role !== Roles::ADMIN && isset($data['role'])) {
            unset($data['role']);
        }
        $result = Flight::userService()->updateUser($id, $data);
        Flight::json($result);
    });

    //DELETING USER

    /**
     * @OA\Delete(
     *     path="/users/@id",
     *     summary="Delete user",
     *     tags={"users"},
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="User deleted successfully"
     *     )
     * )
     */
    Flight::route('DELETE /@id', function($id) {
        Flight::auth_middleware()->authorizeRole(Roles::ADMIN);
        $result = Flight::userService()->deleteUser($id);
        if ($result) {
            Flight::json(['success' => true, 'message' => 'User deleted successfully']);
        } else {
            Flight::json(['success' => false, 'message' => 'Failed to delete user'], 500);
        }
    });
});