import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  swcMinify: true,
  images: {
    domains: [
      // Vos domaines ici
      'cdn.simnjs.fr',
      'localhost'
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // 24 heures
  },
  // Optimiser le build en webpack
  webpack: (config, { dev, isServer }) => {
    // Seulement pour la production
    if (!dev) {
      // Optimize pour la production uniquement
      config.optimization.minimize = true;
    }

    return config;
  },
  experimental: {
    optimizeCss: true, // Optimiser CSS en production
    optimizeServerReact: true, // Optimiser React côté serveur
  },
};

export default nextConfig;
