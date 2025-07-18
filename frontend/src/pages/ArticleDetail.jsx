import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexte/AuthContexte';
import Header from '../components/Header';

function ArticleDetail() {
  const { id } = useParams();
  const { utilisateur } = useAuth();
  const role = utilisateur?.role;

  const [article, setArticle] = useState(null);
  const [commentaires, setCommentaires] = useState([]);
  const [nouveauCommentaire, setNouveauCommentaire] = useState('');
  const [erreur, setErreur] = useState('');
  const [reponses, setReponses] = useState({});
  const [reponseEnCours, setReponseEnCours] = useState(null);

  const repondreCommentaire = async (commentaireId) => {
    try {
      const contenu = reponses[commentaireId];
      if (!contenu || contenu.trim() === '') {
        setErreur('Le contenu de la réponse ne peut pas être vide.');
        return;
      }

      const response = await api.post('/commentaires/creer', {
        articleId: id,
        contenu,
        parentId: commentaireId,
      });

      const nouveauRep = response.data.commentaire || response.data;
      
      // Mise à jour plus propre de l'état
      setCommentaires(prevCommentaires => [...prevCommentaires, nouveauRep]);
      setReponses(prevReponses => ({ ...prevReponses, [commentaireId]: '' }));
      setReponseEnCours(null);
      setErreur('');
    } catch (error) {
      console.error('Erreur réponse:', error);
      setErreur(error.response?.data?.erreur || 'Erreur lors de la réponse.');
    }
  };

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await api.get(`/articles/${id}`);
        const articleData = response.data.article || response.data;
        setArticle(articleData);
      } catch (error) {
        console.error('Erreur article:', error);
        setErreur('Article non trouvé.');
      }
    };

    const fetchCommentaires = async () => {
      try {
        const response = await api.get(`/commentaires/${id}`);
        const commentairesData = response.data.commentaires || response.data;
        setCommentaires(Array.isArray(commentairesData) ? commentairesData : []);
      } catch (error) {
        console.error('Erreur commentaires:', error);
        setCommentaires([]);
        setErreur('Impossible de charger les commentaires.');
      }
    };

    fetchArticle();
    fetchCommentaires();
  }, [id]);

  const ajouterCommentaire = async (e) => {
    e.preventDefault();
    if (!nouveauCommentaire.trim()) {
      setErreur('Le commentaire ne peut pas être vide.');
      return;
    }
    try {
      const response = await api.post('/commentaires/creer', {
        articleId: id,
        contenu: nouveauCommentaire,
      });
      const nouveauCommentaireData = response.data.commentaire || response.data;
      setCommentaires(prevCommentaires => [...prevCommentaires, nouveauCommentaireData]);
      setNouveauCommentaire('');
      setErreur('');
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
      setErreur(error.response?.data?.erreur || 'Erreur lors de l\'ajout du commentaire.');
    }
  };

  if (erreur && !article) {
    return (
      <div className="w-full min-h-screen px-4 py-8">
        <p className="text-center text-red-600 font-bold">{erreur}</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="w-full min-h-screen px-4 py-8">
        <p className="text-center text-gray-600 font-semibold">Chargement...</p>
      </div>
    );
  }

  // Organiser les commentaires par hiérarchie
  const commentairesRacines = commentaires.filter((c) => !c.parentId);
  const reponsesPourCommentaire = (commentId) => 
    commentaires.filter((rep) => rep.parentId === commentId);

  // Fonction pour trouver le commentaire parent et récupérer le pseudo de l'auteur
  const getCommentaireParent = (parentId) => {
    return commentaires.find(c => c.id === parentId);
  };

  return (
    <div className="w-full min-h-screen px-4 py-8">
      <Header />

      <main className="w-3/4 mx-auto bg-white p-8 rounded-lg shadow-lg mt-18">

        <nav className="text-sm text-gray-600 mb-2 ">
          <Link to="/" className="hover:text-orange-600">Accueil</Link>
          <span className="mx-2">&gt;</span>
          <Link to="/articles" className="hover:text-orange-600">Articles</Link>
        </nav>
        
        <article className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {article.titre || 'Titre non disponible'}
          </h1>

          {article.medias && article.medias.length > 0 && (
            <section className="my-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {article.medias.map((media, index) => (
                <div key={media.id || `media-${index}`} className="rounded overflow-hidden shadow-lg">
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={media.description || article.titre}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  ) : media.type === 'video' ? (
                    <video controls className="w-full rounded">
                      <source src={media.url} type="video/mp4" />
                      Votre navigateur ne supporte pas la lecture vidéo.
                    </video>
                  ) : (
                    <p>Type média non pris en charge</p>
                  )}
                  {media.description && (
                    <p className="text-center text-sm text-gray-600 mt-1">{media.description}</p>
                  )}
                </div>
              ))}
            </section>
          )}

          <div className="text-sm text-gray-500 italic">
            <span>Par {article.auteurPseudo}</span> ·{' '}
            <span>
              Le{' '}
              {article.dateCreation
                ? new Date(article.dateCreation).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : 'Date non disponible'}
            </span>
            {article.dateModification && article.dateModification !== article.dateCreation && (
              <span className="block text-xs mt-1">
                (Modifié le{' '}
                {new Date(article.dateModification).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
                )
              </span>
            )}
          </div>

          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-2xl">
            {article.contenu ? (
              article.contenu.split('\n').map((paragraphe, index) => <p key={`paragraph-${index}`}>{paragraphe}</p>)
            ) : (
              <p className="text-gray-500 italic">Contenu non disponible</p>
            )}
          </div>

          {utilisateur && utilisateur.id === article.auteur_id && (
            <div className="mt-4">
              <Link
                to={`/articles/${article.id}/modifier`}
                className="inline-block px-4 py-2 text-orange-500 border border-orange-500 rounded-lg font-semibold hover:bg-orange-500 hover:text-white transition duration-300"
              >
                Modifier
              </Link>
            </div>
          )}
        </article>

        {commentairesRacines.length > 0 && (
          <section className="mt-10 space-y-6">
            <h2 className="text-xl font-bold text-orange-600">Commentaires</h2>

            {commentairesRacines.map((comment, commentIndex) => (
              <div key={comment.id || `comment-${commentIndex}`} className="space-y-3">
                
                {/* Commentaire parent */}
                <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <p className="text-gray-800">{comment.contenu || 'Commentaire vide'}</p>
                  <div className="text-xs text-gray-500 mt-2 italic">
                    Par {comment.auteurPseudo} ·{' '}
                    {comment.dateCreation
                      ? new Date(comment.dateCreation).toLocaleDateString('fr-FR')
                      : 'Date non disponible'}
                  </div>

                  {utilisateur && (
                    <button
                      onClick={() =>
                        setReponseEnCours(reponseEnCours === comment.id ? null : comment.id)
                      }
                      className="text-sm text-orange-600 mt-3 hover:underline"
                    >
                      {reponseEnCours === comment.id ? 'Annuler' : 'Répondre'}
                    </button>
                  )}

                  {reponseEnCours === comment.id && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        repondreCommentaire(comment.id);
                      }}
                      className="mt-2 space-y-2"
                    >
                      <textarea
                        value={reponses[comment.id] || ''}
                        onChange={(e) => setReponses({ ...reponses, [comment.id]: e.target.value })}
                        className="w-full p-2 border rounded"
                        placeholder={`Répondre à @${comment.auteurPseudo}...`}
                        required
                      />
                      <button
                        type="submit"
                        className="text-sm bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
                      >
                        Envoyer
                      </button>
                    </form>
                  )}
                </div>

                {(() => {
                  const reponsesCommentaire = reponsesPourCommentaire(comment.id);
                  return reponsesCommentaire.length > 0 && (
                    <div className="ml-8 space-y-3">
                      {reponsesCommentaire.map((rep, repIndex) => {
                        const commentaireParent = getCommentaireParent(rep.parentId);
                        return (
                          <div
                            key={rep.id || `reply-${comment.id || commentIndex}-${repIndex}`}
                            className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-300 relative"
                          >
                            {/* Ligne de connexion visuelle */}
                            <div className="absolute -left-8 top-0 w-6 h-6 border-l-2 border-b-2 border-gray-300 rounded-bl-lg"></div>
                            
                            <p className="text-gray-700">
                              {commentaireParent && (
                                <span className="text-orange-600 font-medium">
                                  @{commentaireParent.auteurPseudo}
                                </span>
                              )}{' '}
                              {rep.contenu}
                            </p>
                            <div className="text-xs text-gray-500 italic mt-2">
                              Par {rep.auteurPseudo} ·{' '}
                              {rep.dateCreation
                                ? new Date(rep.dateCreation).toLocaleDateString('fr-FR')
                                : 'Date non disponible'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ))}
          </section>
        )}

        {/* Formulaire ajout commentaire principal */}
        {utilisateur && (
          <form onSubmit={ajouterCommentaire} className="mt-8 space-y-4">
            <textarea
              name="contenu"
              value={nouveauCommentaire}
              onChange={(e) => setNouveauCommentaire(e.target.value)}
              required
              className="w-full p-4 border border-orange-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
              placeholder="Votre commentaire..."
            />
            <div>
              <button
                type="submit"
                className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
              >
                Commenter
              </button>
            </div>
          </form>
        )}

        {erreur && (
          <p className="mt-4 text-center text-red-600 font-semibold">{erreur}</p>
        )}
      </main>
    </div>
  );
}

export default ArticleDetail;