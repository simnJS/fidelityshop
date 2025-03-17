import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from 'next-auth/react';
import Layout from '../components/Layout';
import axios from 'axios';
import { useEffect, useState } from 'react';
import CookieConsent from '../components/CookieConsent';

// Configuration globale d'axios
axios.defaults.withCredentials = true;

// Composant pour vérifier la connexion Discord
function DiscordConnectionChecker({ children }: { children: React.ReactNode }) {
  const [isDiscordConnected, setIsDiscordConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkDiscordConnection = async () => {
      try {
        setIsChecking(true);
        const response = await axios.get('/api/discord/status');
        setIsDiscordConnected(response.data.connected);
        
        if (!response.data.connected && retryCount < 5) {
          // Si Discord n'est pas connecté, réessayer après un délai
          setTimeout(() => {
            setRetryCount(retryCount + 1);
          }, 3000);
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la connexion Discord', error);
        setIsDiscordConnected(false);
        
        if (retryCount < 5) {
          // En cas d'erreur, réessayer après un délai
          setTimeout(() => {
            setRetryCount(retryCount + 1);
          }, 3000);
        } else {
          setIsChecking(false);
        }
      }
    };

    checkDiscordConnection();
  }, [retryCount]);

  if (isChecking && (isDiscordConnected === null || isDiscordConnected === false)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 z-50">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-blue-400 mb-4">Connexion au serveur Discord...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 mb-2">
            Veuillez patienter pendant que nous établissons la connexion avec Discord.
          </p>
          <p className="text-gray-400 text-sm">
            Tentative {retryCount + 1}{retryCount >= 4 ? " (Dernière tentative)" : ""}
          </p>
          {retryCount >= 5 && (
            <div className="mt-4 p-4 bg-red-900 bg-opacity-50 rounded text-red-300 text-sm">
              Impossible de se connecter à Discord après plusieurs tentatives. Le site pourrait ne pas fonctionner correctement.
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App({ 
  Component, 
  pageProps: { session, ...pageProps }
}: AppProps) {
  // Déterminez si la page est une page d'authentification
  const isAuthPage = 
    Component.name === 'Login' || 
    Component.name === 'Register';

  return (
    <SessionProvider session={session}>
      <DiscordConnectionChecker>
        {isAuthPage ? (
          <>
            <Component {...pageProps} />
            <CookieConsent />
          </>
        ) : (
          <Layout>
            <Component {...pageProps} />
            <CookieConsent />
          </Layout>
        )}
      </DiscordConnectionChecker>
    </SessionProvider>
  );
}
