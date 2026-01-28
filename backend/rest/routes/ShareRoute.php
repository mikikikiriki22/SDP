<?php

require_once __DIR__ . '/../dao/config.php';
require_once __DIR__ . '/../services/ReviewService.php';

/**
 * Public share route: GET /share/review/@id
 * Returns HTML with Open Graph and Twitter Card meta tags so Facebook, Twitter, etc.
 * display the perfume image, full review, and link when sharing.
 */
Flight::route('GET /share/review/@id', function ($id) {
    try {
        $svc = new ReviewService();
        $data = $svc->getReviewWithFragranceForShare($id);
    } catch (Exception $e) {
        header('Content-Type: text/html; charset=utf-8');
        http_response_code(404);
        echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Review not found</title></head>';
        echo '<body><p>Review not found.</p></body></html>';
        exit;
    }

    $base = Config::FRONTEND_BASE_URL();
    $imgPath = !empty($data['fragrance_image_url']) ? $data['fragrance_image_url'] : 'assets/images/default.jpg';
    $imageUrl = $base . ltrim($imgPath, '/');
    $itemUrl = $base . 'index.html#item?id=' . (int) $data['parfume_id'];

    $title = 'Review of ' . htmlspecialchars($data['fragrance_name'] ?? 'Fragrance') . ' by ' . htmlspecialchars($data['reviewer_name'] ?? 'Anonymous') . ' | AromaVerse';
    $rating = (int) ($data['rating'] ?? 0);
    $stars = str_repeat('★', $rating) . str_repeat('☆', 5 - $rating);
    $comment = htmlspecialchars($data['comment'] ?? '');
    $desc = sprintf('%s Rating: %s/5 — "%s" — %s', $stars, $data['rating'] ?? 'N/A', $comment, $data['reviewer_name'] ?? 'Anonymous');
    if (mb_strlen($desc) > 300) {
        $desc = mb_substr($desc, 0, 297) . '…';
    }

    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: public, max-age=300');
    echo '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>' . $title . '</title>
  <meta property="og:type" content="article">
  <meta property="og:url" content="' . htmlspecialchars($itemUrl) . '">
  <meta property="og:title" content="' . htmlspecialchars($title) . '">
  <meta property="og:description" content="' . $desc . '">
  <meta property="og:image" content="' . htmlspecialchars($imageUrl) . '">
  <meta property="og:image:secure_url" content="' . htmlspecialchars(str_replace('http://', 'https://', $imageUrl)) . '">
  <meta property="og:site_name" content="AromaVerse">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="' . htmlspecialchars($title) . '">
  <meta name="twitter:description" content="' . $desc . '">
  <meta name="twitter:image" content="' . htmlspecialchars($imageUrl) . '">
  <link rel="canonical" href="' . htmlspecialchars($itemUrl) . '">
</head>
<body>
  <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 1.5rem; text-align: center;">
    <img src="' . htmlspecialchars($imageUrl) . '" alt="' . htmlspecialchars($data['fragrance_name'] ?? 'Fragrance') . '" style="max-width: 100%; height: auto; border-radius: 12px; margin-bottom: 1rem;">
    <h1 style="color: #8C6A5D; font-size: 1.5rem;">' . htmlspecialchars($data['fragrance_name'] ?? 'Fragrance') . '</h1>
    <p style="color: #666;"><strong>' . $stars . '</strong> ' . htmlspecialchars($data['rating'] ?? '') . '/5 — ' . htmlspecialchars($data['reviewer_name'] ?? 'Anonymous') . '</p>
    <p style="color: #333; line-height: 1.5;">"' . nl2br($comment) . '"</p>
    <p style="margin-top: 1.5rem;">
      <a href="' . htmlspecialchars($itemUrl) . '" style="display: inline-block; background: #8C6A5D; color: #fff; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 8px; font-weight: 600;">View on AromaVerse</a>
    </p>
  </div>
</body>
</html>';
    exit;
});
