/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    serverActions: { allowedOrigins: ['*'] },
    // ⬇️ Add this to force pdf-parse to run as a Node external
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push({ 'pdf-parse': 'commonjs pdf-parse' });
    return config;
  },
};

export default nextConfig;
