import { useState, useEffect, useCallback } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ProductImage from '../../components/ProductImage';

// Types pour notre application
interface Product {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  imageUrl?: string;
  inStock: boolean;
  createdAt: string;
  isReward: boolean; // Indique si c'est un produit pour la boutique (true) ou la fidélité (false)
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [filterType, setFilterType] = useState<'all' | 'loyalty' | 'reward'>('all');
  
  // Formulaire pour nouveau produit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    pointsCost: '0',
    isReward: false
  });
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[]>([]);

  // Vérifier l'authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // Vérifier que l'utilisateur est admin (côté client)
  useEffect(() => {
    if (session && !session.user.isAdmin) {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Charger les produits
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products?all=true');
        setProducts(response.data);
      } catch (error: any) {
        console.error('Erreur lors du chargement des produits:', error);
        if (error.response && error.response.status === 401) {
          // Problème d'authentification, rediriger vers la page de connexion
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.isAdmin) {
      fetchProducts();
    } else if (session && !session.user.isAdmin) {
      router.push('/dashboard');
    }
  }, [session, router]);
  
  useEffect(() => {
    const fetchAvailableImages = async () => {
      try {
        const response = await fetch('/api/admin/images');
        if (response.ok) {
          const data = await response.json();
          setAvailableImages(data.images);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des images:', error);
      }
    };

    if (showImageSelector) {
      fetchAvailableImages();
    }
  }, [showImageSelector]);

  const filteredProducts = () => {
    if (filterType === 'all') return products;
    if (filterType === 'loyalty') return products.filter(p => !p.isReward);
    return products.filter(p => p.isReward);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      pointsCost: '0',
      isReward: false
    });
    setEditingProduct(null);
    setFormMode('create');
  };
  
  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl || '',
      pointsCost: product.pointsCost.toString(),
      isReward: product.isReward
    });
    setFormMode('edit');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });
    
    // Validation de base
    if (!formData.name || !formData.description || !formData.pointsCost) {
      setMessage({ type: 'error', content: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }
    
    try {
      if (formMode === 'create') {
        // Créer un nouveau produit
        const response = await axios.post('/api/products', formData);
        setProducts(prev => [response.data, ...prev]);
        setMessage({ type: 'success', content: 'Produit créé avec succès' });
        resetForm();
      } else if (formMode === 'edit' && editingProduct) {
        // Mettre à jour un produit existant
        const response = await axios.put(`/api/products/${editingProduct.id}`, formData);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? response.data : p));
        setMessage({ type: 'success', content: 'Produit mis à jour avec succès' });
        resetForm();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du produit:', error);
      setMessage({ type: 'error', content: 'Erreur lors de la sauvegarde du produit' });
    }
  };
  
  const handleToggleStatus = async (product: Product) => {
    try {
      const response = await axios.put(`/api/products/${product.id}/toggle-status`, {});
      setProducts(prev => prev.map(p => p.id === product.id ? response.data : p));
      setMessage({ 
        type: 'success', 
        content: `Le produit a été marqué comme ${response.data.inStock ? 'disponible' : 'indisponible'}`
      });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      setMessage({ type: 'error', content: 'Erreur lors du changement de statut du produit' });
    }
  };
  
  const handleDelete = async (productId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/products/${productId}`);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setMessage({ type: 'success', content: 'Produit supprimé avec succès' });
      if (editingProduct?.id === productId) {
        resetForm();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      setMessage({ type: 'error', content: 'Erreur lors de la suppression du produit' });
    }
  };

  const selectImage = (imageUrl: string) => {
    setFormData({
      ...formData,
      imageUrl
    });
    setShowImageSelector(false);
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
      <h1 className="text-3xl font-bold text-blue-400 mb-8">Administration des Produits</h1>
      
      {message.content && (
        <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.content}
        </div>
      )}
      
      {/* Formulaire de produit */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-400 mb-4">
          {formMode === 'create' ? 'Ajouter un produit' : 'Modifier le produit'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Nom du produit*</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Description*</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">URL de l'image (optionnel)</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowImageSelector(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Galerie
              </button>
              <Link href="/admin/images" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500">
                Upload
              </Link>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Coût en points*</label>
            <input
              type="number"
              name="pointsCost"
              value={formData.pointsCost}
              onChange={handleInputChange}
              min="0"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isReward"
              id="isReward"
              checked={formData.isReward}
              onChange={handleCheckboxChange}
              className="mr-2"
            />
            <label htmlFor="isReward" className="text-gray-300">
              Récompense pour la boutique 
              <span className="text-sm ml-2 text-gray-400">
                (si non coché, c'est un produit pour la fidélité)
              </span>
            </label>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {formMode === 'create' ? 'Ajouter le produit' : 'Mettre à jour le produit'}
            </button>
            
            {formMode === 'edit' && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Filtres */}
      <div className="mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Filtrer par type de produit</h3>
          <div className="flex space-x-4">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-md ${
                filterType === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Tous les produits
            </button>
            <button 
              onClick={() => setFilterType('loyalty')}
              className={`px-4 py-2 rounded-md ${
                filterType === 'loyalty' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Produits de fidélité
            </button>
            <button 
              onClick={() => setFilterType('reward')}
              className={`px-4 py-2 rounded-md ${
                filterType === 'reward' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Récompenses (boutique)
            </button>
          </div>
        </div>
      </div>
      
      {/* Liste des produits */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-blue-400 mb-4">
          {filterType === 'all' ? 'Tous les produits' : 
           filterType === 'loyalty' ? 'Produits de fidélité' : 'Récompenses (boutique)'}
        </h2>
        
        {filteredProducts().length === 0 ? (
          <p className="text-gray-300">Aucun produit n'a été créé pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-gray-300">Image</th>
                  <th className="px-4 py-2 text-gray-300">Nom</th>
                  <th className="px-4 py-2 text-gray-300">Description</th>
                  <th className="px-4 py-2 text-gray-300">Points</th>
                  <th className="px-4 py-2 text-gray-300">Type</th>
                  <th className="px-4 py-2 text-gray-300">Statut</th>
                  <th className="px-4 py-2 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts().map(product => (
                  <tr key={product.id} className="border-t border-gray-700">
                    <td className="px-4 py-2" style={{ width: '80px', height: '80px', position: 'relative' }}>
                      {product.imageUrl ? (
                        <div className="relative h-16 w-16">
                          <ProductImage 
                            imageUrl={product.imageUrl} 
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 bg-gray-700 flex items-center justify-center rounded">
                          <span className="text-xs text-gray-400">Pas d'image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-300">{product.name}</td>
                    <td className="px-4 py-2 text-gray-300">
                      {product.description.length > 50 
                        ? `${product.description.substring(0, 50)}...` 
                        : product.description}
                    </td>
                    <td className="px-4 py-2 text-gray-300">{product.pointsCost}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        product.isReward ? 'bg-purple-500 text-white' : 'bg-yellow-500 text-white'
                      }`}>
                        {product.isReward ? 'Récompense' : 'Fidélité'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        product.inStock ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {product.inStock ? 'Disponible' : 'Indisponible'}
                      </span>
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`${
                          product.inStock ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                        } text-white text-xs py-1 px-2 rounded`}
                      >
                        {product.inStock ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de sélection d'image */}
      {showImageSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Sélectionner une image</h3>
              <button 
                onClick={() => setShowImageSelector(false)}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {availableImages.length === 0 ? (
              <p className="text-gray-400">Aucune image disponible. Veuillez en uploader via la page d'administration des images.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {availableImages.map((imageUrl, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-square cursor-pointer border border-gray-700 hover:border-blue-500 rounded-lg overflow-hidden"
                    onClick={() => selectImage(imageUrl)}
                  >
                    <Image
                      src={imageUrl}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowImageSelector(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Annuler
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