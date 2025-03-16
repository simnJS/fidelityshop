import { useState, useEffect, useRef } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';
import { GetServerSidePropsContext } from 'next';
import ProductImage from '../../components/ProductImage';

// Types pour notre application
interface UserData {
  id: string;
  username: string;
  points: number;
  minecraftName: string | null;
  discordId: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  imageUrl?: string;
  inStock: boolean;
}

export default function ShopPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [message, setMessage] = useState<{ type: '' | 'success' | 'error' | 'warning'; content: string }>({ type: '', content: '' });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Vérifier l'authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Charger les données utilisateur et produits
  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.id) {
        try {
          const userResponse = await axios.get('/api/user');
          setUserData(userResponse.data);

          const productsResponse = await axios.get('/api/products?type=reward');
          setProducts(productsResponse.data);
        } catch (error) {
          console.error('Erreur lors du chargement des données:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (session) {
      fetchData();
    }
  }, [session]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowConfirmModal(true);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    return selectedProduct.pointsCost * quantity;
  };

  const handleCancelOrder = () => {
    setShowConfirmModal(false);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleConfirmOrder = async () => {
    if (!selectedProduct || !userData) return;

    const total = calculateTotal();
    if (total > userData.points) {
      setMessage({
        type: 'error',
        content: 'Points insuffisants pour cette commande'
      });
      return;
    }

    setOrderLoading(true);
    setMessage({ type: '', content: '' });

    try {
      const response = await axios.post('/api/orders/create', {
        productId: selectedProduct.id,
        quantity: quantity
      });

      // Vérifier si la notification Discord a été envoyée
      if (response.data.discordNotificationSent) {
        setMessage({
          type: 'success',
          content: 'Commande passée avec succès! Notre équipe la traitera bientôt.'
        });
        
        // Mettre à jour les points de l'utilisateur SEULEMENT si la commande est réussie
        setUserData(prev => prev ? { ...prev, points: prev.points - total } : null);
        
        // Fermer le modal
        setShowConfirmModal(false);
        setSelectedProduct(null);
        
        // Rediriger vers le tableau de bord après quelques secondes
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        // Ce cas ne devrait plus se produire avec la nouvelle API, mais on le garde par sécurité
        setMessage({
          type: 'warning',
          content: 'Commande enregistrée, mais l\'équipe n\'a pas été notifiée automatiquement. Aucun point n\'a été déduit. Veuillez réessayer plus tard.'
        });
        setShowConfirmModal(false);
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la commande:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création de la commande';
      
      setMessage({
        type: 'error',
        content: errorMessage
      });
      
      // Informer l'utilisateur que sa commande n'a pas été finalisée et qu'aucun point n'a été déduit
      if (errorMessage.includes('Discord')) {
        setMessage({
          type: 'error',
          content: 'Problème de connexion avec Discord. Votre commande n\'a pas été finalisée et aucun point n\'a été déduit. Veuillez réessayer plus tard.'
        });
      }
    } finally {
      setOrderLoading(false);
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-400 mb-2">Boutique</h1>
      <p className="text-gray-300 mb-6">Échangez vos points contre des récompenses exclusives!</p>
      
      {/* Affichage des points disponibles */}
      <div className="bg-blue-500 text-white px-6 py-4 rounded-lg inline-block mb-8">
        <span className="block text-3xl font-bold">{userData?.points || 0}</span>
        <span className="text-blue-100">Points disponibles</span>
      </div>
      
      {message.content && (
        <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-500 text-white' : message.type === 'warning' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.content}
        </div>
      )}
      
      {/* Liste des produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <p className="text-gray-300 col-span-3">Aucun produit n'est disponible pour le moment.</p>
        ) : (
          products.map(product => (
            <div key={product.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="h-48 relative">
                {product.imageUrl ? (
                  <ProductImage 
                    imageUrl={product.imageUrl} 
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <span className="text-gray-400">Pas d'image</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-white">{product.name}</h3>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold">
                    {product.pointsCost} points
                  </span>
                </div>
                <p className="text-gray-300 mb-4">{product.description}</p>
                <button
                  onClick={() => handleProductSelect(product)}
                  disabled={!product.inStock || (userData?.points || 0) < product.pointsCost}
                  className={`w-full py-2 px-4 rounded font-bold ${
                    !product.inStock 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : (userData?.points || 0) < product.pointsCost
                      ? 'bg-red-600 text-white cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {!product.inStock 
                    ? 'Indisponible' 
                    : (userData?.points || 0) < product.pointsCost
                    ? 'Points insuffisants'
                    : 'Échanger'
                  }
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Modal de confirmation */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">Confirmer votre commande</h2>
            
            <div className="mb-4">
              <p className="text-white font-semibold mb-1">{selectedProduct.name}</p>
              <p className="text-gray-300 mb-3">{selectedProduct.description}</p>
              
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-300">Prix unitaire:</span>
                <span className="text-white font-semibold">{selectedProduct.pointsCost} points</span>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <label className="text-gray-300">Quantité:</label>
                <div className="flex items-center">
                  <button 
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="bg-gray-700 text-white px-3 py-1 rounded-l hover:bg-gray-600 disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="bg-gray-700 text-white px-4 py-1">{quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={calculateTotal() + selectedProduct.pointsCost > (userData?.points || 0)}
                    className="bg-gray-700 text-white px-3 py-1 rounded-r hover:bg-gray-600 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-t border-gray-700 pt-3 mb-4">
                <span className="text-gray-300">Total:</span>
                <span className="text-white font-bold text-xl">{calculateTotal()} points</span>
              </div>
              
              <div className="flex justify-between items-center mb-5">
                <span className="text-gray-300">Points disponibles:</span>
                <span className={`font-semibold ${
                  calculateTotal() > (userData?.points || 0) ? 'text-red-500' : 'text-green-500'
                }`}>
                  {userData?.points || 0} points
                </span>
              </div>
              
              {calculateTotal() > (userData?.points || 0) && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded p-2 mb-4">
                  <p className="text-red-500 text-sm">
                    Points insuffisants pour cette commande
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCancelOrder}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={calculateTotal() > (userData?.points || 0) || orderLoading}
                className={`flex-1 font-bold py-2 px-4 rounded ${
                  calculateTotal() > (userData?.points || 0) 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {orderLoading ? 'Traitement...' : 'Confirmer la commande'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  
  return {
    props: { session }
  };
} 