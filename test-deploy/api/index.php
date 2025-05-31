<?php
header('Content-Type: application/json');

// Test endpoint
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'status' => 'success',
        'message' => 'API is working correctly',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// Handle other methods
http_response_code(405);
echo json_encode([
    'status' => 'error',
    'message' => 'Method not allowed'
]); 