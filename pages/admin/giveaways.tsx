import { useState, useEffect } from 'react';
import { getSession, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GetServerSidePropsContext } from 'next';
import { FaPlus, FaEdit, FaTrash, FaTrophy, FaGift } from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';
import ZiplineUploader from '../../components/ZiplineUploader';

// Types pour notre application
interface Giveaway {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  status: string;
  product?: Product;
  productId?: string;
  customPrize?: string;
  winnerId?: string;
  _count?: {
    entries: number;
  };
  winner?: {
    id: string;
    username: string;
  };
}

interface Product {
  id: string;
  name: string;
  imageUrl?: string;
  pointsCost: number;
}

export default function AdminGiveawaysPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', content: '' });
  
  // Formulaire pour nouveau giveaway
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    startDate: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd\'T\'HH:mm'),
    status: 'active',
    productId: '',
    customPrize: ''
  });
  
  const [editingGiveaway, setEditingGiveaway] = useState<Giveaway | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [selectedPrizeType, setSelectedPrizeType] = useState<'product' | 'custom'>('product');

  // Configurer un intercepteur Axios pour ajouter les en-têtes d'authentification
  useEffect(() => {
    if (status === 'authenticated') {
      // Configurer l'intercepteur Axios
      const requestInterceptor = axios.interceptors.request.use(
        (config) => {
          // Ajouter l'en-tête d'authentification à toutes les requêtes
          config.headers = config.headers || {};
          config.headers['x-api-csrf'] = true; // Aider NextAuth à détecter une requête CSRF valide
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Nettoyer l'intercepteur lors du démontage du composant
      return () => {
        axios.interceptors.request.eject(requestInterceptor);
      };
    }
  }, [status]);

  // Vérifier l'authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchGiveaways();
      fetchProducts();
      fetchAvailableImages();
    }
  }, [status, router]);

  // Récupérer les giveaways
  const fetchGiveaways = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/giveaways');
      setGiveaways(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des giveaways:', error);
      setMessage({ type: 'error', content: 'Impossible de récupérer les giveaways: ' + (error.response?.data?.error || error.message) });
      setLoading(false);
    }
  };

  // Récupérer les produits pour les prix
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/admin/products');
      setProducts(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des produits:', error);
      setMessage({ type: 'error', content: 'Impossible de récupérer les produits: ' + (error.response?.data?.error || error.message) });
    }
  };

  // Récupérer les images disponibles
  const fetchAvailableImages = async () => {
    try {
      const response = await axios.get('/api/admin/cdn-images');
      setAvailableImages(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des images:', error);
      setMessage({ type: 'error', content: 'Impossible de récupérer les images: ' + (error.response?.data?.error || error.message) });
    }
  };

  // Gestion des formulaires
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      startDate: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
      endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd\'T\'HH:mm'),
      status: 'active',
      productId: '',
      customPrize: ''
    });
    setSelectedPrizeType('product');
    setEditingGiveaway(null);
    setFormMode('create');
  };

  const handleEditClick = (giveaway: Giveaway) => {
    setEditingGiveaway(giveaway);
    setFormMode('edit');
    setSelectedPrizeType(giveaway.productId ? 'product' : 'custom');
    setFormData({
      title: giveaway.title,
      description: giveaway.description,
      imageUrl: giveaway.imageUrl || '',
      startDate: format(new Date(giveaway.startDate), 'yyyy-MM-dd\'T\'HH:mm'),
      endDate: format(new Date(giveaway.endDate), 'yyyy-MM-dd\'T\'HH:mm'),
      status: giveaway.status,
      productId: giveaway.productId || '',
      customPrize: giveaway.customPrize || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        productId: selectedPrizeType === 'product' ? formData.productId : null,
        customPrize: selectedPrizeType === 'custom' ? formData.customPrize : null
      };
      
      if (formMode === 'create') {
        // Créer un nouveau giveaway
        const response = await axios.post('/api/admin/giveaways', payload);
        setMessage({ type: 'success', content: 'Giveaway créé avec succès!' });
      } else if (editingGiveaway) {
        // Mettre à jour un giveaway existant
        const response = await axios.put(`/api/admin/giveaways/${editingGiveaway.id}`, payload);
        setMessage({ type: 'success', content: 'Giveaway mis à jour avec succès!' });
      }
      
      resetForm();
      fetchGiveaways();
    } catch (error: any) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      setMessage({ type: 'error', content: 'Une erreur est survenue: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (giveawayId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce giveaway?')) {
      try {
        setLoading(true);
        await axios.delete(`/api/admin/giveaways/${giveawayId}`);
        setMessage({ type: 'success', content: 'Giveaway supprimé avec succès!' });
        setGiveaways(giveaways.filter(g => g.id !== giveawayId));
        setLoading(false);
      } catch (error: any) {
        console.error('Erreur lors de la suppression du giveaway:', error);
        setMessage({ type: 'error', content: 'Impossible de supprimer le giveaway: ' + (error.response?.data?.error || error.message) });
        setLoading(false);
      }
    }
  };

  const handlePickWinner = async (giveawayId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir sélectionner un gagnant pour ce giveaway?')) {
      try {
        setLoading(true);
        const response = await axios.post(`/api/admin/giveaways/${giveawayId}/pick-winner`);
        setMessage({ type: 'success', content: `Gagnant sélectionné: ${response.data.winnerUsername}` });
        fetchGiveaways();
      } catch (error: any) {
        console.error('Erreur lors de la sélection du gagnant:', error);
        setMessage({ type: 'error', content: 'Impossible de sélectionner un gagnant: ' + (error.response?.data?.error || error.message) });
      } finally {
        setLoading(false);
      }
    }
  };

  const selectImage = (imageUrl: string) => {
    setFormData({ ...formData, imageUrl });
    setShowImageSelector(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Gestion des Giveaways - Administration</title>
      </Head>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Gestion des Giveaways</h1>
        
        {/* Message de notification */}
        {message.content && (
          <div className={`p-4 mb-4 rounded ${message.type === 'success' ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-red-900/50 text-red-400 border border-red-700'}`}>
            {message.content}
          </div>
        )}
        
        {/* Formulaire de création/édition */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">
            {formMode === 'create' ? 'Créer un nouveau giveaway' : 'Modifier le giveaway'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Titre</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Image</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="URL de l'image"
                  />
                  <button
                    type="button"
                    onClick={() => setShowImageSelector(true)}
                    className="ml-2 px-3 py-2 bg-gray-600 text-gray-200 rounded hover:bg-gray-500 transition-colors"
                  >
                    Choisir
                  </button>
                </div>
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={formData.imageUrl} 
                      alt="Aperçu" 
                      className="h-24 w-auto object-contain border border-gray-600 rounded p-1" 
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dates */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date de début</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date de fin</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Statut</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="active">Actif</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              
              {/* Type de prix */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Type de prix</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="prizeType"
                      value="product"
                      checked={selectedPrizeType === 'product'}
                      onChange={() => setSelectedPrizeType('product')}
                      className="form-radio text-blue-500"
                    />
                    <span className="ml-2 text-gray-200">Produit</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="prizeType"
                      value="custom"
                      checked={selectedPrizeType === 'custom'}
                      onChange={() => setSelectedPrizeType('custom')}
                      className="form-radio text-blue-500"
                    />
                    <span className="ml-2 text-gray-200">Prix personnalisé</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Sélection du prix selon le type */}
            {selectedPrizeType === 'product' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Produit à gagner</label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                  required={selectedPrizeType === 'product'}
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.pointsCost} points)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description du prix</label>
                <input
                  type="text"
                  name="customPrize"
                  value={formData.customPrize}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Carte Steam 20€"
                  required={selectedPrizeType === 'custom'}
                />
              </div>
            )}
            
            {/* Boutons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded focus:outline-none focus:ring transition-colors"
                disabled={loading}
              >
                {formMode === 'create' ? 'Créer le giveaway' : 'Mettre à jour le giveaway'}
              </button>
              
              {formMode === 'edit' && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-600 text-gray-200 rounded hover:bg-gray-500 focus:outline-none focus:ring transition-colors"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Liste des giveaways */}
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700 bg-gray-750">
            <h3 className="text-lg font-semibold text-blue-400">Liste des giveaways</h3>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : giveaways.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FaGift className="mx-auto mb-2 text-4xl text-gray-600" />
              <p>Aucun giveaway disponible</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Giveaway</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Dates</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Prix</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Participants</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Gagnant</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {giveaways.map(giveaway => (
                    <tr key={giveaway.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {giveaway.imageUrl && (
                            <div className="flex-shrink-0 h-10 w-10 mr-3">
                              <img 
                                src={giveaway.imageUrl} 
                                alt={giveaway.title} 
                                className="h-10 w-10 object-cover rounded-md" 
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-200">{giveaway.title}</div>
                            <div className="text-gray-400 text-sm truncate w-48">{giveaway.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          <div>Début: {new Date(giveaway.startDate).toLocaleDateString('fr-FR')}</div>
                          <div>Fin: {new Date(giveaway.endDate).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {giveaway.product ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-200">{giveaway.product.name}</div>
                            <div className="text-blue-400">{giveaway.product.pointsCost} points</div>
                          </div>
                        ) : giveaway.customPrize ? (
                          <div className="text-sm text-gray-200">{giveaway.customPrize}</div>
                        ) : (
                          <div className="text-sm text-gray-400">Aucun prix défini</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${giveaway.status === 'active' ? 'bg-green-900/50 text-green-400 border border-green-700' : 
                          giveaway.status === 'completed' ? 'bg-blue-900/50 text-blue-400 border border-blue-700' : 
                          'bg-gray-700 text-gray-300 border border-gray-600'}`}
                        >
                          {giveaway.status === 'active' ? 'Actif' : 
                           giveaway.status === 'completed' ? 'Terminé' : 'Annulé'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                        {giveaway._count?.entries || 0} participants
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {giveaway.winnerId ? (
                          <span className="text-yellow-400 font-medium">{giveaway.winner?.username || 'Non spécifié'}</span>
                        ) : (
                          <span className="text-gray-500">--</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-3 justify-end">
                          <button
                            onClick={() => handleEditClick(giveaway)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Modifier"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(giveaway.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Supprimer"
                          >
                            <FaTrash />
                          </button>
                          {giveaway.status === 'active' && (
                            <button
                              onClick={() => handlePickWinner(giveaway.id)}
                              className="text-yellow-400 hover:text-yellow-300 transition-colors"
                              title="Sélectionner un gagnant"
                            >
                              <FaTrophy />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Sélecteur d'images */}
      {showImageSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-3/4 max-h-3/4 overflow-auto border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-400">Sélectionner une image</h3>
              <button 
                onClick={() => setShowImageSelector(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {availableImages.map((imageUrl, index) => (
                <div 
                  key={index}
                  onClick={() => selectImage(imageUrl)}
                  className="cursor-pointer border border-gray-600 rounded p-2 hover:border-blue-500 transition-colors"
                >
                  <img src={imageUrl} alt={`Image ${index}`} className="h-24 w-full object-contain" />
                </div>
              ))}
            </div>
            {availableImages.length === 0 && (
              <div className="text-center py-4 text-gray-400">Aucune image disponible</div>
            )}
          </div>
        </div>
      )}
      
      {/* Uploader d'images */}
      <div className="mt-8 bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-blue-400">Télécharger une nouvelle image</h3>
        <ZiplineUploader onUploadComplete={(url) => {
          fetchAvailableImages();
          setFormData({ ...formData, imageUrl: url });
        }} />
      </div>
    </AdminLayout>
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
    props: {
      session,
    },
  };
} 