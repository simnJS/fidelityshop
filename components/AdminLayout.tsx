import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaUsers, FaShoppingBag, FaReceipt, FaHome, FaSignOutAlt, FaImages, FaGift } from 'react-icons/fa';
import { signOut } from 'next-auth/react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  
  // Vérifier le chemin actif pour le style de navigation
  const isActive = (path: string) => {
    return router.pathname === path ? 'bg-gray-800 font-bold border-l-4 border-yellow-400' : '';
  };

  const handleSignOut = async () => {
    try {
      // Afficher un message pour informer l'utilisateur que la déconnexion est en cours
      console.log('Déconnexion en cours...');
      
      // Essayer de se déconnecter via next-auth
      const result = await signOut({ 
        redirect: false
      });
      
      console.log('Résultat de la déconnexion admin:', result);
      
      // Effacer manuellement les cookies liés à l'authentification
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=').map(c => c.trim());
        if (name.includes('next-auth')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          console.log(`Cookie effacé: ${name}`);
        }
      });
      
      // Rediriger vers la page de connexion avec un paramètre from pour indiquer la source
      window.location.href = '/login?from=signout';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // En cas d'erreur, forcer une redirection vers la page de connexion
      window.location.href = '/login?from=signout&error=true';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Barre latérale */}
      <aside className="w-64 bg-gray-900 text-gray-100 shadow-xl">
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <h1 className="text-xl font-bold text-white">Administration</h1>
        </div>
        <nav className="mt-4">
          <ul>
            <li>
              <Link href="/dashboard" className={`flex items-center px-4 py-3 hover:bg-gray-800 transition-colors duration-200 ${isActive('/dashboard')}`}>
                <FaHome className="mr-3 text-yellow-400" />
                <span>Tableau de bord</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className={`flex items-center px-4 py-3 hover:bg-gray-800 transition-colors duration-200 ${isActive('/admin/users')}`}>
                <FaUsers className="mr-3 text-yellow-400" />
                <span>Utilisateurs</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/products" className={`flex items-center px-4 py-3 hover:bg-gray-800 transition-colors duration-200 ${isActive('/admin/products')}`}>
                <FaShoppingBag className="mr-3 text-yellow-400" />
                <span>Produits</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/cdn-images" className={`flex items-center px-4 py-3 hover:bg-gray-800 transition-colors duration-200 ${isActive('/admin/cdn-images')}`}>
                <FaImages className="mr-3 text-yellow-400" />
                <span>Images (CDN)</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/giveaways" className={`flex items-center px-4 py-3 hover:bg-gray-800 transition-colors duration-200 ${isActive('/admin/giveaways')}`}>
                <FaGift className="mr-3 text-yellow-400" />
                <span>Giveaways</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/receipts" className={`flex items-center px-4 py-3 hover:bg-gray-800 transition-colors duration-200 ${isActive('/admin/receipts')}`}>
                <FaReceipt className="mr-3 text-yellow-400" />
                <span>Reçus</span>
              </Link>
            </li>
          </ul>
          <div className="absolute bottom-0 left-0 w-64 border-t border-gray-700 bg-gray-900">
            <button 
              onClick={handleSignOut}
              className="flex items-center px-4 py-3 w-full text-left hover:bg-gray-800 text-gray-100 transition-colors duration-200"
            >
              <FaSignOutAlt className="mr-3 text-red-400" />
              <span>Déconnexion</span>
            </button>
          </div>
        </nav>
      </aside>
      
      {/* Contenu principal */}
      <main className="flex-grow">
        <header className="bg-white shadow-md">
          <div className="p-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Panneau d'administration</h2>
            <div className="text-sm text-gray-700">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 