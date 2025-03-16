import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

export default function GiveawaysPage() {
  const { data: session } = useSession();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGiveaways();
  }, []);

  const fetchGiveaways = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/giveaways');
      setGiveaways(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des giveaways:', error);
      setError('Impossible de charger les giveaways');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour formater les dates
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "d MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  // Calculer le temps restant
  const getTimeLeft = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const distance = end - now;

    if (distance < 0) return 'Terminé';

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}j ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Une erreur est survenue</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={fetchGiveaways}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Concours | Fidelity Shop</title>
        <meta name="description" content="Participez à nos concours et gagnez des produits exclusifs" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Nos Concours</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Participez à nos concours pour avoir une chance de gagner des produits exclusifs et d'autres lots
          </p>
        </div>

        {giveaways.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Aucun concours actif pour le moment</h2>
            <p className="text-gray-600 mb-6">
              Revenez bientôt pour découvrir nos prochains concours !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {giveaways.map((giveaway) => (
              <Link href={`/giveaway/${giveaway.id}`} key={giveaway.id}>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                  {/* Image */}
                  <div className="relative h-48">
                    {giveaway.imageUrl ? (
                      <img 
                        src={giveaway.imageUrl} 
                        alt={giveaway.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-indigo-600 text-white px-3 py-1 text-sm font-semibold">
                      {giveaway._count?.entries || 0} participants
                    </div>
                  </div>
                  
                  {/* Contenu */}
                  <div className="p-5 flex-grow flex flex-col">
                    <h2 className="text-xl font-bold mb-2 text-gray-800">{giveaway.title}</h2>
                    <p className="text-gray-600 mb-4 line-clamp-2 flex-grow">
                      {giveaway.description}
                    </p>
                    
                    {/* Prix */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">Prix</div>
                      <div className="font-medium">
                        {giveaway.product?.name || giveaway.customPrize || 'À découvrir'}
                      </div>
                    </div>
                    
                    {/* Date de fin et temps restant */}
                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-500">Se termine le:</div>
                          <div className="text-sm font-medium">{formatDate(giveaway.endDate)}</div>
                        </div>
                        <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                          {getTimeLeft(giveaway.endDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 