<?php
session_start();
$pdo = new PDO("mysql:host=localhost;dbname=mglsi_news", "massina", "passer");
$stmt = $pdo->prepare("SELECT r.nom FROM Role r JOIN UtilisateurRole ur ON r.id = ur.role_id WHERE ur.utilisateur_id = ?");
$stmt->execute([$_SESSION['user_id']]);
$roles = $stmt->fetchAll(PDO::FETCH_COLUMN);
if (!isset($_SESSION['user_id']) || !in_array('admin', $roles)) {
    header("Location: index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - MGLSI News</title>
    <link rel="stylesheet" href="./style/admin.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <h1>MGLSI News</h1>
        <div class="auth">
            <a href="profile.php">Profil</a> | <a href="logout.php">Déconnexion</a>
        </div>
    </header>
    <nav>
        <a href="index.php">Accueil</a>
        <a href="categories.php">Catégories</a>
        <a href="preferences.php">Préférences</a>
        <a href="followed.php">Suivis</a>
        <a href="admin.php">Admin</a>
    </nav>
    <div class="container">
        <h2>Panneau d'administration</h2>
        <div class="admin-section">
            <h3>Articles</h3>
            <?php
            $stmt = $pdo->query("SELECT a.id, a.titre, u.pseudo FROM Article a JOIN Utilisateur u ON a.auteur_id = u.id");
            echo "<table>";
            echo "<tr><th>ID</th><th>Titre</th><th>Auteur</th></tr>";
            while ($row = $stmt->fetch()) {
                echo "<tr><td>{$row['id']}</td><td>{$row['titre']}</td><td>{$row['pseudo']}</td></tr>";
            }
            echo "</table>";
            ?>
        </div>
        <div class="admin-section">
            <h3>Utilisateurs</h3>
            <?php
            $stmt = $pdo->query("SELECT id, pseudo, email FROM Utilisateur");
            echo "<table>";
            echo "<tr><th>ID</th><th>Pseudo</th><th>Email</th></tr>";
            while ($row = $stmt->fetch()) {
                echo "<tr><td>{$row['id']}</td><td>{$row['pseudo']}</td><td>{$row['email']}</td></tr>";
            }
            echo "</table>";
            ?>
        </div>
    </div>
</body>
</html>