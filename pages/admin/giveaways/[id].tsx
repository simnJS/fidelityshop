import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface Giveaway {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  status: string;
  productId?: string;
  customPrize?: string;
  winnerId?: string;
  product?: {
    id: string;
    name: string;
    imageUrl?: string;
    pointsCost: number;
  };
  _count?: {
    entries: number;
  };
  winner?: {
    id: string;
    username: string;
  };
}

interface GiveawayEntry {
  id: string;
  userId: string;
  giveawayId: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

export default function GiveawayDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [entries, setEntries] = useState<GiveawayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [winner, setWinner] = useState<{id: string, username: string} | null>(null);

  // Configurer un intercepteur Axios pour ajouter les en-têtes d'authentification
  useEffect(() => {
    if (status === 'authenticated') {
      // Configurer l'intercepteur Axios
      const requestInterceptor = axios.interceptors.request.use(
        (config) => {
          // Ajouter l'en-tête d'authentification à toutes les requêtes
          config.headers = config.headers || {};
          config.headers['x-api-csrf'] = true; // Aider NextAuth à détecter une requête CSRF valide
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Nettoyer l'intercepteur lors du démontage du composant
      return () => {
        axios.interceptors.request.eject(requestInterceptor);
      };
    }
  }, [status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && id) {
      fetchGiveaway();
      fetchEntries();
    }
  }, [status, id, router]);

  useEffect(() => {
    // Si le giveaway a un gagnant, récupérer ses informations
    if (giveaway?.winnerId && entries.length > 0) {
      const winnerEntry = entries.find(entry => entry.userId === giveaway.winnerId);
      if (winnerEntry) {
        setWinner({
          id: winnerEntry.userId,
          username: winnerEntry.user.username
        });
      }
    }
  }, [giveaway, entries]);

  const fetchGiveaway = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/giveaways/${id}`);
      setGiveaway(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Erreur lors de la récupération du giveaway:', error);
      setMessage({ type: 'error', content: 'Impossible de récupérer le giveaway: ' + (error.response?.data?.error || error.message) });
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`/api/admin/giveaways/${id}/entries`);
      setEntries(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des participations:', error);
      setMessage({ type: 'error', content: 'Impossible de récupérer les participations: ' + (error.response?.data?.error || error.message) });
    }
  };

  const handlePickWinner = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/admin/giveaways/${id}/pick-winner`);
      setMessage({ type: 'success', content: `Le gagnant a été sélectionné: ${response.data.winnerUsername}` });
      fetchGiveaway();
    } catch (error: any) {
      console.error('Erreur lors de la sélection du gagnant:', error);
      setMessage({ type: 'error', content: 'Impossible de sélectionner un gagnant: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour formater les dates
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "d MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!giveaway) {
    return (
      <AdminLayout>
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Giveaway non trouvé</h1>
          <p>Le giveaway demandé n'existe pas ou a été supprimé.</p>
          <button
            onClick={() => router.push('/admin/giveaways')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retour à la liste
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Détails du Giveaway</h1>
        
        {message.content && (
          <div className={`p-4 mb-4 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.content}
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {giveaway.imageUrl && (
              <div className="md:w-1/3">
                <img src={giveaway.imageUrl} alt={giveaway.title} className="w-full h-auto rounded" />
              </div>
            )}
            
            <div className="md:w-2/3">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">{giveaway.title}</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  giveaway.status === 'active' ? 'bg-green-100 text-green-800' :
                  giveaway.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {giveaway.status === 'active' ? 'Actif' : 
                   giveaway.status === 'completed' ? 'Terminé' : 'Annulé'}
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-1">Description:</h3>
                <p className="whitespace-pre-line">{giveaway.description}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-1">Période:</h3>
                <div className="flex flex-col sm:flex-row sm:space-x-6">
                  <div className="flex items-center bg-gray-50 px-3 py-2 rounded-md mb-2 sm:mb-0">
                    <span className="text-gray-600 font-medium mr-2">Début:</span>
                    <span className="text-black">{formatDate(giveaway.startDate)}</span>
                  </div>
                  <div className="flex items-center bg-gray-50 px-3 py-2 rounded-md">
                    <span className="text-gray-600 font-medium mr-2">Fin:</span>
                    <span className="text-black">{formatDate(giveaway.endDate)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-1">Prix:</h3>
                <div className="bg-gray-50 px-3 py-2 rounded-md">
                  {giveaway.product ? (
                    <div className="flex items-center">
                      <span className="text-black font-medium">{giveaway.product.name}</span>
                      <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        {giveaway.product.pointsCost} points
                      </span>
                    </div>
                  ) : giveaway.customPrize ? (
                    <p className="text-black">{giveaway.customPrize}</p>
                  ) : (
                    <p className="text-gray-500">Aucun prix spécifié</p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-1">Participants:</h3>
                <div className="bg-gray-50 px-3 py-2 rounded-md">
                  <span className="text-black font-medium">{giveaway._count?.entries || 0}</span> participant(s)
                </div>
              </div>
              
              {giveaway.winnerId ? (
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">Gagnant:</h3>
                  <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-md flex items-center">
                    <div className="bg-yellow-100 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-bold text-black block">{giveaway.winner?.username || 'Utilisateur introuvable'}</span>
                      <span className="text-xs text-gray-500">ID: {giveaway.winnerId}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handlePickWinner}
                  disabled={loading || giveaway.status !== 'active' || !entries.length}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Sélectionner un gagnant
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Liste des participants</h2>
          
          {entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de participation</th>
                    {giveaway.winnerId && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className={entry.userId === giveaway.winnerId ? "bg-yellow-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={entry.userId === giveaway.winnerId ? "font-bold text-yellow-700" : ""}>
                          {entry.user.username}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(entry.createdAt)}</td>
                      {giveaway.winnerId && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.userId === giveaway.winnerId ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Gagnant 🏆
                            </span>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Aucun participant pour le moment.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 