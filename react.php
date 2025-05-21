<?php
    session_start();
    if (!isset($_SESSION['user_id']) || !isset($_POST['article_id']) || !isset($_POST['type'])) {
        header("Location: index.php");
        exit;
    }
    $pdo = new PDO("mysql:host=localhost;dbname=mglsi_news", "massina", "passer");
    $pdo->prepare("INSERT INTO Reaction (article_id, utilisateur_id, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE type = ?")
        ->execute([$_POST['article_id'], $_SESSION['user_id'], $_POST['type'], $_POST['type']]);
    header("Location: article.php?id=" . $_POST['article_id']);
    exit;
?>