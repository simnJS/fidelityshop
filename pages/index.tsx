import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FaHome, FaGamepad, FaCamera, FaGift, FaUsers, FaShoppingCart, FaAward, FaExchangeAlt, FaUserPlus, FaSignInAlt, FaTachometerAlt, FaTrophy } from "react-icons/fa";
import axios from "axios";

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
}

export default function Home() {
  const { data: session } = useSession();
  const [activeGiveaways, setActiveGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);

  // Récupérer les giveaways actifs
  useEffect(() => {
    const fetchActiveGiveaways = async () => {
      try {
        const response = await axios.get('/api/giveaways');
        setActiveGiveaways(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des giveaways:', error);
        setLoading(false);
      }
    };

    fetchActiveGiveaways();
  }, []);

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

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0px 0px 8px rgb(59, 130, 246, 0.5)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { scale: 0.95 }
  };

  return (
    <>
      <Head>
        <title>SimnShop | Système de Points de Fidélité Minecraft</title>
        <meta name="description" content="Gagnez des points en effectuant des achats et échangez-les contre des récompenses exclusives sur notre serveur Minecraft !" />
      </Head>

      <div className="flex flex-col items-center">
        {/* Hero Section */}
        <motion.div 
          className="relative w-full py-16 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Effet de gradient en arrière-plan */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/10 z-0"></div>
          
          {/* Effet de particules ou de lumière (simulé avec des pseudo-éléments via un conteneur) */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="glow-1"></div>
            <div className="glow-2"></div>
          </div>

          <div className="max-w-4xl w-full mx-auto text-center relative z-10 px-4">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                Système de Points de Fidélité pour le /is warp simnJS
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-xl mb-8 text-gray-300"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Gagnez des points en effectuant des achats et échangez-les contre des récompenses exclusives !
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {!session ? (
                <>
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Link 
                      href="/register" 
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <FaUserPlus /> S'inscrire
                    </Link>
                  </motion.div>
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Link 
                      href="/login" 
                      className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 border border-gray-700 shadow-md"
                    >
                      <FaSignInAlt /> Se connecter
                    </Link>
                  </motion.div>
                </>
              ) : (
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Link 
                    href="/dashboard" 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <FaTachometerAlt /> Accéder à mon tableau de bord
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div 
          className="w-full py-16 px-4 bg-gray-900"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-5xl mx-auto">
            <motion.h2 
              className="text-2xl md:text-3xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600"
              variants={itemVariants}
            >
              Nos fonctionnalités
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div variants={itemVariants}>
                <FeatureCard 
                  icon={<FaGamepad className="text-blue-500" />}
                  title="Connectez votre compte Minecraft"
                  description="Liez votre nom d'utilisateur Minecraft à votre profil pour recevoir vos récompenses."
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <FeatureCard 
                  icon={<FaCamera className="text-blue-500" />}
                  title="Envoyez vos preuves d'achat"
                  description="Téléchargez simplement une capture d'écran de votre achat pour recevoir des points."
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <FeatureCard 
                  icon={<FaGift className="text-blue-500" />}
                  title="Échangez vos points"
                  description="Utilisez vos points pour obtenir des avantages exclusifs sur notre serveur."
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* How it works Section */}
        <div className="w-full bg-gray-800 py-16 px-4 relative overflow-hidden">
          {/* Effet de gradient en arrière-plan */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-transparent"></div>
          
          <motion.div 
            className="max-w-4xl mx-auto relative z-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2 
              className="text-3xl font-bold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600"
              variants={itemVariants}
            >
              Comment ça marche ?
            </motion.h2>
            
            <div className="flex flex-col gap-8">
              <motion.div variants={itemVariants}>
                <Step 
                  number="1" 
                  icon={<FaUserPlus />}
                  title="Créez votre compte" 
                  description="Inscrivez-vous en quelques secondes et associez votre nom Minecraft."
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Step 
                  number="2" 
                  icon={<FaShoppingCart />}
                  title="Effectuez des ventes" 
                  description="Réalisez des ventes sur notre IS."
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Step 
                  number="3" 
                  icon={<FaCamera />}
                  title="Envoyez vos preuves de vente" 
                  description="Téléchargez une capture d'écran de votre vente sur votre tableau de bord."
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Step 
                  number="4" 
                  icon={<FaAward />}
                  title="Recevez vos points" 
                  description="Notre équipe validera votre vente et créditera vos points rapidement."
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Step 
                  number="5" 
                  icon={<FaExchangeAlt />}
                  title="Échangez vos récompenses" 
                  description="Utilisez vos points dans notre boutique pour obtenir des avantages exclusifs."
                />
              </motion.div>
            </div>
            
            <motion.div 
              className="mt-12 text-center"
              variants={itemVariants}
            >
              <Link href="/leaderboard" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors">
                <FaUsers className="text-lg" />
                <span>Consultez notre classement des meilleurs joueurs</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Section Giveaways */}
        <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <FaTrophy className="inline-block mr-2 text-yellow-500" />
                Giveaways en cours
              </motion.h2>
              <motion.p 
                className="text-gray-600 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Participez à nos tirages au sort pour tenter de gagner des récompenses exclusives.
                {!session && " Connectez-vous pour participer !"}
              </motion.p>
            </div>

            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : activeGiveaways.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow-md">
                <FaGift className="mx-auto text-5xl text-gray-300 mb-4" />
                <p className="text-gray-500">Aucun giveaway en cours pour le moment.</p>
                <p className="text-gray-500">Revenez bientôt pour de nouvelles opportunités de gagner !</p>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {activeGiveaways.map((giveaway) => (
                  <motion.div 
                    key={giveaway.id}
                    variants={itemVariants}
                    className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    {giveaway.imageUrl ? (
                      <div className="h-48 overflow-hidden relative">
                        <img 
                          src={giveaway.imageUrl} 
                          alt={giveaway.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg">
                          {giveaway._count?.entries || 0} participants
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white">
                        <FaGift className="text-6xl" />
                        <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg">
                          {giveaway._count?.entries || 0} participants
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{giveaway.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{giveaway.description}</p>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Début:</span> {new Date(giveaway.startDate).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Fin:</span> {new Date(giveaway.endDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      
                      <div className="bg-gray-100 p-3 rounded-lg mb-4">
                        <p className="text-sm font-semibold text-gray-700">Prix à gagner:</p>
                        {giveaway.product ? (
                          <div className="flex items-center mt-1">
                            {giveaway.product.imageUrl && (
                              <img 
                                src={giveaway.product.imageUrl} 
                                alt={giveaway.product.name}
                                className="w-10 h-10 object-cover rounded mr-2"
                              />
                            )}
                            <div>
                              <p className="font-medium">{giveaway.product.name}</p>
                              <p className="text-xs text-gray-500">Valeur: {giveaway.product.pointsCost} points</p>
                            </div>
                          </div>
                        ) : giveaway.customPrize ? (
                          <p className="mt-1">{giveaway.customPrize}</p>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">Surprise!</p>
                        )}
                      </div>
                      
                      <motion.div 
                        className="mt-4"
                        whileHover="hover"
                        whileTap="tap"
                        variants={buttonVariants}
                      >
                        {session ? (
                          <Link href={`/giveaway/${giveaway.id}`} className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                            Participer
                          </Link>
                        ) : (
                          <Link href="/login" className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                            Connectez-vous pour participer
                          </Link>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div 
      className="bg-gray-800 p-6 rounded-lg shadow-lg text-center border border-gray-700 relative overflow-hidden group hover:shadow-blue-800/20 transition-all duration-300"
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(30, 64, 175, 0.3)" }}
    >
      {/* Effet de surlignage sur hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="text-4xl mb-4 flex justify-center">{icon}</div>
        <h3 className="text-xl font-semibold mb-2 text-blue-400">{title}</h3>
        <p className="text-gray-300">{description}</p>
      </div>
    </motion.div>
  );
}

interface StepProps {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function Step({ number, icon, title, description }: StepProps) {
  return (
    <div className="flex items-start">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
        {icon}
      </div>
      <div className="ml-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <span className="text-blue-400">#{number}</span> {title}
        </h3>
        <p className="text-gray-300">{description}</p>
      </div>
    </div>
  );
}
