import React, { ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaTrophy } from 'react-icons/fa';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === 'authenticated';

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-400">
            FidelityShop
          </Link>

          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/" className="hover:text-blue-400 transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-blue-400 transition-colors flex items-center">
                  <FaTrophy className="mr-1 text-yellow-400" />
                  Classement
                </Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li>
                    <Link href="/dashboard" className="hover:text-blue-400 transition-colors">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop" className="hover:text-blue-400 transition-colors">
                      Boutique
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleSignOut}
                      className="hover:text-blue-400 transition-colors"
                    >
                      Déconnexion
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="hover:text-blue-400 transition-colors">
                      Connexion
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="hover:text-blue-400 transition-colors">
                      Inscription
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-8">
        {children}
      </main>

      <footer className="bg-gray-800 py-6 px-6">
        <div className="container mx-auto text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} FidelityShop - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
} 