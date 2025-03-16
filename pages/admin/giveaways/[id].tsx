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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && id) {
      fetchGiveaway();
      fetchEntries();
    }
  }, [status, id, router]);

  const fetchGiveaway = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/giveaways/${id}`, { withCredentials: true });
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
      const response = await axios.get(`/api/admin/giveaways/${id}/entries`, { withCredentials: true });
      setEntries(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des participations:', error);
      setMessage({ type: 'error', content: 'Impossible de récupérer les participations: ' + (error.response?.data?.error || error.message) });
    }
  };

  const handlePickWinner = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/admin/giveaways/${id}/pick-winner`, {}, { withCredentials: true });
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
              <h2 className="text-xl font-bold mb-2">{giveaway.title}</h2>
              <div className="mb-4 text-gray-500">Statut: <span className={`font-semibold ${giveaway.status === 'active' ? 'text-green-600' : giveaway.status === 'completed' ? 'text-blue-600' : 'text-red-600'}`}>{giveaway.status}</span></div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-1">Description:</h3>
                <p className="whitespace-pre-line">{giveaway.description}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-1">Période:</h3>
                <p>Du {formatDate(giveaway.startDate)} au {formatDate(giveaway.endDate)}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-1">Prix:</h3>
                {giveaway.product ? (
                  <p>Produit: {giveaway.product.name} (valeur: {giveaway.product.pointsCost} points)</p>
                ) : giveaway.customPrize ? (
                  <p>{giveaway.customPrize}</p>
                ) : (
                  <p>Aucun prix spécifié</p>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-1">Participants:</h3>
                <p>{giveaway._count?.entries || 0} participant(s)</p>
              </div>
              
              {giveaway.winnerId ? (
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">Gagnant:</h3>
                  <p>{giveaway.winnerId}</p>
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{entry.user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(entry.createdAt)}</td>
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