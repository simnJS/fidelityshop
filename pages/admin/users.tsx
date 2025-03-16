import React, { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { FaSearch, FaUserEdit, FaKey, FaCoins, FaExclamationTriangle } from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';

interface User {
  id: string;
  username: string;
  points: number;
  minecraftName: string | null;
  discordId: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  receiptsCount: number;
  ordersCount: number;
  purchasesCount: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  imageUrl?: string;
}

interface Receipt {
  id: string;
  createdAt: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  pointsAwarded: number | null;
  product: Product | null;
  userId: string;
  purchases?: Array<{ product: Product }>;
}

interface Order {
  id: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed';
  product: Product;
  userId: string;
  quantity: number;
  totalPoints: number;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

interface UserDetailData extends User {
  receipts: Receipt[];
  orders: Order[];
}

const UsersAdmin: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetailData | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [formState, setFormState] = useState({
    newPassword: '',
    pointsToAdd: 0,
    reason: ''
  });
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAddPointsModalOpen, setIsAddPointsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Rediriger si l'utilisateur n'est pas connecté ou n'est pas un administrateur
    if (status === 'authenticated' && session && !session.user.isAdmin) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user.isAdmin) {
      fetchUsers();
    }
  }, [session, status, currentPage, search]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching users: page=${currentPage}, search=${search}`);
      const response = await fetch(
        `/api/users?page=${currentPage}&limit=10&search=${search}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs');
      }

      const data = await response.json();
      console.log('Pagination data received:', data.pagination);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des détails de l\'utilisateur');
      }

      const data = await response.json();
      setSelectedUser({
        ...data.user,
        receipts: data.receipts || [],
        orders: data.orders || []
      });
      setViewMode('detail');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Réinitialiser la page lors d'une nouvelle recherche
    fetchUsers();
  };

  const resetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    if (formState.newPassword.length < 8) {
      setMessage({ text: 'Le mot de passe doit contenir au moins 8 caractères', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: formState.newPassword }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la réinitialisation du mot de passe');
      }

      const data = await response.json();
      setMessage({ text: data.message || 'Mot de passe réinitialisé avec succès', type: 'success' });
      setFormState({ ...formState, newPassword: '' });
      setIsResetModalOpen(false);
    } catch (err: any) {
      setMessage({ text: err.message || 'Une erreur est survenue', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addPoints = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (formState.pointsToAdd <= 0) {
      setMessage({ text: 'Le nombre de points doit être supérieur à 0', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}/add-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          points: formState.pointsToAdd,
          reason: formState.reason
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout de points');
      }

      const data = await response.json();
      setMessage({ text: data.message || 'Points ajoutés avec succès', type: 'success' });
      
      // Mettre à jour l'utilisateur sélectionné avec le nouveau solde de points
      if (selectedUser) {
        setSelectedUser({ 
          ...selectedUser, 
          points: data.user.points 
        });
      }
      
      setFormState({ ...formState, pointsToAdd: 0, reason: '' });
      setIsAddPointsModalOpen(false);
    } catch (err: any) {
      setMessage({ text: err.message || 'Une erreur est survenue', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const backToList = () => {
    setViewMode('list');
    setSelectedUser(null);
    fetchUsers(); // Rafraîchir la liste pour voir les modifications éventuelles
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'utilisateur');
      }

      const data = await response.json();
      setMessage({ text: data.message || 'Utilisateur supprimé avec succès', type: 'success' });
      
      // Si on était en train de voir les détails de l'utilisateur, revenir à la liste
      if (selectedUser && selectedUser.id === userToDelete) {
        setViewMode('list');
        setSelectedUser(null);
      }
      
      // Rafraîchir la liste des utilisateurs
      fetchUsers();
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      setMessage({ text: err.message || 'Une erreur est survenue', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <AdminLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Gestion des Utilisateurs</h1>
          <div className="flex justify-center">
            <div className="loader">Chargement...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (status === 'unauthenticated' || (session && !session.user.isAdmin)) {
    router.push('/login');
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Gestion des Utilisateurs</h1>
        
        {message && (
          <div 
            className={`mb-6 p-4 rounded-lg shadow-md ${
              message.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 
              message.type === 'warning' ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500' :
              'bg-red-100 text-red-800 border-l-4 border-red-500'
            }`}
          >
            <div className="flex items-center">
              {message.type === 'success' && <div className="mr-3 text-green-500 text-lg">✓</div>}
              {message.type === 'warning' && <FaExclamationTriangle className="mr-3 text-yellow-500" />}
              {message.type === 'error' && <div className="mr-3 text-red-500 text-lg">✕</div>}
              <div className="flex-grow">{message.text}</div>
              <button 
                className="text-gray-600 hover:text-gray-800" 
                onClick={() => setMessage(null)}
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="mr-3 text-red-500 text-lg">✕</div>
              <div className="flex-grow">{error}</div>
              <button 
                className="text-gray-600 hover:text-gray-800" 
                onClick={() => setError(null)}
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {viewMode === 'list' ? (
          <>
            <div className="mb-6">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  className="flex-grow px-4 py-3 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900"
                  placeholder="Rechercher un utilisateur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-yellow-500 text-white px-4 py-3 rounded-r hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  <FaSearch />
                </button>
              </form>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
              <table className="min-w-full">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium text-gray-900 uppercase tracking-wider border-b">Nom d'utilisateur</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-900 uppercase tracking-wider border-b">Nom Minecraft</th>
                    <th className="px-6 py-4 text-right font-medium text-gray-900 uppercase tracking-wider border-b">Points</th>
                    <th className="px-6 py-4 text-center font-medium text-gray-900 uppercase tracking-wider border-b">Reçus</th>
                    <th className="px-6 py-4 text-center font-medium text-gray-900 uppercase tracking-wider border-b">Commandes</th>
                    <th className="px-6 py-4 text-center font-medium text-gray-900 uppercase tracking-wider border-b">Admin</th>
                    <th className="px-6 py-4 text-center font-medium text-gray-900 uppercase tracking-wider border-b">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-600">
                        <div className="flex justify-center">
                          <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="ml-2">Chargement...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-600">Aucun utilisateur trouvé</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{user.username}</td>
                        <td className="px-6 py-4 text-gray-700">{user.minecraftName || '-'}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">{user.points}</td>
                        <td className="px-6 py-4 text-center text-gray-700">{user.receiptsCount}</td>
                        <td className="px-6 py-4 text-center text-gray-700">{user.ordersCount}</td>
                        <td className="px-6 py-4 text-center">
                          {user.isAdmin ? (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              Admin
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => fetchUserDetails(user.id)}
                              className="bg-yellow-500 text-white p-2 rounded-full hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
                              title="Voir les détails"
                            >
                              <FaUserEdit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setUserToDelete(user.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                              title="Supprimer l'utilisateur"
                            >
                              <FaExclamationTriangle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-gray-700">
                  Affichage de {(pagination.page - 1) * pagination.limit + 1} à{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} utilisateurs
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      console.log('Précédent clicked, current page:', currentPage);
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                    }}
                    disabled={pagination.page <= 1}
                    className={`px-5 py-2 rounded ${
                      pagination.page <= 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors'
                    }`}
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => {
                      console.log('Suivant clicked, current page:', currentPage);
                      setCurrentPage((prev) => prev + 1);
                    }}
                    disabled={!pagination.hasMore}
                    className={`px-5 py-2 rounded ${
                      !pagination.hasMore
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors'
                    }`}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          selectedUser && (
            <div>
              <button
                onClick={backToList}
                className="mb-6 px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 flex items-center transition-colors"
              >
                <span className="mr-2">&larr;</span> Retour à la liste
              </button>

              <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-3">Informations de l'utilisateur</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="flex flex-wrap items-center">
                      <span className="w-40 font-semibold text-gray-700">Nom d'utilisateur:</span> 
                      <span className="text-gray-900 font-medium">{selectedUser.username}</span>
                    </p>
                    <p className="flex flex-wrap items-center">
                      <span className="w-40 font-semibold text-gray-700">Nom Minecraft:</span> 
                      <span className="text-gray-900">{selectedUser.minecraftName || '-'}</span>
                    </p>
                    <p className="flex flex-wrap items-center">
                      <span className="w-40 font-semibold text-gray-700">ID Discord:</span> 
                      <span className="text-gray-900">{selectedUser.discordId || '-'}</span>
                    </p>
                    <p className="flex flex-wrap items-center">
                      <span className="w-40 font-semibold text-gray-700">Administrateur:</span> 
                      <span className="text-gray-900">{selectedUser.isAdmin ? 'Oui' : 'Non'}</span>
                    </p>
                  </div>
                  <div className="space-y-4">
                    <p className="flex flex-wrap items-center">
                      <span className="w-40 font-semibold text-gray-700">Points:</span> 
                      <span className="text-gray-900 font-bold text-xl">{selectedUser.points}</span>
                    </p>
                    <p className="flex flex-wrap items-center">
                      <span className="w-40 font-semibold text-gray-700">Créé le:</span> 
                      <span className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                    </p>
                    <p className="flex flex-wrap items-center">
                      <span className="w-40 font-semibold text-gray-700">Dernière mise à jour:</span> 
                      <span className="text-gray-900">{new Date(selectedUser.updatedAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsResetModalOpen(true)}
                    className="bg-orange-500 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                  >
                    <FaKey /> Réinitialiser Mot de Passe
                  </button>
                  <button
                    onClick={() => setIsAddPointsModalOpen(true)}
                    className="bg-green-500 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    <FaCoins /> Ajouter des Points
                  </button>
                  <button
                    onClick={() => {
                      setUserToDelete(selectedUser.id);
                      setIsDeleteModalOpen(true);
                    }}
                    className="bg-red-500 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    <FaExclamationTriangle /> Supprimer l'Utilisateur
                  </button>
                </div>
              </div>

              {/* Section des commandes */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-3">Commandes ({selectedUser.orders?.length || 0})</h2>
                {selectedUser.orders?.length === 0 || !selectedUser.orders ? (
                  <p className="text-gray-600">Aucune commande trouvée</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 text-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium text-gray-900 uppercase tracking-wider border-b">ID</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-900 uppercase tracking-wider border-b">Produit</th>
                          <th className="px-6 py-3 text-right font-medium text-gray-900 uppercase tracking-wider border-b">Points</th>
                          <th className="px-6 py-3 text-center font-medium text-gray-900 uppercase tracking-wider border-b">Statut</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-900 uppercase tracking-wider border-b">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedUser.orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-gray-600">{order.id.substring(0, 8)}...</td>
                            <td className="px-6 py-4 text-gray-900 font-medium">{order.product.name}</td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">{order.product.pointsCost}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status === 'pending' ? 'En attente' :
                                 order.status === 'processing' ? 'En cours' :
                                 order.status === 'completed' ? 'Complété' : 'Annulé'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section des reçus */}
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-3">Reçus ({selectedUser.receipts?.length || 0})</h2>
                {selectedUser.receipts?.length === 0 || !selectedUser.receipts ? (
                  <p className="text-gray-600">Aucun reçu trouvé</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 text-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium text-gray-900 uppercase tracking-wider border-b">ID</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-900 uppercase tracking-wider border-b">Produit(s)</th>
                          <th className="px-6 py-3 text-right font-medium text-gray-900 uppercase tracking-wider border-b">Points</th>
                          <th className="px-6 py-3 text-center font-medium text-gray-900 uppercase tracking-wider border-b">Statut</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-900 uppercase tracking-wider border-b">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedUser.receipts.map((receipt) => (
                          <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-gray-600">{receipt.id.substring(0, 8)}...</td>
                            <td className="px-6 py-4 text-gray-900 font-medium">
                              {receipt.product ? receipt.product.name : 
                               receipt.purchases && receipt.purchases.length > 0 ? 
                               receipt.purchases.map(p => p.product.name).join(', ') : '-'}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                              {receipt.pointsAwarded || 
                               (receipt.product?.pointsCost) || 
                               (receipt.purchases && receipt.purchases.length > 0 ? 
                               receipt.purchases.reduce((sum, p) => sum + p.product.pointsCost, 0) : 0)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                receipt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                receipt.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {receipt.status === 'pending' ? 'En attente' :
                                 receipt.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{new Date(receipt.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* Modal de réinitialisation de mot de passe */}
        {isResetModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-gray-900 border-b pb-3">Réinitialiser le mot de passe</h3>
              <form onSubmit={resetPassword}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">
                    Nouveau mot de passe (min. 8 caractères)
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900"
                    value={formState.newPassword}
                    onChange={(e) => setFormState({ ...formState, newPassword: e.target.value })}
                    minLength={8}
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                    onClick={() => setIsResetModalOpen(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
                    disabled={loading}
                  >
                    {loading ? "Traitement..." : "Réinitialiser"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal d'ajout de points */}
        {isAddPointsModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-gray-900 border-b pb-3">Ajouter des points</h3>
              <form onSubmit={addPoints}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">
                    Nombre de points à ajouter
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    value={formState.pointsToAdd}
                    onChange={(e) => setFormState({ ...formState, pointsToAdd: parseInt(e.target.value) || 0 })}
                    min="1"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">
                    Raison (optionnel)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    value={formState.reason}
                    onChange={(e) => setFormState({ ...formState, reason: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                    onClick={() => setIsAddPointsModalOpen(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    disabled={loading}
                  >
                    {loading ? "Traitement..." : "Ajouter des points"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de suppression d'utilisateur */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-gray-900 border-b pb-3">Confirmer la suppression</h3>
              <div className="mb-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Attention ! Cette action est irréversible. Toutes les données associées à cet utilisateur (commandes, reçus, etc.) seront également supprimées.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setUserToDelete(null);
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={deleteUser}
                  className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  disabled={loading}
                >
                  {loading ? "Suppression..." : "Supprimer définitivement"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UsersAdmin; 