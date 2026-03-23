const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['node-fetch', 'https-proxy-agent'],
  },
}
module.exports = nextConfig
