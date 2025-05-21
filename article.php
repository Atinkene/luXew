<?php
session_start();
$pdo = new PDO("mysql:host=localhost;dbname=mglsi_news", "massina", "passer");
$article_id = $_GET['id'];
$stmt = $pdo->prepare("SELECT a.*, u.pseudo FROM Article a JOIN Utilisateur u ON a.auteur_id = u.id WHERE a.id = ?");
$stmt->execute([$article_id]);
$article = $stmt->fetch();

if (!$article) {
    die("Article non trouvé");
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $article['titre']; ?></title>
    <link rel="stylesheet" href="./style/article.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <h1>MGLSI News</h1>
        <div class="auth">
            <?php
            if (isset($_SESSION['user_id'])) {
                echo '<a href="profile.php">Profil</a> | <a href="logout.php">Déconnexion</a>';
            } else {
                echo '<a href="login.php">Connexion</a> | <a href="register.php">Inscription</a>';
            }
            ?>
        </div>
    </header>
    <nav>
        <a href="index.php">Accueil</a>
        <a href="categories.php">Catégories</a>
        <?php if (isset($_SESSION['user_id'])) { ?>
            <a href="preferences.php">Préférences</a>
            <a href="followed.php">Suivis</a>
        <?php } ?>
    </nav>
    <div class="container">
        <div class="article">
            <h1><?php echo $article['titre']; ?></h1>
            <div class="meta">Par <?php echo $article['pseudo']; ?> le <?php echo $article['dateCreation']; ?></div>
            <p><?php echo $article['contenu']; ?></p>
            <?php
            $stmt = $pdo->prepare("SELECT image_url, description FROM ImageArticle WHERE article_id = ?");
            $stmt->execute([$article_id]);
            while ($img = $stmt->fetch()) {
                echo "<img src='{$img['image_url']}' alt='{$img['description']}'>";
            }
            ?>
            <div class="reactions">
                <?php
                if (isset($_SESSION['user_id'])) {
                    $stmt = $pdo->prepare("SELECT type FROM Reaction WHERE utilisateur_id = ? AND article_id = ?");
                    $stmt->execute([$_SESSION['user_id'], $article_id]);
                    $reaction = $stmt->fetch();
                    if (!$reaction || $reaction['type'] != 'like') {
                        echo "<a href='react.php?type=like&article_id=$article_id'>Like</a>";
                    }
                    if (!$reaction || $reaction['type'] != 'unlike') {
                        echo "<a href='react.php?type=unlike&article_id=$article_id'>Unlike</a>";
                    }
                }
                ?>
            </div>
        </div>
        <div class="comments">
            <h3>Commentaires</h3>
            <?php
            $stmt = $pdo->prepare("SELECT c.*, u.pseudo FROM Commentaire c JOIN Utilisateur u ON c.utilisateur_id = u.id WHERE c.article_id = ? AND c.parent_id IS NULL");
            $stmt->execute([$article_id]);
            while ($comment = $stmt->fetch()) {
                echo "<div class='comment'>";
                echo "<div class='meta'><strong>{$comment['pseudo']}</strong> le {$comment['dateCreation']}</div>";
                echo "<p>{$comment['contenu']}</p>";
                if (isset($_SESSION['user_id'])) {
                    echo "<a href='comment.php?article_id=$article_id&parent_id={$comment['id']}'>Répondre</a>";
                }
                echo "</div>";
            }
            ?>
            <?php if (isset($_SESSION['user_id'])) { ?>
                <form class="comment-form" action="comment.php" method="POST">
                    <input type="hidden" name="article_id" value="<?php echo $article_id; ?>">
                    <textarea name="contenu" placeholder="Votre commentaire..." required></textarea>
                    <button type="submit">Commenter</button>
                </form>
            <?php } ?>
        </div>
    </div>
</body>
</html>