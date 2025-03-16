import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  
  // Récupérer l'origine de la requête
  const origin = request.headers.get('origin') || '*';

  // Log pour le débogage
  if (pathname.startsWith('/api/')) {
    console.log(`Middleware: Requête ${request.method} vers ${pathname}`);
    console.log(`Middleware: Origin = ${origin}`);
  }
  
  // Ajouter des en-têtes CORS de base pour toutes les requêtes
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  // Vérifier si c'est une requête pour une image dans /uploads
  if (pathname.startsWith('/uploads/')) {
    // Ajouter les en-têtes CORS spécifiques aux images
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    
    // Ajouter des en-têtes de cache pour les images
    response.headers.set('Cache-Control', 'public, max-age=86400'); // Cache d'un jour
  } 
  // Pour les API, définir des en-têtes CORS plus permissifs
  else if (pathname.startsWith('/api/')) {
    // Pour les API d'authentification, il est crucial d'utiliser l'origine exacte
    if (pathname.startsWith('/api/auth')) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
    
    // Temps maximum pendant lequel les navigateurs peuvent mettre en cache les résultats preflight
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 heures
  }
  
  return response;
}

export const config = {
  matcher: ['/uploads/:path*', '/api/:path*'],
}; 