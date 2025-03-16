import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider, useSession, signIn } from 'next-auth/react';
import Layout from '../components/Layout';
import axios from 'axios';
import { useEffect, useState } from 'react';

// Configuration globale d'axios
axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.NEXT_PUBLIC_URL || window.location.origin;

// Initialiser axios avec des valeurs par défaut pour les headers
axios.interceptors.request.use(function (config) {
  // Ajouter des en-têtes pour toutes les requêtes
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  
  // Ajouter l'origine actuelle pour aider avec CORS
  config.headers['Origin'] = window.location.origin;
  
  // S'assurer que withCredentials est toujours activé
  config.withCredentials = true;
  
  console.log(`Axios: Requête ${config.method?.toUpperCase()} vers ${config.url}`, { withCredentials: config.withCredentials });
  
  return config;
});

// Ajouter un intercepteur pour gérer automatiquement les erreurs d'authentification
axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Log plus détaillé des erreurs d'authentification
    if (error.response && error.response.status === 401) {
      console.error('Erreur 401 Unauthorized:', { 
        url: error.config.url,
        method: error.config.method,
        withCredentials: error.config.withCredentials,
        headers: error.config.headers
      });
      
      // Tentative de reconnexion automatique
      if (error.config.url !== '/api/auth/session' && error.config.url !== '/api/auth/signin') {
        console.log('Tentative de réauthentification automatique...');
        signIn(); // Rediriger vers la page de connexion
      }
    }
    return Promise.reject(error);
  }
);

// Composant de débogage de session
function SessionDebugger() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    console.log('État de la session NextAuth:', { status, session });
    if (status === 'authenticated') {
      console.log('Utilisateur authentifié:', session?.user);
    }
    
    // Vérifier l'état des cookies disponibles
    console.log('Cookies disponibles:', document.cookie);
  }, [session, status]);
  
  return null; // Ce composant ne rend rien visuellement
}

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
    <SessionProvider 
      session={session}
      refetchInterval={5 * 60} // Actualiser la session toutes les 5 minutes
      refetchOnWindowFocus={true} // Actualiser quand l'utilisateur revient sur la page
    >
      <SessionDebugger />
      <DiscordConnectionChecker>
        {isAuthPage ? (
          <Component {...pageProps} />
        ) : (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        )}
      </DiscordConnectionChecker>
    </SessionProvider>
  );
}
