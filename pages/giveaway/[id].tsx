import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { FaGift, FaTrophy, FaTimes, FaCheck } from 'react-icons/fa';
import Layout from '../../components/Layout';

// Interface pour les giveaways
interface Giveaway {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  status: string;
  product?: {
    id: string;
    name: string;
    imageUrl?: string;
    pointsCost: number;
  };
  customPrize?: string;
  _count?: {
    entries: number;
  };
  hasEntered?: boolean;
}

export default function GiveawayPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [participating, setParticipating] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Vérifier l'authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Récupérer les données du giveaway
  useEffect(() => {
    const fetchGiveaway = async () => {
      if (!id || !session) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/api/giveaway/${id}`);
        setGiveaway(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération du giveaway:', error);
        setMessage({ type: 'error', content: 'Ce giveaway n\'existe pas ou a été supprimé.' });
        setLoading(false);
      }
    };

    fetchGiveaway();
  }, [id, session]);

  // Calculer le temps restant
  useEffect(() => {
    if (!giveaway) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(giveaway.endDate).getTime();
      const distance = endTime - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [giveaway]);

  // Gérer la participation
  const handleParticipate = async () => {
    if (!session || !giveaway) return;

    try {
      setParticipating(true);
      await axios.post(`/api/giveaway/${id}/participate`);
      setMessage({ type: 'success', content: 'Vous participez maintenant à ce giveaway!' });
      
      // Mettre à jour l'état local
      setGiveaway({
        ...giveaway,
        hasEntered: true,
        _count: {
          entries: (giveaway._count?.entries || 0) + 1
        }
      });
    } catch (error: any) {
      console.error('Erreur lors de la participation:', error);
      setMessage({ 
        type: 'error', 
        content: error.response?.data?.error || 'Une erreur est survenue lors de votre participation.'
      });
    } finally {
      setParticipating(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  if (!giveaway) {
    return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <FaTimes className="text-5xl text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Giveaway non trouvé</h1>
          <p className="text-gray-600 mb-6">
            Ce giveaway n'existe pas ou a été supprimé.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition duration-300"
          >
            Retour à l'accueil
          </button>
        </div>
      </>
    );
  }

  // Vérifier si le giveaway est terminé
  const isEnded = new Date(giveaway.endDate) < new Date();

  return (
    <Layout>
      <Head>
        <title>{giveaway.title} - Giveaway</title>
        <meta name="description" content={giveaway.description} />
      </Head>

      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
        >
          {/* En-tête avec image */}
          <div className="relative">
            {giveaway.imageUrl ? (
              <div className="h-64 overflow-hidden">
                <img
                  src={giveaway.imageUrl}
                  alt={giveaway.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-64 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <FaGift className="text-7xl text-white" />
              </div>
            )}
            
            {/* Badge du nombre de participants */}
            <div className="absolute top-4 right-4 bg-blue-600 text-white font-semibold px-4 py-2 rounded-full">
              {giveaway._count?.entries || 0} participants
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 md:p-8">
            {/* Message de notification */}
            {message.content && (
              <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.type === 'success' ? <FaCheck className="inline mr-2" /> : <FaTimes className="inline mr-2" />}
                {message.content}
              </div>
            )}

            <h1 className="text-3xl font-bold text-gray-800 mb-4">{giveaway.title}</h1>
            
            <div className="mb-6">
              {isEnded ? (
                <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4">
                  Ce giveaway est terminé.
                </div>
              ) : (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Temps restant:</h3>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white p-2 rounded shadow">
                      <div className="text-2xl font-bold text-blue-600">{timeLeft.days}</div>
                      <div className="text-xs text-gray-500">Jours</div>
                    </div>
                    <div className="bg-white p-2 rounded shadow">
                      <div className="text-2xl font-bold text-blue-600">{timeLeft.hours}</div>
                      <div className="text-xs text-gray-500">Heures</div>
                    </div>
                    <div className="bg-white p-2 rounded shadow">
                      <div className="text-2xl font-bold text-blue-600">{timeLeft.minutes}</div>
                      <div className="text-xs text-gray-500">Minutes</div>
                    </div>
                    <div className="bg-white p-2 rounded shadow">
                      <div className="text-2xl font-bold text-blue-600">{timeLeft.seconds}</div>
                      <div className="text-xs text-gray-500">Secondes</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="prose max-w-none mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{giveaway.description}</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaTrophy className="text-yellow-500 mr-2" /> 
                Prix à gagner
              </h2>
              
              {giveaway.product ? (
                <div className="flex items-center">
                  {giveaway.product.imageUrl && (
                    <div className="mr-4">
                      <img 
                        src={giveaway.product.imageUrl} 
                        alt={giveaway.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{giveaway.product.name}</h3>
                    <p className="text-gray-600">Valeur: {giveaway.product.pointsCost} points</p>
                  </div>
                </div>
              ) : giveaway.customPrize ? (
                <div className="text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                  {giveaway.customPrize}
                </div>
              ) : (
                <p className="text-gray-500">Le prix sera dévoilé ultérieurement.</p>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Dates importantes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Début du giveaway:</p>
                  <p className="font-medium">{new Date(giveaway.startDate).toLocaleDateString('fr-FR', { 
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fin du giveaway:</p>
                  <p className="font-medium">{new Date(giveaway.endDate).toLocaleDateString('fr-FR', { 
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}</p>
                </div>
              </div>
            </div>

            {/* Bouton de participation */}
            <div className="flex justify-center">
              {isEnded ? (
                <button
                  disabled
                  className="bg-gray-400 text-white px-8 py-3 rounded-lg text-lg font-semibold cursor-not-allowed"
                >
                  Giveaway terminé
                </button>
              ) : giveaway.hasEntered ? (
                <button
                  disabled
                  className="bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-semibold flex items-center"
                >
                  <FaCheck className="mr-2" /> Vous participez
                </button>
              ) : (
                <motion.button
                  onClick={handleParticipate}
                  disabled={participating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {participating ? (
                    <>
                      <div className="mr-2 h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                      En cours...
                    </>
                  ) : (
                    <>
                      <FaGift className="mr-2" /> Participer au giveaway
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
} 