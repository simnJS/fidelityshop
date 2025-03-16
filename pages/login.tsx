import { useState, useEffect } from 'react';
import { signIn, useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Déconnecter l'utilisateur au chargement de la page login si nécessaire
  useEffect(() => {
    // Si l'utilisateur vient d'être redirigé après une déconnexion, ne pas le déconnecter à nouveau
    if (router.query.callbackUrl && router.query.callbackUrl.includes('signout')) {
      return;
    }
    
    const logout = async () => {
      if (status === 'authenticated') {
        console.log('Déconnexion préventive sur la page login');
        await signOut({ redirect: false });
        // Effacer les cookies manuellement si nécessaire
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.split('=').map(c => c.trim());
          if (name.includes('next-auth')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          }
        });
      }
    };
    
    if (router.query.force === 'true' || router.query.error) {
      logout();
    }
  }, [router.query, status]);

  useEffect(() => {
    if (router.query.registered === 'true') {
      setShowSuccessMessage(true);
    }
  }, [router.query.registered]);

  useEffect(() => {
    // Ne pas rediriger automatiquement si l'utilisateur est sur la page de connexion
    if (status === 'authenticated' && !router.query.force) {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Tentative de connexion avec:', { username: formData.username });
      
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
        callbackUrl: '/dashboard'
      });

      console.log('Résultat de la connexion:', result);

      if (result?.error) {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
      } else if (!result?.ok) {
        setError('Une erreur est survenue lors de la connexion');
      } else {
        // Forcer un rafraîchissement complet pour s'assurer que les cookies sont bien définis
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Connexion</h1>
        
        {showSuccessMessage && (
          <div className="bg-green-500 text-white p-3 rounded mb-4">
            Inscription réussie ! Vous pouvez maintenant vous connecter.
          </div>
        )}
        
        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-300 mb-2">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-gray-400">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-blue-400 hover:text-blue-300">
            S'inscrire
          </Link>
        </div>
      </div>
    </div>
  );
} 