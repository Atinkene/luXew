<?php
session_start();
$pdo = new PDO("mysql:host=localhost;dbname=mglsi_news", "massina", "passer");
$stmt = $pdo->prepare("SELECT r.nom FROM Role r JOIN UtilisateurRole ur ON r.id = ur.role_id WHERE ur.utilisateur_id = ?");
$stmt->execute([$_SESSION['user_id']]);
$roles = $stmt->fetchAll(PDO::FETCH_COLUMN);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MGLSI News</title>
    <link rel="stylesheet" href="./style/index.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <h1>MGLSI News</h1>
        <div class="auth">
            <?php
            if (isset($_SESSION['user_id'])) {
                echo '<a href="./profile.php">Profil</a> | <a href="./logout.php">Déconnexion</a>';
            } else {
                echo '<a href="./login.php">Connexion</a> | <a href="./register.php">Inscription</a>';
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
        <?php if (in_array('admin', $roles)) { ?>
            <a href="admin.php">Admin</a>
        <?php } ?>
    </nav>
    <div class="container">
        <div class="search">
            <form action="index.php" method="GET">
                <input type="text" name="search" placeholder="Rechercher un article...">
                <button type="submit">Rechercher</button>
            </form>
        </div>
        <div class="categories">
            <form action="index.php" method="GET">
                <select name="category" onchange="this.form.submit()">
                    <option value="">Toutes les catégories</option>
                    <?php
                    $stmt = $pdo->query("SELECT * FROM Categorie");
                    while ($row = $stmt->fetch()) {
                        echo "<option value='{$row['id']}'>{$row['libelle']}</option>";
                    }
                    ?>
                </select>
            </form>
        </div>
        <div class="articles">
            <?php
            $query = "SELECT a.*, u.pseudo, i.image_url FROM Article a JOIN Utilisateur u ON a.auteur_id = u.id LEFT JOIN ImageArticle i ON a.id = i.article_id";
            if (isset($_GET['category']) && !empty($_GET['category'])) {
                $query .= " JOIN ArticleCategorie ac ON a.id = ac.article_id WHERE ac.categorie_id = :cat";
            }
            if (isset($_GET['search']) && !empty($_GET['search'])) {
                $query .= (strpos($query, 'WHERE') ? ' AND' : ' WHERE') . " a.titre LIKE :search";
            }
            $query .= " ORDER BY a.dateCreation DESC";
            $stmt = $pdo->prepare($query);
            if (isset($_GET['category']) && !empty($_GET['category'])) {
                $stmt->bindValue(':cat', $_GET['category'], PDO::PARAM_INT);
            }
            if (isset($_GET['search']) && !empty($_GET['search'])) {
                $stmt->bindValue(':search', '%' . $_GET['search'] . '%', PDO::PARAM_STR);
            }
            $stmt->execute();
            while ($row = $stmt->fetch()) {
                echo "<div class='article'>";
                if ($row['image_url']) {
                    echo "<img src='{$row['image_url']}' alt='Article image'>";
                }
                echo "<div class='article-content'>";
                echo "<h2><a href='article.php?id={$row['id']}'>{$row['titre']}</a></h2>";
                echo "<p>" . substr($row['contenu'], 0, 100) . "...</p>";
                echo "<div class='meta'>Par {$row['pseudo']} le {$row['dateCreation']}</div>";
                echo "</div>";
                echo "</div>";
            }
            ?>
        </div>
    </div>
</body>
</html>