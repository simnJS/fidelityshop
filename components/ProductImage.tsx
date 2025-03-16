import React, { useState } from 'react';
import Image from 'next/image';

interface ProductImageProps {
  imageUrl?: string | null;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
}

export default function ProductImage({
  imageUrl,
  alt,
  width = 300,
  height = 300,
  fill = false,
  className = 'object-cover'
}: ProductImageProps) {
  const [error, setError] = useState(false);

  // Fonction pour normaliser les URLs d'images
  const normalizeImageUrl = (url?: string | null): string => {
    if (!url) return '';

    // Si l'URL est déjà absolue, la retourner
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Si l'URL est relative (commence par /), ajouter le domaine
    if (url.startsWith('/')) {
      // Utiliser l'URL du site définie dans les variables d'environnement ou la base actuelle
      const baseUrl = process.env.NEXT_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      return `${baseUrl}${url}`;
    }

    // Si c'est juste un nom de fichier, supposer qu'il se trouve dans /uploads
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/uploads/${url}`;
  };

  if (!imageUrl || error) {
    return (
      <div className={`bg-gray-700 flex items-center justify-center ${fill ? 'w-full h-full' : `w-${width} h-${height}`}`}>
        <span className="text-gray-400 text-sm">Image non disponible</span>
      </div>
    );
  }

  const normalizedUrl = normalizeImageUrl(imageUrl);

  return fill ? (
    <div className="relative w-full h-full">
      <Image
        src={normalizedUrl}
        alt={alt}
        fill={true}
        className={className}
        onError={() => setError(true)}
        unoptimized // Toujours désactiver l'optimisation pour être compatible avec le CDN externe
      />
    </div>
  ) : (
    <Image
      src={normalizedUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
      unoptimized // Toujours désactiver l'optimisation pour être compatible avec le CDN externe
    />
  );
} 