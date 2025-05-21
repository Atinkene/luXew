<?php
session_start();
$pdo = new PDO("mysql:host=localhost;dbname=mglsi_news", "massina", "passer");
$error = null;

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
    $password = $_POST['password'];

    if (!$email) {
        $error = "Email invalide.";
    } else {
        $stmt = $pdo->prepare("SELECT * FROM Utilisateur WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        $dummy_hash = '$2y$10$usesomesillystringforsalt$';

        if ($user) {
            $valid = password_verify($password, $user['mot_de_passe']);
        } else {
            $valid = password_verify($password, $dummy_hash);
        }

        if ($valid && $user) {
            session_regenerate_id(true);
            $_SESSION['user_id'] = $user['id'];

            $stmt = $pdo->prepare("SELECT r.nom FROM UtilisateurRole ur JOIN Role r ON ur.role_id = r.id WHERE ur.utilisateur_id = ?");
            $stmt->execute([$user['id']]);
            $role = $stmt->fetch();
            $_SESSION['role'] = $role ? $role['nom'] : null;

            header("Location: index.php");
            exit;
        } else {
            $error = "Email ou mot de passe incorrect";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Connexion</title>
    <link rel="stylesheet" href="./style/login.css" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
</head>
<body>
    <div class="container">
        <h2>Connexion</h2>
        <?php if ($error) : ?>
            <p style="color: #f87171; font-weight: 600; margin-bottom: 20px;"><?= htmlspecialchars($error) ?></p>
        <?php endif; ?>
        <form action="login.php" method="POST" novalidate>
            <input type="email" name="email" placeholder="Email" required />
            <input type="password" name="password" placeholder="Mot de passe" required />
            <button type="submit">Se connecter</button>
        </form>
        <p><a href="register.php">Pas de compte ? Inscrivez-vous</a></p>
    </div>
</body>
</html>
