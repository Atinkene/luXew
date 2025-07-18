<?php
class AuthResponse {
    public bool $succes = false;
    public ?string $jeton = null;
    public ?string $message = null;
}

class StandardResponse {
    public bool $succes = false;
    public ?string $message = null;
    public ?int $utilisateurId = null;
}

class RolesArray {
    /** @var string[] */
    public array $item = [];
}

class RolesListResponse {
    public RolesArray $roles;
    
    public function __construct() {
        $this->roles = new RolesArray();
    }
}

class Utilisateur {
    public int $id = 0;
    public string $pseudo = '';
    public string $email = '';
    public RolesArray $roles;
    
    public function __construct() {
        $this->roles = new RolesArray();
    }
}

class UtilisateursArray {
    /** @var Utilisateur[] */
    public array $item = [];
}

class UtilisateursListResponse {
    public UtilisateursArray $utilisateurs;
    
    public function __construct() {
        $this->utilisateurs = new UtilisateursArray();
    }
}
?>