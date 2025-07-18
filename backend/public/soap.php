<?php
// Activer le débogage complet
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('soap.wsdl_cache_enabled', 0);
error_reporting(E_ALL);

error_log("SOAP Debug: Lancement du serveur");

// Vérifier les chemins vers les classes
require_once realpath('../services/ServicesSoap.php');
require_once realpath('../services/ReponsesSoap.php');

// Config SOAP
$wsdlFile = __DIR__ . '/wsdl/ServicesSoap.wsdl';
if (!file_exists($wsdlFile)) {
    error_log("WSDL introuvable à $wsdlFile");
    http_response_code(500);
    exit("Fichier WSDL introuvable");
}

$options = [
    'soap_version' => SOAP_1_1,
    'encoding' => 'UTF-8',
    'cache_wsdl' => WSDL_CACHE_NONE,
    'trace' => true,
    'exceptions' => true,
    'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
    'classmap' => [
        'AuthResponse' => AuthResponse::class,
        'StandardResponse' => StandardResponse::class,
        'Utilisateur' => Utilisateur::class,
        'UtilisateursArray' => UtilisateursArray::class,
        'UtilisateursList' => UtilisateursList::class,
    ]
];

// CORS pour tests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, SOAPAction');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $server = new SoapServer($wsdlFile, $options);

    $soapImpl = new ServicesSoap();
    $server->setObject($soapImpl);

    ob_start();
    $server->handle();
    $response = ob_get_clean();

    echo $response;
} catch (Exception $e) {
    error_log("SOAP Erreur: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/soap+xml; charset=utf-8');

    echo '<?xml version="1.0" encoding="UTF-8"?>';
    echo '<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">';
    echo '<env:Body><env:Fault>';
    echo '<env:Code><env:Value>env:Server</env:Value></env:Code>';
    echo '<env:Reason><env:Text xml:lang="fr">' . htmlspecialchars($e->getMessage()) . '</env:Text></env:Reason>';
    echo '<env:Detail><debug:Error xmlns:debug="http://debug">' . htmlspecialchars($e->getTraceAsString()) . '</debug:Error></env:Detail>';
    echo '</env:Fault></env:Body></env:Envelope>';
}
?>
