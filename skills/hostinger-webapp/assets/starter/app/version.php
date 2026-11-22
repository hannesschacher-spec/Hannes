<?php
// Zeigt, welche Version auf dem Server liegt. Enthält keine Daten.
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');
echo "__APP_NAME__ – Dateien vom " . gmdate('d.m.Y H:i', (int)filemtime(__DIR__ . '/index.php')) . " UTC\n";
