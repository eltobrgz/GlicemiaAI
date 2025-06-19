
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rnblscpnhltqcgwsiobb.supabase.co', // CONFIRME SE ESTE É O HOSTNAME CORRETO DO SEU PROJETO SUPABASE
        port: '',
        pathname: '/storage/v1/object/public/**',    // Permite imagens de qualquer bucket público
      }
    ],
  },
};

export default nextConfig;
