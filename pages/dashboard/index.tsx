import { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { GetServerSidePropsContext } from 'next';

// Types pour notre application
interface UserData {
  id: string;
  username: string;
  points: number;
  minecraftName: string | null;
  discordId: string | null;
}

interface Receipt {
  id: string;
  createdAt: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  pointsAwarded: number | null;
  product?: {
    name: string;
  };
}

interface Product {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  imageUrl?: string;
}

interface Order {
  id: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed';
  product: {
    name: string;
    pointsCost: number;
  };
  quantity: number;
  totalPoints: number;
}

// Augmenter le type NextAuth pour inclure l'ID et isAdmin
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin?: boolean;
    }
  }
}

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [message, setMessage] = useState({ type: '', content: '' });

  // Vérifier l'authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Charger les données utilisateur
  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.id) {
        try {
          const userResponse = await axios.get('/api/user');
          setUserData(userResponse.data);

          const receiptsResponse = await axios.get('/api/receipts');
          if (receiptsResponse.data && receiptsResponse.data.receipts) {
            setReceipts(receiptsResponse.data.receipts);
          } else {
            setReceipts(receiptsResponse.data);
          }

          const ordersResponse = await axios.get('/api/orders');
          setOrders(ordersResponse.data);
          
          const productsResponse = await axios.get('/api/products');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', content: 'Veuillez sélectionner une image' });
      return;
    }
    
    if (!selectedProductId) {
      setMessage({ type: 'error', content: 'Veuillez sélectionner un produit' });
      return;
    }

    setUploadLoading(true);
    setMessage({ type: '', content: '' });

    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('productId', selectedProductId);

    try {
      await axios.post('/api/receipts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage({ 
        type: 'success', 
        content: 'Votre preuve d\'achat a été envoyée avec succès. Notre équipe la vérifiera bientôt.' 
      });
      setFile(null);
      setSelectedProductId('');
      
      const receiptsResponse = await axios.get('/api/receipts');
      if (receiptsResponse.data && receiptsResponse.data.receipts) {
        setReceipts(receiptsResponse.data.receipts);
      } else {
        setReceipts(receiptsResponse.data);
      }
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
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-blue-400 mb-8">Tableau de bord</h1>
      
      {/* Carte utilisateur */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-semibold text-white mb-2">Bienvenue, {userData?.username}</h2>
            <p className="text-gray-300 mb-2">
              Nom Minecraft: {userData?.minecraftName || 'Non défini'}
            </p>
          </div>
          <div className="bg-blue-500 px-6 py-4 rounded-lg text-center">
            <span className="block text-3xl font-bold text-white">{userData?.points || 0}</span>
            <span className="text-blue-100">Points disponibles</span>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Télécharger une preuve d'achat */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Envoyer une preuve de vente</h2>
          
          {message.content && (
            <div className={`p-3 mb-4 rounded ${
              message.type === 'success' ? 'bg-green-500 text-white' : 
              message.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {message.content}
            </div>
          )}
          
          <p className="text-gray-300 mb-4">
            Sélectionnez vos produits achetés et téléchargez une preuve d'achat pour recevoir des points.
          </p>
          <Link 
            href="/purchase" 
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Nouvelle preuve d'achat
          </Link>
        </div>

        {/* Boutique */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Réclamer des récompenses</h2>
          <p className="text-gray-300 mb-4">
            Échangez vos points contre des articles exclusifs dans notre boutique.
          </p>
          <Link 
            href="/shop" 
            className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Visiter la boutique
          </Link>
        </div>
        
        {/* Admin Panel - Visible uniquement pour les administrateurs */}
        {session?.user?.isAdmin && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">Administration</h2>
            <p className="text-gray-300 mb-4">
              Accéder aux fonctionnalités d'administration du site.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link 
                href="/admin/products" 
                className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Gérer les produits
              </Link>
              <Link 
                href="/admin/orders" 
                className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Voir toutes les commandes
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Historique des preuves d'achat */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-400 mb-4">Historique des preuves d'achat</h2>
        
        {Array.isArray(receipts) && receipts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-gray-300">Date</th>
                  <th className="px-4 py-2 text-gray-300">Produit</th>
                  <th className="px-4 py-2 text-gray-300">Image</th>
                  <th className="px-4 py-2 text-gray-300">Statut</th>
                  <th className="px-4 py-2 text-gray-300">Points</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map(receipt => (
                  <tr key={receipt.id} className="border-t border-gray-700">
                    <td className="px-4 py-2 text-gray-300">
                      {new Date(receipt.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-gray-300">
                      {receipt.product?.name || 'Non spécifié'}
                    </td>
                    <td className="px-4 py-2">
                      <a 
                        href={receipt.imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-400 hover:underline"
                      >
                        Voir l'image
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        receipt.status === 'approved' ? 'bg-green-500 text-white' : 
                        receipt.status === 'rejected' ? 'bg-red-500 text-white' : 
                        'bg-yellow-500 text-white'
                      }`}>
                        {receipt.status === 'approved' ? 'Approuvé' : 
                         receipt.status === 'rejected' ? 'Rejeté' : 
                         'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-300">
                      {receipt.pointsAwarded ? `+${receipt.pointsAwarded}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-300">Vous n'avez pas encore envoyé de preuve d'achat.</p>
        )}
      </div>

      {/* Historique des commandes */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-blue-400 mb-4">Historique des commandes</h2>
        
        {orders.length === 0 ? (
          <p className="text-gray-300">Vous n'avez pas encore passé de commande.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-gray-300">Date</th>
                  <th className="px-4 py-2 text-gray-300">Produit</th>
                  <th className="px-4 py-2 text-gray-300">Quantité</th>
                  <th className="px-4 py-2 text-gray-300">Points</th>
                  <th className="px-4 py-2 text-gray-300">Statut</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-t border-gray-700">
                    <td className="px-4 py-2 text-gray-300">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-gray-300">
                      {order.product.name}
                    </td>
                    <td className="px-4 py-2 text-gray-300">
                      {order.quantity}
                    </td>
                    <td className="px-4 py-2 text-gray-300">
                      {order.totalPoints}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        order.status === 'completed' ? 'bg-green-600' : 
                        order.status === 'processing' ? 'bg-blue-600' : 'bg-yellow-600'
                      }`}>
                        {order.status === 'completed' ? 'Terminé' : 
                         order.status === 'processing' ? 'En traitement' : 'En attente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  
  return {
    props: { session }
  };
} 