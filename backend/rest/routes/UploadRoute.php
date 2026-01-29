<?php

/**
 * File upload route for images (profile pics, fragrance images).
 * Uses DigitalOcean Spaces (S3-compatible) when SPACES_* env vars are set;
 * otherwise falls back to local backend/uploads/.
 * GET /uploads/@filename: serves from local or redirects to Spaces CDN.
 */

require_once __DIR__ . '/../dao/config.php';

// Helper: build Spaces CDN URL for a file key (e.g. uploads/fragrance_xxx.jpg)
function uploadRoute_spacesCdnUrl($key) {
    if (!Config::spacesEnabled()) return null;
    $bucket = Config::SPACES_BUCKET();
    $region = Config::SPACES_REGION();
    return 'https://' . $bucket . '.' . $region . '.cdn.digitaloceanspaces.com/' . $key;
}

// Serve uploaded images (public, no auth). Redirect to Spaces if file exists there; else serve from local.
Flight::route('GET /uploads/@filename', function($filename) {
    $filename = basename($filename);
    $key = 'uploads/' . $filename;

    if (Config::spacesEnabled()) {
        try {
            $region = Config::SPACES_REGION();
            $s3 = new \Aws\S3\S3Client([
                'version' => 'latest',
                'region' => $region,
                'endpoint' => 'https://' . $region . '.digitaloceanspaces.com',
                'credentials' => [
                    'key' => Config::SPACES_KEY(),
                    'secret' => Config::SPACES_SECRET(),
                ],
            ]);
            if ($s3->doesObjectExist(Config::SPACES_BUCKET(), $key)) {
                $cdnUrl = uploadRoute_spacesCdnUrl($key);
                Flight::redirect($cdnUrl, 302);
                return;
            }
        } catch (Exception $e) {
            // Fall through to local
        }
    }

    // Local: serve from backend/uploads/
    $uploadDir = dirname(dirname(__DIR__)) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
    $uploadDir = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $uploadDir);
    $filepath = $uploadDir . $filename;

    if (!file_exists($filepath) || !is_file($filepath)) {
        Flight::halt(404, 'Image not found');
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $filepath);
    finfo_close($finfo);

    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Cache-Control: post-check=0, pre-check=0', false);
    header('Pragma: no-cache');
    header('Expires: 0');
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . filesize($filepath));
    readfile($filepath);
    exit;
});

Flight::route('POST /upload/image', function() {
    try {
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

        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        if (!in_array($mimeType, $allowedTypes)) {
            Flight::json(['error' => 'Invalid file type. Only images are allowed.'], 400);
            return;
        }

        $maxSize = 5 * 1024 * 1024;
        if ($file['size'] > $maxSize) {
            Flight::json(['error' => 'File size too large. Maximum size is 5MB.'], 400);
            return;
        }

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];
        if (!in_array($extension, $allowedExtensions)) {
            Flight::json(['error' => 'Invalid file extension. Allowed: ' . implode(', ', $allowedExtensions)], 400);
            return;
        }
        $filename = uniqid('fragrance_', true) . '.' . $extension;
        $key = 'uploads/' . $filename;

        if (Config::spacesEnabled()) {
            // Upload to DigitalOcean Spaces (S3-compatible)
            $region = Config::SPACES_REGION();
            $bucket = Config::SPACES_BUCKET();
            $endpoint = 'https://' . $region . '.digitaloceanspaces.com';

            $s3 = new \Aws\S3\S3Client([
                'version' => 'latest',
                'region' => $region,
                'endpoint' => $endpoint,
                'credentials' => [
                    'key' => Config::SPACES_KEY(),
                    'secret' => Config::SPACES_SECRET(),
                ],
            ]);

            $s3->putObject([
                'Bucket' => $bucket,
                'Key' => $key,
                'Body' => file_get_contents($file['tmp_name']),
                'ACL' => 'public-read',
                'ContentType' => $mimeType,
            ]);

            $imageUrl = uploadRoute_spacesCdnUrl($key);
            Flight::json([
                'success' => true,
                'image_url' => $imageUrl,
                'message' => 'Image uploaded successfully'
            ], 200);
            return;
        }

        // Local fallback: save to backend/uploads/
        $backendDir = dirname(dirname(__DIR__));
        $uploadDir = $backendDir . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
        $uploadDir = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $uploadDir);

        if (!is_dir($uploadDir)) {
            if (!@mkdir($uploadDir, 0755, true)) {
                Flight::json(['error' => 'Failed to create upload directory'], 500);
                return;
            }
        }

        $targetPath = $uploadDir . $filename;
        if (!is_writable($uploadDir)) {
            @chmod($uploadDir, 0755);
            if (!is_writable($uploadDir)) {
                Flight::json(['error' => 'Upload directory is not writable'], 500);
                return;
            }
        }

        $moveResult = @move_uploaded_file($file['tmp_name'], $targetPath);
        if (!$moveResult) {
            $err = error_get_last();
            Flight::json(['error' => 'Failed to save uploaded file', 'details' => $err ? $err['message'] : 'Unknown error'], 500);
            return;
        }
        clearstatcache(true, $targetPath);
        chmod($targetPath, 0644);

        if (!file_exists($targetPath)) {
            Flight::json(['error' => 'File was not saved correctly'], 500);
            return;
        }
        $savedSize = filesize($targetPath);
        if (abs($savedSize - $file['size']) > 1024) {
            Flight::json(['error' => 'File size mismatch after upload', 'original_size' => $file['size'], 'saved_size' => $savedSize], 500);
            return;
        }
        if (function_exists('opcache_invalidate')) {
            opcache_invalidate($targetPath, true);
        }

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
