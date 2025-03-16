import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaTrophy, FaMedal, FaCrown, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';

interface User {
  id: string;
  username: string;
  minecraftName: string | null;
  points: number;
}

const Leaderboard: React.FC = () => {
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/leaderboard');
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération du classement');
        }

        const data = await response.json();
        setTopUsers(data.users);
        setLastUpdated(new Date(data.timestamp).toLocaleString('fr-FR'));
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Rafraîchir les données toutes les 5 minutes
    const intervalId = setInterval(fetchLeaderboard, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <FaCrown className="text-yellow-400 text-3xl" title="1ère place" />;
      case 1:
        return <FaMedal className="text-gray-400 text-2xl" title="2ème place" />;
      case 2:
        return <FaMedal className="text-amber-700 text-2xl" title="3ème place" />;
      default:
        return <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700">{index + 1}</div>;
    }
  };

  return (
    <Layout>
      <Head>
        <title>Classement des meilleurs joueurs | Fidelity Shop</title>
        <meta name="description" content="Découvrez le top 5 des joueurs avec le plus de crédits sur notre plateforme!" />
      </Head>

      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-400">
          <FaTrophy className="inline-block mr-3 text-yellow-400" />
          Classement
        </h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto border border-gray-700"
      >
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-blue-400">Top 5 des joueurs avec le plus de crédits</h2>
          <p className="text-gray-400 text-sm mt-1">
            Dernière mise à jour: {lastUpdated || 'Chargement...'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="loader w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : topUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>Aucun joueur trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {topUsers.map((user, index) => (
              <motion.div 
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex items-center p-6 ${index === 0 ? 'bg-gray-700' : ''} hover:bg-gray-700 transition-colors`}
              >
                <div className="mr-4 flex-shrink-0">
                  {getRankIcon(index)}
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-white">{user.username}</h3>
                  {user.minecraftName && (
                    <p className="text-gray-400 text-sm">
                      Minecraft: {user.minecraftName}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-400">{user.points}</p>
                  <p className="text-gray-400 text-xs">crédits</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>Gagnez plus de crédits pour apparaître dans le classement!</p>
        <p className="mt-1">
          <Link href="/shop" className="text-blue-400 hover:text-blue-300 transition-colors">
            Accéder à la boutique
          </Link>
        </p>
      </div>
    </Layout>
  );
};

export default Leaderboard; 