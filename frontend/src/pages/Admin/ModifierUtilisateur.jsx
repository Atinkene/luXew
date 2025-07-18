import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ModifierUtilisateur() {
  const { id } = useParams();
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState([]);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/utilisateurs/${id}`)
      .then(res => {
        setPseudo(res.data.pseudo);
        setEmail(res.data.email);
        setRoles(res.data.roles || []);
      })
      .catch(() => alert("Erreur lors du chargement de l'utilisateur"));

    api.get('/roles')
      .then(res => setRolesDisponibles(res.data))
      .catch(() => alert("Erreur lors du chargement des rôles"));
  }, [id]);

  const toggleRole = (role) => {
    if (roles.includes(role)) {
      setRoles(roles.filter(r => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pseudo.trim() || !email.trim()) {
      alert("Pseudo et Email sont obligatoires");
      return;
    }

    try {
      await api.put(`/utilisateurs/${id}`, { pseudo, email, roles });
      alert("Utilisateur modifié avec succès");
      navigate('/admin/utilisateurs');
    } catch (error) {
      alert("Erreur lors de la modification de l'utilisateur");
    }
  };

  return (
    <div>
      <h1>Modifier utilisateur</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Pseudo : <br />
          <input type="text" value={pseudo} onChange={e => setPseudo(e.target.value)} required />
        </label>
        <br /><br />
        <label>
          Email : <br />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <br /><br />
        <fieldset>
          <legend>Rôles</legend>
          {rolesDisponibles.map(role => (
            <label key={role} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={roles.includes(role)}
                onChange={() => toggleRole(role)}
              />
              {' '}{role}
            </label>
          ))}
        </fieldset>
        <br />
        <button type="submit">Enregistrer</button>{' '}
        <button type="button" onClick={() => navigate('/admin/utilisateurs')}>Annuler</button>
      </form>
    </div>
  );
}
