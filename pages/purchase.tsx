import { useState, useEffect, useRef } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { GetServerSidePropsContext } from 'next';
import ProductImage from '../components/ProductImage';

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
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
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
    if (quantity <= 0) {
      // Retirer le produit du panier si la quantité est 0 ou négative
      setCart(prev => prev.filter(item => item.product.id !== product.id));
      return;
    }

    // Vérifier si le produit est déjà dans le panier
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      // Mettre à jour la quantité si le produit est déjà dans le panier
      setCart(prev => prev.map(item => 
        item.product.id === product.id ? { ...item, quantity } : item
      ));
    } else {
      // Ajouter le produit au panier s'il n'y est pas
      setCart(prev => [...prev, { product, quantity }]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
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

    if (!file) {
      setMessage({ type: 'error', content: 'Veuillez sélectionner une image comme preuve d\'achat' });
      return;
    }

    setUploadLoading(true);
    setMessage({ type: '', content: '' });

    const formData = new FormData();
    formData.append('receipt', file);
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
        content: 'Votre preuve d\'achat a été envoyée avec succès. Notre équipe la vérifiera bientôt.' 
      });
      setFile(null);
      setCart([]);
      setShowUploadSection(false);
      
      // Rediriger vers le tableau de bord après quelques secondes
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        content: 'Une erreur est survenue lors de l\'envoi de votre preuve d\'achat.' 
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-400 mb-8">Produit que vous avez vendu</h1>
      
      {message.content && (
        <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.content}
        </div>
      )}

      {/* Liste des produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {products.map(product => (
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
              <h3 className="text-xl font-semibold text-white mb-2">{product.name}</h3>
              <p className="text-gray-300 mb-4">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-blue-400 font-bold">{product.pointsCost} points</span>
                <div className="flex items-center">
                  <button 
                    onClick={() => {
                      const currentItem = cart.find(item => item.product.id === product.id);
                      const currentQuantity = currentItem ? currentItem.quantity : 0;
                      handleQuantityChange(product, Math.max(0, currentQuantity - 1));
                    }}
                    className="bg-gray-700 text-white px-3 py-1 rounded-l hover:bg-gray-600"
                  >
                    -
                  </button>
                  <span className="bg-gray-700 text-white px-4 py-1">
                    {cart.find(item => item.product.id === product.id)?.quantity || 0}
                  </span>
                  <button 
                    onClick={() => {
                      const currentItem = cart.find(item => item.product.id === product.id);
                      const currentQuantity = currentItem ? currentItem.quantity : 0;
                      handleQuantityChange(product, currentQuantity + 1);
                    }}
                    className="bg-gray-700 text-white px-3 py-1 rounded-r hover:bg-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé du panier */}
      {cart.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Votre sélection</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-gray-300">Produit</th>
                  <th className="px-4 py-2 text-gray-300">Prix unitaire</th>
                  <th className="px-4 py-2 text-gray-300">Quantité</th>
                  <th className="px-4 py-2 text-gray-300">Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.product.id} className="border-t border-gray-700">
                    <td className="px-4 py-2 text-gray-300">{item.product.name}</td>
                    <td className="px-4 py-2 text-gray-300">{item.product.pointsCost} points</td>
                    <td className="px-4 py-2 text-gray-300">{item.quantity}</td>
                    <td className="px-4 py-2 text-gray-300">{item.product.pointsCost * item.quantity} points</td>
                  </tr>
                ))}
                <tr className="border-t border-gray-700 font-bold">
                  <td colSpan={3} className="px-4 py-2 text-right text-gray-300">Total:</td>
                  <td className="px-4 py-2 text-blue-400">{calculateTotal()} points</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {!showUploadSection ? (
            <button
              onClick={() => setShowUploadSection(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Envoyer une preuve de vente
            </button>
          ) : (
            <div className="mt-6 border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Téléchargez votre preuve de vente</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">
                    Sélectionnez une capture d'écran de votre vente
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Formats acceptés: JPG, PNG, GIF. Taille maximum: 5 MB
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={uploadLoading || !file}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {uploadLoading ? 'Envoi en cours...' : 'Envoyer la preuve d\'achat'}
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
        </div>
      )}

      {cart.length === 0 && !message.content && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <p className="text-gray-300 text-center">
            Sélectionnez des produits pour continuer.
          </p>
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