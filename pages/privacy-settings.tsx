import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import PrivacySettings from '../components/PrivacySettings';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

const PrivacySettingsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/privacy-settings');
    }
  }, [status, router]);
  
  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }
  
  if (status === 'unauthenticated') {
    return null; // La redirection sera gérée par l'effet
  }

  return (
    <>
      <Head>
        <title>Paramètres de confidentialité - FidelityShop</title>
        <meta name="description" content="Gérez vos données personnelles et vos préférences de confidentialité" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Gérer mes données personnelles</h1>
        
        <div className="mb-8">
          <p className="text-gray-600">
            Cette page vous permet de gérer vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
            Vous pouvez télécharger toutes les données que nous détenons à votre sujet ou demander la suppression de votre compte.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <PrivacySettings />
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">À propos du RGPD</h2>
            <p className="text-sm text-gray-600 mb-4">
              Le Règlement Général sur la Protection des Données (RGPD) est un règlement de l'Union européenne qui renforce et unifie la protection des données pour tous les individus au sein de l'Union européenne.
            </p>
            
            <h3 className="text-lg font-medium mb-2">Vos droits</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 mb-4">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement ("droit à l'oubli")</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à la portabilité des données</li>
              <li>Droit d'opposition</li>
            </ul>
            
            <div className="mt-6">
              <a href="/privacy-policy" className="text-blue-600 hover:underline text-sm">
                Consulter notre politique de confidentialité complète →
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

PrivacySettingsPage.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default PrivacySettingsPage; 