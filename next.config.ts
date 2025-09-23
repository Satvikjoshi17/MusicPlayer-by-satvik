
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,
});


/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // For web workers
    if (!isServer) {
        config.module.rules.push({
            test: /\.worker\.ts$/,
            loader: 'worker-loader',
            options: {
                filename: 'static/chunks/[name].[contenthash].js',
                publicPath: '/_next/',
            },
        });
    }
    return config
  }
};

export default withPWA(nextConfig);
