/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false,
      }
    }
    config.resolve.extensions = [".js", ".jsx", ".ts", ".tsx"]
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sfsvoggbcbiysulsgdqp.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
}

module.exports = nextConfig
