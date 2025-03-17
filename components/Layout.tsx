import React, { ReactNode, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaUser, FaShoppingCart, FaHome, FaSignOutAlt, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === 'authenticated';
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  // Animation variants
  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 20,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    }
  };

  const mobileMenuVariants = {
    closed: { 
      opacity: 0, 
      height: 0,
      transition: { 
        duration: 0.3, 
        when: "afterChildren" 
      }
    },
    open: { 
      opacity: 1, 
      height: 'auto',
      transition: { 
        duration: 0.3, 
        when: "beforeChildren", 
        staggerChildren: 0.1 
      }
    }
  };

  const linkClass = (path: string) => {
    return router.pathname === path
      ? "flex items-center py-2 px-3 rounded-lg bg-blue-600 text-white font-medium transition-all duration-300"
      : "flex items-center py-2 px-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-all duration-300";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className={`sticky top-0 z-50 py-4 px-6 transition-all duration-300 ${scrolled ? 'bg-gray-900 shadow-lg backdrop-blur-lg bg-opacity-90' : 'bg-gray-900'}`}>
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold flex items-center group">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 group-hover:from-blue-500 group-hover:to-blue-700 transition-all duration-300">
                Simn
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 group-hover:from-amber-500 group-hover:to-amber-700 transition-all duration-300">
                Shop
              </span>
            </Link>

            {/* Menu mobile toggle */}
            <button 
              className="md:hidden flex items-center" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`w-full h-0.5 bg-white transform transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`w-full h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`w-full h-0.5 bg-white transform transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>

            {/* Menu desktop */}
            <motion.nav 
              className="hidden md:block"
              initial="hidden"
              animate="visible"
              variants={navVariants}
            >
              <ul className="flex space-x-2">
                <motion.li variants={itemVariants}>
                  <Link href="/" className={linkClass('/')}>
                    <FaHome className="mr-1" /> Accueil
                  </Link>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <Link href="/leaderboard" className={linkClass('/leaderboard')}>
                    <FaTrophy className="mr-1 text-amber-400" /> Classement
                  </Link>
                </motion.li>
                {isAuthenticated ? (
                  <>
                    <motion.li variants={itemVariants}>
                      <Link href="/dashboard" className={linkClass('/dashboard')}>
                        <FaUser className="mr-1" /> Dashboard
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants}>
                      <Link href="/shop" className={linkClass('/shop')}>
                        <FaShoppingCart className="mr-1" /> Boutique
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants}>
                      <div className="relative ml-3">
                        <div>
                          <button
                            type="button"
                            className="flex items-center max-w-xs text-sm bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                            id="user-menu-button"
                            aria-expanded={isProfileMenuOpen}
                            aria-haspopup="true"
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                          >
                            <span className="sr-only">Ouvrir le menu utilisateur</span>
                            <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
                              {session.user.name?.charAt(0) || 'U'}
                            </div>
                          </button>
                        </div>
                        {isProfileMenuOpen && (
                          <div
                            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby="user-menu-button"
                            tabIndex={-1}
                          >
                            <a
                              href="/dashboard"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                            >
                              Tableau de bord
                            </a>
                            <a
                              href="/dashboard/receipts"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                            >
                              Mes reçus
                            </a>
                            <a
                              href="/dashboard/orders"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                            >
                              Mes commandes
                            </a>
                            <a
                              href="/privacy-settings"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                            >
                              Confidentialité et données
                            </a>
                            <button
                              onClick={handleSignOut}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                            >
                              Déconnexion
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.li>
                  </>
                ) : (
                  <>
                    <motion.li variants={itemVariants}>
                      <Link href="/login" className={linkClass('/login')}>
                        <FaSignInAlt className="mr-1" /> Connexion
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants}>
                      <Link href="/register" className={linkClass('/register')}>
                        <FaUserPlus className="mr-1" /> Inscription
                      </Link>
                    </motion.li>
                  </>
                )}
              </ul>
            </motion.nav>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.nav
                className="md:hidden mt-4"
                initial="closed"
                animate="open"
                exit="closed"
                variants={mobileMenuVariants}
              >
                <ul className="flex flex-col space-y-2 bg-gray-800 rounded-lg p-3">
                  <motion.li variants={itemVariants}>
                    <Link href="/" className={linkClass('/')}>
                      <FaHome className="mr-2" /> Accueil
                    </Link>
                  </motion.li>
                  <motion.li variants={itemVariants}>
                    <Link href="/leaderboard" className={linkClass('/leaderboard')}>
                      <FaTrophy className="mr-2 text-amber-400" /> Classement
                    </Link>
                  </motion.li>
                  {isAuthenticated ? (
                    <>
                      <motion.li variants={itemVariants}>
                        <Link href="/dashboard" className={linkClass('/dashboard')}>
                          <FaUser className="mr-2" /> Dashboard
                        </Link>
                      </motion.li>
                      <motion.li variants={itemVariants}>
                        <Link href="/shop" className={linkClass('/shop')}>
                          <FaShoppingCart className="mr-2" /> Boutique
                        </Link>
                      </motion.li>
                      <motion.li variants={itemVariants}>
                        <div className="relative ml-3">
                          <div>
                            <button
                              type="button"
                              className="flex items-center max-w-xs text-sm bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                              id="user-menu-button"
                              aria-expanded={isProfileMenuOpen}
                              aria-haspopup="true"
                              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            >
                              <span className="sr-only">Ouvrir le menu utilisateur</span>
                              <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
                                {session.user.name?.charAt(0) || 'U'}
                              </div>
                            </button>
                          </div>
                          {isProfileMenuOpen && (
                            <div
                              className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                              role="menu"
                              aria-orientation="vertical"
                              aria-labelledby="user-menu-button"
                              tabIndex={-1}
                            >
                              <a
                                href="/dashboard"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                role="menuitem"
                              >
                                Tableau de bord
                              </a>
                              <a
                                href="/dashboard/receipts"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                role="menuitem"
                              >
                                Mes reçus
                              </a>
                              <a
                                href="/dashboard/orders"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                role="menuitem"
                              >
                                Mes commandes
                              </a>
                              <a
                                href="/privacy-settings"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                role="menuitem"
                              >
                                Confidentialité et données
                              </a>
                              <button
                                onClick={handleSignOut}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                role="menuitem"
                              >
                                Déconnexion
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.li>
                    </>
                  ) : (
                    <>
                      <motion.li variants={itemVariants}>
                        <Link href="/login" className={linkClass('/login')}>
                          <FaSignInAlt className="mr-2" /> Connexion
                        </Link>
                      </motion.li>
                      <motion.li variants={itemVariants}>
                        <Link href="/register" className={linkClass('/register')}>
                          <FaUserPlus className="mr-2" /> Inscription
                        </Link>
                      </motion.li>
                    </>
                  )}
                </ul>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </header>

      <motion.main 
        className="flex-grow container mx-auto px-6 py-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {children}
      </motion.main>

      <footer className="bg-gray-800 py-6 px-6 mt-auto">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-400">&copy; {new Date().getFullYear()} SimnShop - Tous droits réservés</p>
            </div>
            <div className="flex space-x-4">
              <Link href="/" className="text-gray-400 hover:text-blue-400 transition-all duration-300">Accueil</Link>
              <Link href="/shop" className="text-gray-400 hover:text-blue-400 transition-all duration-300">Boutique</Link>
              <Link href="/leaderboard" className="text-gray-400 hover:text-blue-400 transition-all duration-300">Classement</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 