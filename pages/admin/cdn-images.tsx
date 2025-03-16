import { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';
import ZiplineUploader from '../../components/ZiplineUploader';

export default function CdnImagesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Vérifier l'authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (!session.user.isAdmin) {
        router.push('/dashboard');
      } else {
        setLoading(false);
      }
    }
  }, [status, session, router]);

  const handleUploadComplete = (url: string) => {
    setUploadedUrls(prev => [url, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-300">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Head>
        <title>Gestion des images - CDN</title>
      </Head>

      <h1 className="text-3xl font-bold text-blue-400 mb-8">Gestion des images avec votre CDN</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">Uploader une image</h2>
            <p className="text-gray-300 mb-4">
              Uploadez vos images sur le CDN pour les utiliser dans vos produits. Une fois l'image uploadée, vous pourrez copier son URL.
            </p>
            
            <ZiplineUploader 
              onUploadComplete={handleUploadComplete}
              className="mt-4"
            />
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">Comment utiliser le CDN</h2>
            <div className="text-gray-300 space-y-4">
              <div>
                <h3 className="font-semibold">1. Uploadez une image</h3>
                <p className="text-sm">Utilisez le formulaire ci-dessus pour uploader vos images.</p>
              </div>
              
              <div>
                <h3 className="font-semibold">2. Copiez l'URL</h3>
                <p className="text-sm">Une fois l'upload terminé, vous pourrez copier l'URL de l'image.</p>
              </div>
              
              <div>
                <h3 className="font-semibold">3. Utilisez l'URL dans les produits</h3>
                <p className="text-sm">Collez l'URL dans le champ "URL de l'image" lors de la création ou de la modification d'un produit.</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-blue-400 mb-1">Avantages du CDN</p>
                <ul className="text-xs list-disc list-inside space-y-1">
                  <li>Chargement plus rapide des images</li>
                  <li>Distribution mondiale</li>
                  <li>Moins de charge sur votre serveur principal</li>
                  <li>Persistance garantie des images</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Images récemment uploadées</h2>
          
          {uploadedUrls.length === 0 ? (
            <p className="text-gray-300">Aucune image uploadée durant cette session.</p>
          ) : (
            <div className="space-y-4">
              {uploadedUrls.map((url, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-4">
                  <div className="relative h-40 mb-3">
                    <img 
                      src={url} 
                      alt={`Image ${index + 1}`}
                      className="mx-auto max-h-40 object-contain"
                    />
                  </div>
                  
                  <div className="flex items-center bg-gray-700 rounded px-3 py-2">
                    <input 
                      type="text" 
                      value={url} 
                      readOnly 
                      className="bg-transparent flex-grow text-sm text-gray-300 outline-none overflow-hidden"
                    />
                    <button 
                      onClick={() => navigator.clipboard.writeText(url)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      Copier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  // Vérifier que l'utilisateur est bien un administrateur
  if (!session.user.isAdmin) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
  
  return {
    props: { session }
  };
} 