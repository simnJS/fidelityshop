import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si c'est une requête pour une image dans /uploads
  if (pathname.startsWith('/uploads/')) {
    // Pas de redirection, mais s'assurer que les en-têtes CORS sont corrects
    const response = NextResponse.next();
    
    // Ajouter les en-têtes CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Ajouter des en-têtes de cache pour les images
    response.headers.set('Cache-Control', 'public, max-age=86400'); // Cache d'un jour
    
    return response;
  }

  // Pour toutes les autres requêtes, continuer normalement
  return NextResponse.next();
}

export const config = {
  matcher: ['/uploads/:path*'],
}; 