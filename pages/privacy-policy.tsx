import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

const PrivacyPolicy = () => {
  const [cookieConsent, setCookieConsent] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCookieConsent(localStorage.getItem('cookieConsent'));
    }
  }, []);
  
  const handleResetConsent = () => {
    if (typeof window !== 'undefined' && (window as any).resetCookieConsent) {
      (window as any).resetCookieConsent();
      setCookieConsent(null);
    }
  };
  
  return (
    <>
      <Head>
        <title>Politique de Confidentialité - FidelityShop</title>
        <meta name="description" content="Politique de confidentialité et utilisation des données personnelles sur FidelityShop" />
      </Head>
      <div className="container mx-auto px-4 py-8 text-white">
        <h1 className="text-3xl font-bold mb-6">Politique de Confidentialité</h1>
        
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold mb-2">Vos préférences actuelles</h3>
          <p className="mb-3">
            {cookieConsent === 'all' && "Vous avez accepté tous les cookies (essentiels et analytiques)."}
            {cookieConsent === 'essential' && "Vous avez accepté uniquement les cookies essentiels."}
            {!cookieConsent && "Vous n'avez pas encore défini vos préférences concernant les cookies."}
          </p>
          <button 
            onClick={handleResetConsent}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
          >
            Modifier mes préférences
          </button>
        </div>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-3 text-gray-300">
            Bienvenue sur la politique de confidentialité de SimnShop. Cette politique explique comment nous collectons, utilisons, stockons et protégeons vos données personnelles lorsque vous utilisez notre site.
          </p>
          <p className="mb-3 text-gray-300">
            Nous nous engageons à respecter votre vie privée et à nous conformer au Règlement Général sur la Protection des Données (RGPD) ainsi qu'à toutes les lois applicables en matière de protection des données.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Données collectées</h2>
          <p className="mb-3 text-gray-300">Nous collectons les données suivantes :</p>
          <ul className="list-disc pl-6 mb-3 text-gray-300">
            <li>Informations d'inscription : nom d'utilisateur, mot de passe (hashé)</li>
            <li>Informations de profil : nom Minecraft, identifiant Discord (si connecté)</li>
            <li>Données de transaction : historique d'achats, points de fidélité</li>
            <li>Données techniques : adresse IP, cookies de session, données de navigation</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Utilisation des données</h2>
          <p className="mb-3 text-gray-300">Nous utilisons vos données pour :</p>
          <ul className="list-disc pl-6 mb-3 text-gray-300">
            <li>Gérer votre compte et fournir nos services</li>
            <li>Traiter vos achats et gérer le programme de fidélité</li>
            <li>Améliorer notre site et nos services</li>
            <li>Vous contacter concernant votre compte ou vos commandes</li>
            <li>Prévenir les fraudes et assurer la sécurité de notre plateforme</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Base légale du traitement</h2>
          <p className="mb-3 text-gray-300">Nous traitons vos données sur les bases légales suivantes :</p>
          <ul className="list-disc pl-6 mb-3 text-gray-300">
            <li>L'exécution du contrat qui nous lie lorsque vous utilisez nos services</li>
            <li>Votre consentement, lorsque requis et fourni</li>
            <li>Nos intérêts légitimes, tant qu'ils ne portent pas atteinte à vos droits</li>
            <li>Le respect de nos obligations légales</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Cookies et technologies similaires</h2>
          <p className="mb-3 text-gray-300">
            Notre site utilise des cookies et technologies similaires pour améliorer votre expérience. Les cookies sont de petits fichiers stockés sur votre appareil qui nous aident à vous offrir une meilleure expérience.
          </p>
          <p className="mb-3 text-gray-300">Nous utilisons les types de cookies suivants :</p>
          <ul className="list-disc pl-6 mb-3 text-gray-300">
            <li><strong>Cookies essentiels</strong> : nécessaires au fonctionnement du site (authentification, sécurité)</li>
            <li><strong>Cookies analytiques</strong> : nous aident à comprendre comment vous utilisez notre site</li>
          </ul>
          <p className="mb-3 text-gray-300">
            Vous pouvez gérer vos préférences concernant les cookies à tout moment via notre bannière de consentement.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Conservation des données</h2>
          <p className="mb-3 text-gray-300">
            Nous conservons vos données personnelles aussi longtemps que nécessaire pour vous fournir nos services ou pour répondre à nos obligations légales. Une fois ce délai écoulé, nous supprimons ou anonymisons vos données.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Vos droits</h2>
          <p className="mb-3 text-gray-300">Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-6 mb-3 text-gray-300">
            <li>Droit d'accès à vos données personnelles</li>
            <li>Droit de rectification des données inexactes</li>
            <li>Droit à l'effacement (droit à l'oubli)</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit à la portabilité des données</li>
            <li>Droit d'opposition au traitement</li>
            <li>Droit de retirer votre consentement à tout moment</li>
          </ul>
          <p className="mb-3 text-gray-300">
            Pour exercer ces droits, veuillez nous contacter via les coordonnées indiquées ci-dessous.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Sécurité des données</h2>
          <p className="mb-3 text-gray-300">
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, toute modification, divulgation ou destruction.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contact</h2>
          <p className="mb-3 text-gray-300">
            Si vous avez des questions concernant cette politique de confidentialité ou l'utilisation de vos données personnelles, veuillez nous contacter à l'adresse suivante : [Insérer adresse e-mail de contact].
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Modifications de la politique de confidentialité</h2>
          <p className="mb-3 text-gray-300">
            Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement important par un avis sur notre site ou par e-mail.
          </p>
          <p className="mb-3 text-gray-300">
            Dernière mise à jour : {new Date().toLocaleDateString()}
          </p>
        </section>
      </div>
    </>
  );
};

PrivacyPolicy.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default PrivacyPolicy; 