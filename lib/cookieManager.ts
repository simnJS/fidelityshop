interface CookieOptions {
  path?: string;
  domain?: string;
  expires?: Date | number | string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Vérifie si le consentement aux cookies a été donné
 * @param {string} type - Type de cookies ('all' ou 'essential')
 * @returns {boolean} - Vrai si le consentement a été donné pour ce type
 */
export const hasConsent = (type: 'all' | 'essential' | 'any'): boolean => {
  if (typeof window === 'undefined') return false;
  
  const consent = localStorage.getItem('cookieConsent');
  
  if (type === 'any') {
    return !!consent;
  }
  
  if (type === 'essential') {
    return !!consent; // Les cookies essentiels sont toujours acceptés
  }
  
  if (type === 'all') {
    return consent === 'all';
  }
  
  return false;
};

/**
 * Définit un cookie uniquement si le consentement est accordé
 * @param {string} name - Nom du cookie
 * @param {string} value - Valeur du cookie
 * @param {object} options - Options du cookie
 * @param {boolean} isEssential - Si le cookie est essentiel (true) ou analytique (false)
 */
export const setCookieWithConsent = (
  name: string,
  value: string,
  options: CookieOptions = {},
  isEssential: boolean = false
): boolean => {
  // Vérifier le consentement
  const consentLevel = localStorage.getItem('cookieConsent');
  
  // Si aucun consentement n'a été donné, ou si le cookie n'est pas essentiel et que 
  // seuls les cookies essentiels sont acceptés, ne pas définir le cookie
  if (!consentLevel || (!isEssential && consentLevel !== 'all')) {
    return false;
  }
  
  // Préparer les parties du cookie
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  // Ajouter les options
  if (options.path) {
    cookieString += `; path=${options.path}`;
  }
  
  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }
  
  if (options.expires) {
    const expiryDate = typeof options.expires === 'object' 
      ? options.expires.toUTCString() 
      : options.expires;
    cookieString += `; expires=${expiryDate}`;
  }
  
  if (options.secure) {
    cookieString += '; secure';
  }
  
  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }
  
  // Définir le cookie
  document.cookie = cookieString;
  return true;
};

/**
 * Obtient la valeur d'un cookie
 * @param {string} name - Nom du cookie
 * @returns {string|null} - Valeur du cookie ou null s'il n'existe pas
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    // Le cookie commence-t-il par le nom que nous recherchons?
    if (cookie.substring(0, name.length + 1) === (name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
};

/**
 * Supprime un cookie
 * @param {string} name - Nom du cookie à supprimer
 * @param {object} options - Options du cookie (path, domain)
 */
export const deleteCookie = (name: string, options: CookieOptions = {}): void => {
  // Définir une date d'expiration dans le passé
  const pastDate = new Date(0);
  
  // Fusionner les options avec l'expiration dans le passé
  const deleteOptions = {
    ...options,
    expires: pastDate.toUTCString()
  };
  
  // Utiliser setCookieWithConsent avec la valeur vide
  setCookieWithConsent(name, '', deleteOptions, true);
};

/**
 * Renvoie tous les cookies analytiques pour respecter le choix de l'utilisateur
 */
export const cleanAnalyticsCookies = (): void => {
  const consentLevel = localStorage.getItem('cookieConsent');
  
  // Si l'utilisateur n'a consenti qu'aux cookies essentiels, supprimer tous les cookies analytiques
  if (consentLevel === 'essential') {
    // Liste des préfixes de cookies analytiques connus (à compléter selon les services utilisés)
    const analyticsCookiePrefixes = ['_ga', '_gid', '_gat', '__utma', '__utmb', '__utmc', '__utmt', '__utmz'];
    
    // Obtenir tous les cookies
    const allCookies = document.cookie.split(';');
    
    // Parcourir tous les cookies
    for (let i = 0; i < allCookies.length; i++) {
      const cookie = allCookies[i].trim();
      const cookieName = cookie.split('=')[0].trim();
      
      // Vérifier si le cookie commence par un préfixe analytique
      for (const prefix of analyticsCookiePrefixes) {
        if (cookieName.startsWith(prefix)) {
          deleteCookie(cookieName);
          break;
        }
      }
    }
  }
}; 