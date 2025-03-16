import { useState, useEffect, useRef } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { GetServerSidePropsContext } from 'next';
import ProductImage from '../components/ProductImage';
import Head from 'next/head';
import Layout from '../components/Layout';

// Types pour notre application
interface Product {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  imageUrl?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PurchasePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [showUploadSection, setShowUploadSection] = useState(false);

  // Vérifier l'authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Charger les produits
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsResponse = await axios.get('/api/products?type=loyalty');
        setProducts(productsResponse.data);
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchProducts();
    }
  }, [session]);

  const handleQuantityChange = (product: Product, quantity: number) => {
    if (quantity < 0) return;
    
    if (quantity === 0) {
      setCart(prev => prev.filter(item => item.product.id !== product.id));
      return;
    }
    
    const existingItemIndex = cart.findIndex(item => item.product.id === product.id);
    
    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = { 
        ...updatedCart[existingItemIndex],
        quantity 
      };
      setCart(updatedCart);
    } else {
      setCart(prev => [...prev, { product, quantity }]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files);
      setFiles(prev => [...prev, ...fileArray]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.pointsCost * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setMessage({ type: 'error', content: 'Veuillez sélectionner au moins un produit' });
      return;
    }

    if (files.length === 0) {
      setMessage({ type: 'error', content: 'Veuillez sélectionner au moins une image comme preuve d\'achat' });
      return;
    }

    setUploadLoading(true);
    setMessage({ type: '', content: '' });

    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('receipts', file);
    });
    
    formData.append('products', JSON.stringify(cart.map(item => ({
      id: item.product.id,
      quantity: item.quantity
    }))));

    try {
      await axios.post('/api/receipts/upload-multi', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage({ 
        type: 'success', 
        content: 'Vos preuves d\'achat ont été envoyées avec succès. Notre équipe les vérifiera bientôt.' 
      });
      setFiles([]);
      setCart([]);
      setShowUploadSection(false);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        content: 'Une erreur est survenue lors de l\'envoi de vos preuves d\'achat.' 
      });
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-300">Chargement...</div>
      </div>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Ajouter un achat | FidelityShop</title>
      </Head>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Ajouter un achat</h1>
        
        {message.content && (
          <div 
            className={`p-4 mb-6 rounded ${
              message.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            }`}
          >
            {message.content}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Sélectionnez vos produits</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Chargement des produits...</p>
            </div>
          ) : products.length === 0 ? (
            <p className="text-gray-400">Aucun produit disponible pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-700 rounded-lg">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {products.map((product) => {
                    const cartItem = cart.find(item => item.product.id === product.id);
                    const quantity = cartItem ? cartItem.quantity : 0;
                    
                    return (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.imageUrl && (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="h-10 w-10 rounded-full mr-3" 
                              />
                            )}
                            <div>
                              <div className="font-medium text-white">{product.name}</div>
                              <div className="text-gray-400 text-sm">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white">
                          {product.pointsCost}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <button
                              onClick={() => handleQuantityChange(product, quantity - 1)}
                              className="bg-gray-600 text-white w-8 h-8 rounded-l hover:bg-gray-500"
                            >
                              -
                            </button>
                            <span className="bg-gray-700 text-white px-4 py-1 w-12 text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(product, quantity + 1)}
                              className="bg-gray-600 text-white w-8 h-8 rounded-r hover:bg-gray-500"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white">
                          {quantity * product.pointsCost}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {!showUploadSection ? (
            <button
              onClick={() => setShowUploadSection(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Envoyer une preuve de vente
            </button>
          ) : (
            <div className="mt-6 border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Téléchargez vos preuves de vente</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">
                    Sélectionnez une ou plusieurs images de vos ventes
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    multiple
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Formats acceptés: JPG, PNG, GIF. Taille maximum: 5 MB par image
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-white mb-2">Images sélectionnées:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {files.map((file, index) => (
                        <div key={index} className="relative bg-gray-700 p-2 rounded-lg">
                          <div className="flex items-center">
                            <div className="flex-1 truncate text-white text-sm">{file.name}</div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="ml-2 text-red-400 hover:text-red-300"
                            >
                              ×
                            </button>
                          </div>
                          {file.type.startsWith('image/') && (
                            <div className="mt-2 h-20 bg-gray-600 rounded flex items-center justify-center">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Aperçu ${index}`}
                                className="max-h-20 max-w-full object-contain"
                                onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={uploadLoading || cart.length === 0 || files.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadLoading ? 'Envoi en cours...' : 'Envoyer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadSection(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {cart.length > 0 && (
            <div className="mt-6 text-right">
              <p className="text-white text-lg">
                Total des points potentiels: <span className="font-bold text-blue-400">{calculateTotal()}</span>
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Comment ça marche?</h2>
          <ol className="list-decimal list-inside text-gray-300 space-y-2">
            <li>Sélectionnez les produits que vous avez achetés et spécifiez leur quantité</li>
            <li>Téléchargez une ou plusieurs images comme preuve d'achat (capture d'écran, facture, etc.)</li>
            <li>Soumettez votre demande pour révision</li>
            <li>Notre équipe vérifiera votre achat et vous accordera les points correspondants</li>
            <li>Vous recevrez une notification lorsque vos points seront ajoutés à votre compte</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login?redirect=/purchase',
        permanent: false,
      },
    };
  }
  
  return {
    props: { session }
  };
} 