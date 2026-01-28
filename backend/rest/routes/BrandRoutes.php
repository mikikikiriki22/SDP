<?php

require_once __DIR__ . "/../services/BrandService.php";

// making brand service class accessible
Flight::register('brandService', 'BrandService');

// GET ALL BRANDS

/**
 * @OA\Get(
 *     path="/brands",
 *     tags={"Brands"},
 *     summary="Get all brands",
 *     @OA\Response(
 *         response=200,
 *         description="List of all brands"
 *     )
 * )
 */
Flight::route('GET /brands', function () {
    $data = Flight::brandService()->getAllBrands();
    Flight::json($data);
});

// GET BRAND BY ID

/**
 * @OA\Get(
 *     path="/brands/{id}",
 *     tags={"Brands"},
 *     summary="Get brand by ID",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Brand found"
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Brand not found"
 *     )
 * )
 */
Flight::route('GET /brands/@id', function ($id) {
    $brand = Flight::brandService()->getBrandById($id);

    if ($brand) {
        Flight::json($brand);
    } else {
        Flight::json(["error" => "Brand not found"], 404);
    }
});

// ADD BRAND

/**
 * @OA\Post(
 *     path="/brands",
 *     tags={"Brands"},
 *     summary="Add a new brand",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"name", "country"},
 *             @OA\Property(property="name", type="string"),
 *             @OA\Property(property="country", type="string")
 *         )
 *     ),
 *     @OA\Response(
 *         response=201,
 *         description="Brand added successfully"
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Failed to add brand"
 *     )
 * )
 */
Flight::route('POST /brands', function () {
    $data = Flight::request()->data->getData();

    $brandService = new BrandService();
    $result = $brandService->addBrand($data);

    if ($result) {
        Flight::json(['message' => 'Brand added successfully'], 201);
    } else {
        Flight::json(['message' => 'Failed to add brand'], 500);
    }
});

// UPDATE BRAND

/**
 * @OA\Put(
 *     path="/brands/{id}",
 *     tags={"Brands"},
 *     summary="Update a brand",
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
 *             @OA\Property(property="country", type="string")
 *         )
 *     ),
 *     @OA\Response(
 *         response=201,
 *         description="Brand updated successfully"
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Failed to update brand"
 *     )
 * )
 */
Flight::route('PUT /brands/@id', function ($id) {
    $data = Flight::request()->data->getData();

    $brandService = new BrandService();
    $result = $brandService->updateBrand($id, $data);

    if ($result) {
        Flight::json(['message' => 'Brand updated successfully'], 201);
    } else {
        Flight::json(['message' => 'Failed to update brand'], 500);
    }
});

// DELETE BRAND

/**
 * @OA\Delete(
 *     path="/brands/{id}",
 *     tags={"Brands"},
 *     summary="Delete a brand",
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Brand deleted successfully"
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Brand not found"
 *     )
 * )
 */
Flight::route('DELETE /brands/@id', function ($id) {
    try {
        Flight::brandService()->deleteBrand($id);
        Flight::json(['message' => 'Brand deleted successfully']);
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 404);
    }
});
