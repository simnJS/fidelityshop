import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Interface pour les giveaways
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

export default function GiveawayPublicPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasEntered, setHasEntered] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Récupérer le giveaway
  useEffect(() => {
    if (id) {
      fetchGiveaway();
    }
  }, [id]);

  // Effet pour vérifier si l'utilisateur a déjà participé
  useEffect(() => {
    if (giveaway && session?.user?.id) {
      checkIfUserEntered();
    }
  }, [giveaway, session]);

  // Effet pour mettre à jour le temps restant
  useEffect(() => {
    if (giveaway && giveaway.status === 'active') {
      const timer = setInterval(() => {
        const end = new Date(giveaway.endDate).getTime();
        const now = new Date().getTime();
        const distance = end - now;

        if (distance < 0) {
          clearInterval(timer);
          setTimeLeft('Terminé');
          // Rafraîchir le giveaway pour voir si un gagnant a été sélectionné
          fetchGiveaway();
        } else {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          setTimeLeft(`${days}j ${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [giveaway]);

  const fetchGiveaway = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/giveaways/${id}`);
      setGiveaway(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération du giveaway:', error);
      setError('Impossible de charger le giveaway');
    } finally {
      setLoading(false);
    }
  };

  const checkIfUserEntered = async () => {
    try {
      const response = await axios.get(`/api/giveaways/${id}/check-entry`);
      setHasEntered(response.data.hasEntered);
    } catch (error) {
      console.error('Erreur lors de la vérification de la participation:', error);
    }
  };

  const handleEnterGiveaway = async () => {
    if (!session) {
      router.push(`/login?redirect=/giveaway/${id}`);
      return;
    }

    try {
      setIsEntering(true);
      await axios.post(`/api/giveaways/${id}/enter`);
      setHasEntered(true);
      fetchGiveaway(); // Rafraîchir pour mettre à jour le nombre de participants
    } catch (error: any) {
      console.error('Erreur lors de la participation au giveaway:', error);
      alert(`Erreur: ${error.response?.data?.error || 'Une erreur est survenue'}`);
    } finally {
      setIsEntering(false);
    }
  };

  // Fonction pour formater les dates
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "d MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !giveaway) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Giveaway non trouvé</h1>
          <p className="text-red-600 mb-6">Le giveaway demandé n'existe pas ou a été supprimé.</p>
          <Link href="/giveaways" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
            Voir tous les giveaways
          </Link>
        </div>
      </div>
    );
  }

  const isActive = giveaway.status === 'active';
  const isCompleted = giveaway.status === 'completed';
  const isCancelled = giveaway.status === 'cancelled';

  return (
    <>
      <Head>
        <title>{giveaway.title} | Concours</title>
        <meta name="description" content={giveaway.description.substring(0, 160)} />
        {giveaway.imageUrl && <meta property="og:image" content={giveaway.imageUrl} />}
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* En-tête du giveaway */}
        <div className="relative mb-8">
          {/* Bannière d'état */}
          <div className={`absolute top-0 right-0 py-2 px-4 rounded-bl-lg z-10 text-sm font-bold ${
            isActive ? 'bg-green-500 text-white' : 
            isCompleted ? 'bg-blue-500 text-white' : 
            'bg-gray-500 text-white'
          }`}>
            {isActive ? 'En cours' : isCompleted ? 'Terminé' : 'Annulé'}
          </div>
          
          {/* Image principale avec overlay pour les giveaways terminés */}
          <div className="relative rounded-lg overflow-hidden shadow-lg">
            {giveaway.imageUrl ? (
              <img 
                src={giveaway.imageUrl} 
                alt={giveaway.title} 
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            )}
            
            {/* Overlay pour les giveaways terminés avec le gagnant */}
            {isCompleted && giveaway.winnerId && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white">
                <div className="text-center bg-black bg-opacity-70 p-6 rounded-lg">
                  <div className="mb-2 text-yellow-300 text-lg font-bold uppercase">Gagnant</div>
                  <div className="text-3xl font-bold mb-2">{giveaway.winner?.username}</div>
                  <div className="animate-pulse flex space-x-1 text-yellow-300 text-xl">
                    <span>🏆</span><span>🏆</span><span>🏆</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Overlay pour les giveaways annulés */}
            {isCancelled && (
              <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="text-white text-2xl font-bold">Concours Annulé</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Infos principales */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-4 text-white">{giveaway.title}</h1>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-white">Description</h2>
              <div className="bg-white p-4 rounded-lg shadow whitespace-pre-line">
                <div className="text-gray-800">{giveaway.description}</div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-white">Prix</h2>
              <div className="bg-white p-4 rounded-lg shadow">
                {giveaway.product ? (
                  <div className="flex items-center">
                    {giveaway.product.imageUrl && (
                      <img 
                        src={giveaway.product.imageUrl} 
                        alt={giveaway.product.name} 
                        className="w-16 h-16 object-cover rounded-md mr-4"
                      />
                    )}
                    <div>
                      <div className="font-medium text-lg">{giveaway.product.name}</div>
                      <div className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-sm font-medium mt-1">
                        {giveaway.product.pointsCost} points
                      </div>
                    </div>
                  </div>
                ) : giveaway.customPrize ? (
                  <div className="text-lg">{giveaway.customPrize}</div>
                ) : (
                  <div className="text-gray-500">Aucun prix spécifié</div>
                )}
              </div>
            </div>
            
            {/* Affichage du gagnant (pour les appareils mobiles) */}
            {isCompleted && giveaway.winnerId && (
              <div className="mb-6 lg:hidden">
                <h2 className="text-xl font-semibold mb-2 text-white">Gagnant</h2>
                <div className="bg-yellow-50 border-2 border-yellow-200 p-5 rounded-lg flex flex-col items-center">
                  <div className="text-yellow-800 text-lg uppercase font-bold mb-1">Félicitations</div>
                  <div className="text-2xl font-bold mb-2">{giveaway.winner?.username}</div>
                  <div className="text-yellow-600">
                    <span className="text-2xl">🏆</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar - Infos complémentaires */}
          <div>
            {/* Carte d'action */}
            <div className="bg-white rounded-lg shadow p-6 mb-4">
              {/* Compteur pour les giveaways actifs */}
              {isActive && (
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-500 mb-1">Temps restant</div>
                  <div className="bg-indigo-100 text-indigo-800 text-xl font-bold p-3 rounded-md text-center">
                    {timeLeft}
                  </div>
                </div>
              )}
              
              {/* Stats du concours */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-500 mb-1">Participants</div>
                <div className="text-2xl font-bold text-gray-800">{giveaway._count?.entries || 0}</div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-500 mb-1">Dates</div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 font-medium w-16">Début:</span> 
                    <span className="text-gray-800">{formatDate(giveaway.startDate)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 font-medium w-16">Fin:</span> 
                    <span className="text-gray-800">{formatDate(giveaway.endDate)}</span>
                  </div>
                </div>
              </div>
              
              {/* Bouton de participation */}
              {isActive && !hasEntered && !giveaway.winnerId && (
                <button 
                  onClick={handleEnterGiveaway}
                  disabled={isEntering || !session}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md shadow-md transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isEntering ? 'Inscription...' : 'Participer au concours'}
                </button>
              )}
              
              {/* Message si déjà participé */}
              {isActive && hasEntered && (
                <div className="bg-green-50 text-green-800 p-3 rounded-md border border-green-200 text-center mb-4">
                  Vous participez à ce concours 🎉
                </div>
              )}
              
              {/* Affichage du gagnant (pour les grands écrans) */}
              {isCompleted && giveaway.winnerId && (
                <div className="hidden lg:block mt-6">
                  <div className="text-sm font-medium text-gray-500 mb-1">Gagnant</div>
                  <div className="bg-yellow-50 border-2 border-yellow-200 p-5 rounded-lg flex flex-col items-center">
                    <div className="text-yellow-800 text-lg uppercase font-bold mb-1">Félicitations</div>
                    <div className="text-2xl font-bold mb-2">{giveaway.winner?.username}</div>
                    <div className="text-yellow-600">
                      <span className="text-2xl">🏆</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Bouton pour les non connectés */}
              {isActive && !session && (
                <div className="mt-2 text-center">
                  <Link href={`/login?redirect=/giveaway/${id}`} className="text-indigo-600 hover:text-indigo-800">
                    Connectez-vous pour participer
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 