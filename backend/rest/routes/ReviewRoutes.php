<?php

require_once __DIR__ . "/../services/ReviewService.php";
require_once __DIR__ . '/../../data/roles.php';


// making parfume service class accesible
Flight::register('reviewService', 'ReviewService');


//GET ALL REVIEWS

/**
 * @OA\Get(
 *     path="/reviews",
 *     summary="Get all reviews",
 *     tags={"Reviews"},
 *     @OA\Response(response=200, description="List of all reviews")
 * )
 */

Flight::group('/reviews', function() {
    Flight::route('GET /', function() {
        $reviews = Flight::reviewService()->getAllReviews();
        Flight::json($reviews);
    });

    //GET REVIEW BY ID

    /**
     * @OA\Get(
     *     path="/reviews/{id}",
     *     summary="Get review by ID",
     *     tags={"Reviews"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Review found"),
     *     @OA\Response(response=404, description="Review not found")
     * )
     */

    Flight::route('GET /@id', function($id) {
        $review = Flight::reviewService()->getReviewById($id);

        if ($review) {
            Flight::json($review);
        } else {
            Flight::json(["error" => "Fragrance not found"], 404);
        }
    });

    //ADDING REVIEW

    /**
     * @OA\Post(
     *     path="/reviews",
     *     summary="Add a new review",
     *     tags={"Reviews"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="fragrance_id", type="integer"),
     *             @OA\Property(property="rating", type="number", format="float"),
     *             @OA\Property(property="comment", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Review added successfully"),
     *     @OA\Response(response=500, description="Failed to add review")
     * )
     */

    Flight::route('POST /', function() {
        Flight::auth_middleware()->authorizeRoles([Roles::USER, Roles::ADMIN]);
        $data = Flight::request()->data->getData();
        $data['user_id'] = Flight::get('user')->id; // Set the user_id from the authenticated user
        $result = Flight::reviewService()->createReview($data);
        Flight::json($result);
    });

    //UPDATING REVIEW

    /**
     * @OA\Put(
     *     path="/reviews/{id}",
     *     summary="Update a review",
     *     tags={"Reviews"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="rating", type="number", format="float"),
     *             @OA\Property(property="comment", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Review updated successfully"),
     *     @OA\Response(response=500, description="Failed to update review")
     * )
     */

    Flight::route('PUT /@id', function($id) {
        $user = Flight::get('user');
        $review = Flight::reviewService()->getReviewById($id);
        
        // Allow if user is admin or the review author
        if ($user->role !== Roles::ADMIN && $review['user_id'] != $user->id) {
            Flight::halt(403, 'Access denied');
        }
        
        $data = Flight::request()->data->getData();
        $result = Flight::reviewService()->updateReview($id, $data);
        Flight::json($result);
    });

    //DELETING REVIEW

    /**
     * @OA\Delete(
     *     path="/reviews/{id}",
     *     summary="Delete a review",
     *     tags={"Reviews"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Review deleted successfully"),
     *     @OA\Response(response=404, description="Review not found")
     * )
     */

    Flight::route('DELETE /@id', function($id) {
        $user = Flight::get('user');
        $review = Flight::reviewService()->getReviewById($id);
        
        if (!$review) {
            Flight::json(['success' => false, 'message' => 'Review not found'], 404);
            return;
        }
        
        // Allow if user is admin or the review author
        if ($user->role !== Roles::ADMIN && $review['user_id'] != $user->id) {
            Flight::halt(403, 'Access denied');
        }
        
        $result = Flight::reviewService()->deleteReview($id);
        if ($result) {
            Flight::json(['success' => true, 'message' => 'Review deleted successfully']);
        } else {
            Flight::json(['success' => false, 'message' => 'Failed to delete review'], 500);
        }
    });
});

// Move this route outside the group
Flight::route('GET /reviews/user/@id', function($id) {
    $reviews = Flight::reviewService()->getReviewsByUserId($id);
    Flight::json($reviews);
});

//GET REVIEWS BY FRAGRANCE ID

/**
 * @OA\Get(
 *     path="/reviews/fragrance/{id}",
 *     summary="Get reviews by fragrance ID",
 *     tags={"Reviews"},
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\Response(response=200, description="List of reviews for the specified fragrance"),
 *     @OA\Response(response=404, description="Fragrance not found")
 * )
 */

Flight::route('GET /reviews/fragrance/@id', function($id) {
    $reviews = Flight::reviewService()->getReviewsByFragranceId($id);
    Flight::json($reviews);
});