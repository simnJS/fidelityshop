import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Head from 'next/head';

export default function TestImagesPage() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [directUrl, setDirectUrl] = useState('');
  const [testUrl, setTestUrl] = useState('');

  useEffect(() => {
    async function fetchImages() {
      try {
        // Ici on ne fait pas appel à l'API pour éviter les problèmes d'authentification
        setLoading(false);
        
        // Quelques exemples d'URLs pour tester
        const baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
        const sampleImages = [
          '/uploads/1742120774309-full-blanc.png',
          '/uploads/1742122944460-bleu_blanc_dÃ©gradÃ©_1.png'
        ];
        
        setImages(sampleImages);
      } catch (err) {
        console.error('Erreur lors du chargement des images:', err);
        setError('Erreur lors du chargement des images.');
        setLoading(false);
      }
    }

    fetchImages();
  }, []);

  const handleDirectTest = () => {
    if (!directUrl) return;
    setTestUrl(directUrl);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Head>
        <title>Test d'affichage des images</title>
      </Head>

      <h1 className="text-3xl font-bold text-blue-400 mb-8">Test d'affichage des images</h1>
      
      {error && (
        <div className="p-4 mb-6 rounded bg-red-500 text-white">
          {error}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-400 mb-4">Test d'URL directe</h2>
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={directUrl}
            onChange={(e) => setDirectUrl(e.target.value)}
            placeholder="Entrez l'URL complète d'une image"
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleDirectTest}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Tester
          </button>
        </div>
        
        {testUrl && (
          <div className="mb-4">
            <h3 className="text-white mb-2">Image avec balise img:</h3>
            <div className="bg-gray-700 p-4 rounded mb-4">
              <img 
                src={testUrl} 
                alt="Test direct" 
                style={{ maxWidth: '100%', maxHeight: '300px' }}
                className="mx-auto"
              />
            </div>
            
            <h3 className="text-white mb-2">URL complète:</h3>
            <div className="bg-gray-700 p-4 rounded mb-4 break-all">
              <span className="text-gray-300">{testUrl}</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-blue-400 mb-4">Test des images existantes</h2>
        
        {loading ? (
          <div className="text-gray-300">Chargement des images...</div>
        ) : images.length === 0 ? (
          <div className="text-gray-300">Aucune image trouvée.</div>
        ) : (
          <div className="space-y-6">
            {images.map((image, index) => {
              const fullUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;
              
              return (
                <div key={index} className="border border-gray-700 rounded-lg p-4">
                  <h3 className="text-white mb-2">Image {index + 1}</h3>
                  
                  <div className="mb-3">
                    <h4 className="text-sm text-gray-400 mb-1">URL relative:</h4>
                    <div className="bg-gray-700 p-2 rounded">
                      <code className="text-xs text-gray-300">{image}</code>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="text-sm text-gray-400 mb-1">URL complète:</h4>
                    <div className="bg-gray-700 p-2 rounded">
                      <code className="text-xs text-gray-300">{fullUrl}</code>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm text-gray-400 mb-1">Test avec balise img:</h4>
                      <div className="bg-gray-700 p-4 rounded">
                        <img 
                          src={fullUrl} 
                          alt={`Test ${index}`}
                          style={{ maxWidth: '100%', maxHeight: '300px' }}
                          className="mx-auto"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm text-gray-400 mb-1">Test avec Next.js Image (unoptimized):</h4>
                      <div className="bg-gray-700 p-4 rounded relative h-[300px]">
                        <Image 
                          src={fullUrl}
                          alt={`Test Next.js ${index}`}
                          fill
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm text-gray-400 mb-1">Lien direct:</h4>
                      <div className="bg-gray-700 p-2 rounded">
                        <a 
                          href={fullUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          Ouvrir dans un nouvel onglet
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 