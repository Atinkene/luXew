<?php
session_start();
$pdo = new PDO("mysql:host=localhost;dbname=mglsi_news", "massina", "passer");
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $contenu = $_POST['contenu'];
    $article_id = $_POST['article_id'];
    $parent_id = isset($_POST['parent_id']) ? $_POST['parent_id'] : null;
    $utilisateur_id = $_SESSION['user_id'];
    $stmt = $pdo->prepare("INSERT INTO Commentaire (contenu, utilisateur_id, article_id, parent_id) VALUES (?, ?, ?, ?)");
    $stmt->execute([$contenu, $utilisateur_id, $article_id, $parent_id]);
    header("Location: article.php?id=$article_id");
}
?>