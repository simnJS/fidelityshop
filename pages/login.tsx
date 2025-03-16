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

  // Déconnecter l'utilisateur uniquement lorsqu'il vient explicitement de se déconnecter
  useEffect(() => {
    // Ne déconnecter l'utilisateur que s'il vient d'une action de déconnexion 
    // identifiée par ?from=signout dans l'URL
    if (router.query.from === 'signout') {
      const logout = async () => {
        if (status === 'authenticated') {
          console.log('Déconnexion suite à action utilisateur');
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
      
      logout();
    }
  }, [router.query.from, status]);

  useEffect(() => {
    if (router.query.registered === 'true') {
      setShowSuccessMessage(true);
    }
  }, [router.query.registered]);

  useEffect(() => {
    // Ne rediriger vers le dashboard que si l'utilisateur est authentifié
    // et s'il ne vient pas d'une tentative de déconnexion
    if (status === 'authenticated' && !router.query.from) {
      // Rediriger vers la page demandée si un paramètre redirect est présent
      if (router.query.redirect) {
        console.log('Redirection vers:', router.query.redirect);
        router.push(router.query.redirect as string);
      } else {
        router.push('/dashboard');
      }
    }
  }, [status, router, router.query.from, router.query.redirect]);

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
      
      // Définir la page de redirection après connexion
      const callbackUrl = router.query.redirect ? router.query.redirect as string : '/dashboard';
      
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
        callbackUrl: callbackUrl
      });

      console.log('Résultat de la connexion:', result);

      if (result?.error) {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
      } else if (!result?.ok) {
        setError('Une erreur est survenue lors de la connexion');
      } else {
        // Forcer un rafraîchissement complet pour s'assurer que les cookies sont bien définis
        window.location.href = callbackUrl;
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