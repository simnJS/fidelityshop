import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getToken } from 'next-auth/jwt';
import { GetServerSideProps } from 'next';
import AdminLayout from '../../../components/AdminLayout';

interface ReceiptData {
  id: string;
  imageUrl: string;
  userId: string;
  status: string;
  createdAt: string;
  user?: {
    username: string;
    email: string;
    displayName?: string;
  };
  metadata?: string;
  additionalImages?: string[];
}

interface MetadataContent {
  products?: Array<{
    id: string;
    quantity: number;
    name: string;
    pointsCost: number;
  }>;
  totalPotentialPoints?: number;
  additionalImages?: string[];
}

export default function ReceiptDetailPage({ receipt: initialReceipt }: { receipt: ReceiptData }) {
  const router = useRouter();
  const [receipt, setReceipt] = useState<ReceiptData | null>(initialReceipt);
  const [metadata, setMetadata] = useState<MetadataContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (receipt && receipt.metadata) {
      try {
        const parsedMetadata = JSON.parse(receipt.metadata);
        setMetadata(parsedMetadata);
        
        // Récupérer les images supplémentaires si présentes
        if (parsedMetadata.additionalImages) {
          setReceipt(prev => ({
            ...prev!,
            additionalImages: parsedMetadata.additionalImages
          }));
        }
      } catch (error) {
        console.error('Erreur lors du parsing du metadata:', error);
      }
    }
  }, [receipt]);

  const handleApprove = async () => {
    if (loading || !receipt) return;
    
    setLoading(true);
    setMessage({ type: '', content: '' });
    
    try {
      const response = await axios.post(`/api/admin/receipts/${receipt.id}/approve`);
      setReceipt({ ...receipt, status: 'approved' });
      setMessage({ 
        type: 'success', 
        content: 'Reçu approuvé avec succès. ' + 
                 (metadata?.totalPotentialPoints ? 
                  `${metadata.totalPotentialPoints} points accordés à l'utilisateur.` : '')
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        content: error.response?.data?.message || 'Une erreur est survenue lors de l\'approbation du reçu.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (loading || !receipt) return;
    
    setLoading(true);
    setMessage({ type: '', content: '' });
    
    try {
      const response = await axios.post(`/api/admin/receipts/${receipt.id}/reject`);
      setReceipt({ ...receipt, status: 'rejected' });
      setMessage({ type: 'success', content: 'Reçu rejeté.' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        content: error.response?.data?.message || 'Une erreur est survenue lors du rejet du reçu.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Détail du reçu</h1>
          <button 
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            Retour
          </button>
        </div>

        {message.content && (
          <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.content}
          </div>
        )}

        {receipt ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 mb-6 md:mb-0 md:pr-6">
                  <h2 className="text-xl font-semibold mb-4">Informations</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 font-medium">ID:</div>
                    <div className="col-span-2">{receipt.id}</div>
                    
                    <div className="col-span-1 font-medium">Utilisateur:</div>
                    <div className="col-span-2">
                      {receipt.user ? (
                        <div>
                          <div>{receipt.user.displayName || receipt.user.username}</div>
                          <div className="text-sm text-gray-500">{receipt.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">ID: {receipt.userId}</span>
                      )}
                    </div>
                    
                    <div className="col-span-1 font-medium">Date:</div>
                    <div className="col-span-2">
                      {new Date(receipt.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    
                    <div className="col-span-1 font-medium">Statut:</div>
                    <div className="col-span-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                        receipt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        receipt.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {receipt.status === 'pending' ? 'En attente' :
                         receipt.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:w-1/2">
                  <h2 className="text-xl font-semibold mb-4">Images</h2>
                  
                  {/* Affichage d'une galerie d'images */}
                  <div className="mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Image principale */}
                      <div 
                        className="relative h-40 bg-gray-100 cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition"
                        onClick={() => openImageModal(receipt.imageUrl)}
                      >
                        <img 
                          src={receipt.imageUrl} 
                          alt="Reçu principal" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br">
                          Principale
                        </div>
                      </div>
                      
                      {/* Images supplémentaires */}
                      {receipt.additionalImages && receipt.additionalImages.map((imageUrl, index) => (
                        <div 
                          key={index}
                          className="relative h-40 bg-gray-100 cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition"
                          onClick={() => openImageModal(imageUrl)}
                        >
                          <img 
                            src={imageUrl} 
                            alt={`Image supplémentaire ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-0 left-0 bg-gray-500 text-white text-xs px-2 py-1 rounded-br">
                            Image {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {metadata?.products && metadata.products.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Produits</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantité
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Points unitaires
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {metadata.products.map((product, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {product.name} <span className="text-gray-400 text-xs">({product.id})</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {product.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {product.pointsCost}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                              {product.pointsCost * product.quantity}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="px-6 py-4 text-right font-medium">
                            Total des points:
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-600">
                            {metadata.totalPotentialPoints}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {receipt.status === 'pending' && (
                <div className="mt-8 flex space-x-4">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {loading ? 'Traitement...' : 'Approuver'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {loading ? 'Traitement...' : 'Rejeter'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <p className="text-gray-500">Chargement des détails du reçu...</p>
          </div>
        )}

        {/* Modal pour afficher l'image en grand */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={closeImageModal}>
            <div className="max-w-4xl w-full max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
              <img 
                src={selectedImage} 
                alt="Image agrandie" 
                className="max-w-full max-h-[85vh] mx-auto object-contain bg-white p-1"
              />
              <button 
                onClick={closeImageModal}
                className="absolute top-0 right-0 -mt-10 -mr-10 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req, params } = context;
  const token = await getToken({ req });
  
  if (!token || token.role !== 'admin') {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const id = params?.id as string;
  
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/receipts/${id}`, {
      headers: {
        Cookie: req.headers.cookie || '',
      },
    });
    
    return {
      props: {
        receipt: response.data,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}; 