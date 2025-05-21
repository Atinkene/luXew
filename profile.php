<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}
$pdo = new PDO("mysql:host=localhost;dbname=mglsi_news", "massina", "passer");
$user = $pdo->prepare("SELECT pseudo, email FROM Utilisateur WHERE id = ?");
$user->execute([$_SESSION['user_id']]);
$user = $user->fetch();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profil - MGLSI News</title>
    <link rel="stylesheet" href="./style/profile.css">
    
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
        <?php if (isset($_SESSION['role']) && $_SESSION['role'] == 'admin') { ?>
            <a href="admin.php">Admin</a>
        <?php } ?>
    </nav>
    <div class="container">
        <h2>Profil</h2>
        <div class="profile">
            <p><strong>Pseudo :</strong> <?php echo htmlspecialchars($user['pseudo']); ?></p>
            <p><strong>Email :</strong> <?php echo htmlspecialchars($user['email']); ?></p>
        </div>
    </div>
</body>
</html>