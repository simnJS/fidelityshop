import React, { useState } from 'react';
import axios from 'axios';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

const PrivacySettings = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [accountDeleted, setAccountDeleted] = useState(false);

  const downloadMyData = async () => {
    if (!session) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await axios.get('/api/users/me/download-data');
      
      // Créer un fichier blob à partir des données
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      
      // Créer un lien pour télécharger le fichier
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mes-donnees-personnelles.json';
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ text: 'Vos données ont été téléchargées avec succès', type: 'success' });
    } catch (error) {
      console.error('Erreur lors du téléchargement des données:', error);
      setMessage({ text: 'Une erreur est survenue lors du téléchargement de vos données', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const requestDeletion = () => {
    setShowConfirmation(true);
  };

  const confirmDeletion = async () => {
    if (!session || confirmText !== 'SUPPRIMER') return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await axios.post('/api/users/me/request-deletion');
      
      if (response.data.shouldLogout) {
        setAccountDeleted(true);
        setMessage({ 
          text: 'Votre compte a été supprimé avec succès. Vous allez être déconnecté dans 5 secondes...', 
          type: 'success' 
        });
        
        // Déconnecter l'utilisateur après 5 secondes
        setTimeout(() => {
          signOut({ callbackUrl: '/' });
        }, 5000);
      } else {
        setMessage({ 
          text: 'Votre demande de suppression a été enregistrée.', 
          type: 'success' 
        });
      }
      
      setShowConfirmation(false);
    } catch (error) {
      console.error('Erreur lors de la demande de suppression:', error);
      setMessage({ 
        text: 'Une erreur est survenue lors de la demande de suppression de votre compte', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelDeletion = () => {
    setShowConfirmation(false);
    setConfirmText('');
  };

  if (!session) {
    return (
      <div className="bg-red-800 text-white p-4 rounded-lg">
        Vous devez être connecté pour accéder à vos paramètres de confidentialité.
      </div>
    );
  }

  if (accountDeleted) {
    return (
      <div className="bg-gray-800 shadow-md rounded-lg p-6 text-white">
        <div className="p-4 mb-6 rounded-lg bg-green-800 text-white">
          <p>Votre compte a été supprimé avec succès. Vous allez être déconnecté automatiquement...</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 shadow-md rounded-lg p-6 text-white">
      <h2 className="text-2xl font-bold mb-6">Paramètres de confidentialité</h2>
      
      {message && (
        <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-800 text-white' : 'bg-red-800 text-white'}`}>
          {message.text}
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Télécharger mes données</h3>
          <p className="text-gray-300 mb-3">
            Vous pouvez télécharger toutes les données personnelles que nous détenons à votre sujet.
          </p>
          <button
            onClick={downloadMyData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
          >
            {loading ? 'Téléchargement...' : 'Télécharger mes données'}
          </button>
        </div>
        
        <div className="border-t border-gray-600 pt-6">
          <h3 className="text-lg font-semibold mb-2 text-red-400">Supprimer mon compte</h3>
          <p className="text-gray-300 mb-3">
            La suppression de votre compte entraînera la perte de toutes vos données, y compris votre historique d&apos;achats et vos points de fidélité. Cette action est irréversible.
          </p>
          
          {!showConfirmation ? (
            <button
              onClick={requestDeletion}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              Demander la suppression de mon compte
            </button>
          ) : (
            <div className="bg-red-900 p-4 rounded-lg text-white">
              <p className="font-semibold mb-3">
                Êtes-vous certain de vouloir supprimer votre compte ? Cette action est irréversible.
              </p>
              <p className="mb-4">
                Pour confirmer, veuillez saisir SUPPRIMER en majuscules dans le champ ci-dessous :
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-md mb-4 bg-gray-700 text-white"
                placeholder="SUPPRIMER"
              />
              <div className="flex space-x-3">
                <button
                  onClick={confirmDeletion}
                  disabled={confirmText !== 'SUPPRIMER' || loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
                >
                  {loading ? 'Traitement...' : 'Confirmer la suppression'}
                </button>
                <button
                  onClick={cancelDeletion}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings; 