<?php


require_once __DIR__ . "/../services/ParfumeService.php";
require_once __DIR__ . '/../../data/roles.php';


// making parfume service class accesible
Flight::register('parfumeService', 'ParfumeService');



//GET ALL FRAGRANCES

/**
 * 
 * @OA\Get(
 *     path="/parfumes",
 *     tags={"Fragrances"},
 *     summary="Get all fragrances",
 *     @OA\Response(
 *         response=200,
 *         description="List of all fragrances"
 *     )
 * )
 */

Flight::route('GET /parfumes', function () {
    $data = Flight::parfumeService()->getAllFragrances();
    Flight::json($data);
});



//GET FRAGRANCE BY ID

/**
 * @OA\Get(
 *     path="/parfumes/{id}",
 *     tags={"Fragrances"},
 *     summary="Get fragrance by ID",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Fragrance found"
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Fragrance not found"
 *     )
 * )
 */

Flight::route('GET /parfumes/@id', function ($id) {
    $fragrance = Flight::parfumeService()->getFragranceById($id);

    if ($fragrance) {
        Flight::json($fragrance);
    } else {
        Flight::json(["error" => "Fragrance not found"], 404);
    }
});



//ADDING FRAGRANCE

/**
 * @OA\Post(
 *     path="/parfumes",
 *     tags={"Fragrances"},
 *     summary="Add a new fragrance",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"name", "brand", "notes"},
 *             @OA\Property(property="name", type="string"),
 *             @OA\Property(property="brand", type="string"),
 *             @OA\Property(property="notes", type="string")
 *         )
 *     ),
 *     @OA\Response(
 *         response=201,
 *         description="Fragrance added successfully"
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Failed to add fragrance"
 *     )
 * )
 */

Flight::route('POST /parfumes', function () {
    try {
        console.log("Adding fragrance");
        $data = Flight::request()->data->getData();
        $fragranceService = new ParfumeService();
        $result = $fragranceService->addFragrance($data);
        if ($result) {
            Flight::json(['message' => 'Fragrance added successfully'], 201);
        } else {
            Flight::json(['message' => 'Failed to add fragrance'], 500);
        }
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 500);
    }
});



//UPDATING FRAGRANCE

/**
 * @OA\Put(
 *     path="/parfumes/{id}",
 *     tags={"Fragrances"},
 *     summary="Update a fragrance",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             @OA\Property(property="name", type="string"),
 *             @OA\Property(property="brand", type="string"),
 *             @OA\Property(property="notes", type="string")
 *         )
 *     ),
 *     @OA\Response(
 *         response=201,
 *         description="Fragrance updated successfully"
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Failed to update fragrance"
 *     )
 * )
 */

Flight::route('PUT /parfumes/@id', function ($id) {
    try {
        $data = Flight::request()->data->getData();
        $fragranceService = new ParfumeService();
        $result = $fragranceService->updateFragrance($id, $data);
        if ($result) {
            Flight::json(['message' => 'Fragrance updated successfully'], 201);
        } else {
            Flight::json(['message' => 'Failed to update fragrance'], 500);
        }
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 500);
    }
});



//DELETING FRAGRANCE

/**
 * @OA\Delete(
 *     path="/parfumes/{id}",
 *     tags={"Fragrances"},
 *     summary="Delete a fragrance",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Fragrance deleted successfully"
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Fragrance not found"
 *     )
 * )
 */

Flight::route('DELETE /parfumes/@id', function ($id) {
    try {
        $result = Flight::parfumeService()->deleteFragrance($id);
        if ($result) {
            Flight::json(['success' => true, 'message' => 'Fragrance deleted successfully'], 200);
        } else {
            Flight::json(['success' => false, 'error' => 'Failed to delete fragrance'], 500);
        }
    } catch (Exception $e) {
        Flight::json(['success' => false, 'error' => $e->getMessage()], 404);
    }
});

Flight::group('/perfumes', function() {
    /**
     * @OA\Get(
     *     path="/perfumes",
     *     summary="Get all perfumes",
     *     tags={"perfumes"},
     *     @OA\Response(
     *         response=200,
     *         description="List of all perfumes"
     *     )
     * )
     */
    Flight::route('GET /', function() {
        $perfumes = Flight::parfumeService()->get_all();
        Flight::json($perfumes);
    });

    /**
     * @OA\Post(
     *     path="/perfumes",
     *     summary="Create new perfume",
     *     tags={"perfumes"},
     *     security={{"bearerAuth": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Perfume")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Perfume created successfully"
     *     )
     * )
     */
    Flight::route('POST /', function() {
        Flight::auth_middleware()->authorizeRole(Roles::ADMIN);
        $data = Flight::request()->data->getData();
        $result = Flight::parfumeService()->add($data);
        Flight::json($result);
    });

    /**
     * @OA\Put(
     *     path="/perfumes/@id",
     *     summary="Update perfume",
     *     tags={"perfumes"},
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Perfume")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Perfume updated successfully"
     *     )
     * )
     */
    Flight::route('PUT /@id', function($id) {
        Flight::auth_middleware()->authorizeRole(Roles::ADMIN);
        $data = Flight::request()->data->getData();
        $result = Flight::parfumeService()->update($id, $data);
        Flight::json($result);
    });

    /**
     * @OA\Delete(
     *     path="/perfumes/@id",
     *     summary="Delete perfume",
     *     tags={"perfumes"},
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Perfume deleted successfully"
     *     )
     * )
     */
    Flight::route('DELETE /@id', function($id) {
        Flight::auth_middleware()->authorizeRole(Roles::ADMIN);
        $result = Flight::parfumeService()->delete($id);
        Flight::json($result);
    });
});
