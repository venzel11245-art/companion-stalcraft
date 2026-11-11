/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['recharts'],
  },
  allowedDevOrigins: ['10.224.112.160', 'localhost', '127.0.0.1'],
}

module.exports = nextConfig