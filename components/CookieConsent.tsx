import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cleanAnalyticsCookies } from '../lib/cookieManager';

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);
  
  useEffect(() => {
    // Vérifier si l'utilisateur a déjà accepté les cookies
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookieConsent', 'all');
    setShowConsent(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('cookieConsent', 'essential');
    // Nettoyer les cookies analytiques existants puisque l'utilisateur n'y a pas consenti
    cleanAnalyticsCookies();
    setShowConsent(false);
  };

  // Permettre à l'utilisateur de réafficher la bannière pour modifier ses préférences
  const resetConsent = () => {
    localStorage.removeItem('cookieConsent');
    setShowConsent(true);
  };

  // Exposer la fonction resetConsent au niveau global pour permettre son accès depuis la page de politique de confidentialité
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).resetCookieConsent = resetConsent;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).resetCookieConsent;
      }
    };
  }, []);

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg z-50">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="mb-4 md:mb-0 pr-4">
            <h3 className="text-xl font-bold mb-2">Utilisation des cookies</h3>
            <p className="text-sm mb-2">
              Ce site utilise des cookies pour améliorer votre expérience utilisateur. Les cookies essentiels sont nécessaires au fonctionnement du site, tandis que les cookies analytiques nous aident à comprendre comment vous interagissez avec notre site.
            </p>
            <p className="text-sm">
              Pour en savoir plus, consultez notre <Link href="/privacy-policy" className="text-blue-400 hover:underline">politique de confidentialité</Link>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={acceptEssential}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm whitespace-nowrap"
            >
              Accepter les cookies essentiels
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm whitespace-nowrap"
            >
              Accepter tous les cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent; 