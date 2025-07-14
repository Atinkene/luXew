<?php
require_once '../services/ServicesSoap.php';

// Désactiver le cache WSDL pour développement
ini_set('soap.wsdl_cache_enabled', 0);
ini_set('soap.wsdl_cache_ttl', 0);

// Définir l'URI du service SOAP
$options = [
    'uri' => 'http://localhost/luXew/backend/public/soap',
    'soap_version' => SOAP_1_2,
    'encoding' => 'UTF-8'
];

// Créer le serveur SOAP
try {
    $serveur = new SoapServer(null, $options);
    $serveur->setClass('ServicesSoap');
    $serveur->handle();
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/xml');
    echo '<?xml version="1.0" encoding="UTF-8"?>';
    echo '<error>' . htmlspecialchars($e->getMessage()) . '</error>';
}
?>