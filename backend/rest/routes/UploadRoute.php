<?php

/**
 * File upload route for images (profile pics, fragrance images).
 * Any authenticated user can upload. Global middleware enforces JWT.
 * Uploads are stored in backend/uploads/ and served via GET /uploads/@filename.
 */

// Serve uploaded images (public, no auth required)
Flight::route('GET /uploads/@filename', function($filename) {
    $filename = basename($filename);
    $uploadDir = dirname(dirname(__DIR__)) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
    $uploadDir = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $uploadDir);
    $filepath = $uploadDir . $filename;

    if (!file_exists($filepath) || !is_file($filepath)) {
        Flight::halt(404, 'Image not found');
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $filepath);
    finfo_close($finfo);

    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . filesize($filepath));
    readfile($filepath);
    exit;
});

Flight::route('POST /upload/image', function() {
    try {
        // Any authenticated user can upload (profile pics, fragrance images). Global middleware enforces JWT.

        if (!isset($_FILES['image'])) {
            Flight::json(['error' => 'No file uploaded. $_FILES is empty.'], 400);
            return;
        }
        
        if ($_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            $errorMessages = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
            ];
            $errorMsg = $errorMessages[$_FILES['image']['error']] ?? 'Unknown upload error: ' . $_FILES['image']['error'];
            Flight::json(['error' => $errorMsg], 400);
            return;
        }

        $file = $_FILES['image'];
        
        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mimeType, $allowedTypes)) {
            Flight::json(['error' => 'Invalid file type. Only images are allowed.'], 400);
            return;
        }
        
        // Validate file size (max 5MB)
        $maxSize = 5 * 1024 * 1024; // 5MB
        if ($file['size'] > $maxSize) {
            Flight::json(['error' => 'File size too large. Maximum size is 5MB.'], 400);
            return;
        }
        
        // Generate unique filename
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        // Ensure valid extension
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];
        if (!in_array($extension, $allowedExtensions)) {
            Flight::json(['error' => 'Invalid file extension. Allowed: ' . implode(', ', $allowedExtensions)], 400);
            return;
        }
        $filename = uniqid('fragrance_', true) . '.' . $extension;
        
        // Save to backend/uploads/ (works when backend and frontend are separate, e.g. on DigitalOcean)
        // __DIR__ = backend/rest/routes, dirname(dirname(__DIR__)) = backend
        $backendDir = dirname(dirname(__DIR__));
        $uploadDir = $backendDir . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
        $uploadDir = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $uploadDir);
        
        // Create directory if it doesn't exist
        if (!is_dir($uploadDir)) {
            if (!@mkdir($uploadDir, 0755, true)) {
                Flight::json([
                    'error' => 'Failed to create upload directory'
                ], 500);
                return;
            }
        }
        
        $targetPath = $uploadDir . $filename;
        
        // Check if directory is writable
        if (!is_writable($uploadDir)) {
            // Try to make it writable
            @chmod($uploadDir, 0755);
            if (!is_writable($uploadDir)) {
                Flight::json([
                    'error' => 'Upload directory is not writable'
                ], 500);
                return;
            }
        }
        
        // Move uploaded file
        $moveResult = @move_uploaded_file($file['tmp_name'], $targetPath);
        if (!$moveResult) {
            $error = error_get_last();
            Flight::json([
                'error' => 'Failed to save uploaded file',
                'details' => $error ? $error['message'] : 'Unknown error'
            ], 500);
            return;
        }
        
        // Verify file was actually saved
        if (!file_exists($targetPath)) {
            Flight::json([
                'error' => 'File was not saved correctly'
            ], 500);
            return;
        }
        
        // Verify file size matches (allow small differences due to filesystem)
        $savedSize = filesize($targetPath);
        if (abs($savedSize - $file['size']) > 1024) { // Allow 1KB difference
            Flight::json([
                'error' => 'File size mismatch after upload',
                'original_size' => $file['size'],
                'saved_size' => $savedSize
            ], 500);
            return;
        }
        
        // Return path relative to backend base URL (frontend prepends API base URL to load image)
        $imageUrl = 'uploads/' . $filename;
        
        Flight::json([
            'success' => true,
            'image_url' => $imageUrl,
            'message' => 'Image uploaded successfully'
        ], 200);
        
    } catch (Exception $e) {
        Flight::json(['error' => $e->getMessage()], 500);
    }
});
