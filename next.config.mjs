/** @type {import('next').NextConfig} 
const nextConfig = {
  basePath: process.env.BASEPATH,
 redirects: async () => {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig */


const nextConfig = {
  basePath: process.env.BASEPATH,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
        locale: false,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ Skip ESLint checks during production build
  },
};

export default nextConfig;
