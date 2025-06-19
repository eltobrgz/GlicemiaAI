
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
        hostname: 'rnblscpnhltqcgwsiobb.supabase.co', // Your Supabase project hostname
        port: '',
        pathname: '/storage/v1/object/public/**',    // Allows images from any public bucket
      }
    ],
  },
};

export default nextConfig;
