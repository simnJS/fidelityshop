import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaTrophy, FaMedal, FaCrown, FaChartLine, FaSpinner, FaShoppingCart } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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
        return (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
          >
            <FaCrown className="text-amber-400 text-3xl" title="1ère place" />
          </motion.div>
        );
      case 1:
        return (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.3
            }}
          >
            <FaMedal className="text-gray-300 text-2xl" title="2ème place" />
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.4
            }}
          >
            <FaMedal className="text-amber-700 text-2xl" title="3ème place" />
          </motion.div>
        );
      default:
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.5 + (index * 0.1)
            }}
            className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-300"
          >
            {index + 1}
          </motion.div>
        );
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <>
      <Head>
        <title>Classement des meilleurs joueurs | SimnShop</title>
        <meta name="description" content="Découvrez le top 5 des joueurs avec le plus de crédits sur notre plateforme!" />
      </Head>

      <section className="section">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-screen-lg mx-auto"
        >
          <motion.div 
            className="flex items-center mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <FaChartLine className="text-3xl mr-4 text-blue-500" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              Classement des joueurs
            </h1>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="card relative backdrop-blur-sm overflow-hidden border border-gray-700"
          >
            {/* Effet de brillance en arrière-plan */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-amber-600/5"></div>
            
            <div className="relative p-6 border-b border-gray-700 flex justify-between items-center flex-wrap gap-4">
              <motion.div variants={itemVariants}>
                <h2 className="text-xl font-semibold text-blue-400 flex items-center">
                  <FaTrophy className="mr-3 text-amber-400" />
                  Top 5 des joueurs avec le plus de crédits
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Dernière mise à jour: {lastUpdated || 'Chargement...'}
                </p>
              </motion.div>
              
              <motion.div 
                variants={itemVariants}
                className="bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-300 flex items-center"
              >
                Actualisé automatiquement
              </motion.div>
            </div>

            <AnimatePresence>
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="text-blue-500 text-2xl mb-3"
                  >
                    <FaSpinner />
                  </motion.div>
                  <p className="text-gray-400">Chargement du classement...</p>
                </motion.div>
              ) : error ? (
                <motion.div 
                  key="error"
                  variants={itemVariants}
                  className="p-8 text-center"
                >
                  <div className="bg-red-900/20 p-4 rounded-lg max-w-md mx-auto">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button 
                      onClick={handleRefresh} 
                      className="btn btn-primary"
                    >
                      Réessayer
                    </button>
                  </div>
                </motion.div>
              ) : topUsers.length === 0 ? (
                <motion.div 
                  key="empty"
                  variants={itemVariants} 
                  className="p-12 text-center"
                >
                  <p className="text-gray-400">Aucun joueur trouvé</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="users"
                  variants={containerVariants} 
                  className="divide-y divide-gray-700/50"
                >
                  {topUsers.map((user, index) => (
                    <motion.div 
                      key={user.id}
                      variants={itemVariants}
                      whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.5)" }}
                      className={`flex items-center p-6 ${index === 0 ? 'bg-amber-500/10' : ''} relative overflow-hidden`}
                    >
                      {/* Éclat pour le premier classé */}
                      {index === 0 && (
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-amber-600/0 via-amber-400/10 to-amber-600/0 animate-shimmer pointer-events-none"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                      
                      <div className="mr-6 flex-shrink-0 relative">
                        {getRankIcon(index)}
                        {index === 0 && (
                          <motion.div 
                            className="absolute -inset-1 rounded-full bg-amber-500/20 -z-10"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </div>
                      
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          {user.username}
                          {index === 0 && (
                            <motion.span 
                              className="ml-2 text-amber-400 text-sm bg-amber-900/30 px-2 py-0.5 rounded-full"
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              #1
                            </motion.span>
                          )}
                        </h3>
                        {user.minecraftName && (
                          <p className="text-gray-400 text-sm">
                            Minecraft: {user.minecraftName}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 + (index * 0.1) }}
                        >
                          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                            {user.points}
                          </span>
                          <p className="text-gray-400 text-xs">crédits</p>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-400 mb-2">Gagnez plus de crédits pour apparaître dans le classement!</p>
            <Link 
              href="/shop" 
              className="btn btn-primary inline-flex items-center"
            >
              <FaShoppingCart className="mr-2" />
              Accéder à la boutique
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </>
  );
};

export default Leaderboard; 