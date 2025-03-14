<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/whats-your-health', function () {
    return response()->json([
        'message' => 'healthy',
        'status' => 200,
        'env' => [
            'dbname' => getenv('dbname'),
            'username' => getenv('username'),
            'password' => getenv('password'),
            'host' => getenv('host'),
            'port' => getenv('port'),
            'config database host' => config('database.connections.mysql.host'),
        ]
    ], 200);
});
