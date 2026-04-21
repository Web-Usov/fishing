import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@fishing/api-client', '@fishing/shared-zod', '@fishing/domain-geo', '@fishing/shared-ui'],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      'react-native$': 'react-native-web',
    };

    return config;
  },
};

export default nextConfig;
