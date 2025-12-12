// next.config.cjs - Updated configuration
const nextConfig = {
  // ... existing config ...

  experimental: process.env.NODE_ENV === 'production' ? { instrumentationHook: true } : {},

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.firebasestorage.app', pathname: '/**' },
      // ... other patterns ...
    ],
    // ... rest of image config ...
  },

  // ... rest of config ...
};

module.exports = nextConfig;
