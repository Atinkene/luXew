import { useAuth } from '../contexte/AuthContexte';
import { useEffect } from 'react';

const DebugAuth = () => {
  const { utilisateur, token, estCharge } = useAuth();
  
  useEffect(() => {
    console.log('=== DEBUG AUTH ===');
    console.log('localStorage JWT:', localStorage.getItem('jwt'));
    console.log('localStorage Utilisateur:', localStorage.getItem('utilisateur'));
    console.log('Context Token:', token);
    console.log('Context Utilisateur:', utilisateur);
    console.log('Context estCharge:', estCharge);
    console.log('================');
  }, [utilisateur, token, estCharge]);
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Debug Auth</h4>
      <p><strong>Est chargé:</strong> {estCharge ? 'Oui' : 'Non'}</p>
      <p><strong>Token:</strong> {token ? 'Présent' : 'Absent'}</p>
      <p><strong>Utilisateur:</strong> {utilisateur ? utilisateur.pseudo : 'Null'}</p>
      <p><strong>Rôles:</strong> {utilisateur ? utilisateur.roles.join(', ') : 'Aucun'}</p>
      <p><strong>localStorage JWT:</strong> {localStorage.getItem('jwt') ? 'Présent' : 'Absent'}</p>
      <p><strong>localStorage User:</strong> {localStorage.getItem('utilisateur') ? 'Présent' : 'Absent'}</p>
    </div>
  );
};

export default DebugAuth;