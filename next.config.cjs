const path = require('path');

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  generateEtags: false,
  poweredByHeader: false,
  output: 'standalone',

  typescript: { ignoreBuildErrors: true },



  // Disable instrumentationHook during build to avoid requiring optional OpenTelemetry modules
  experimental: {},

  ...(process.env.NODE_ENV === 'development' && {
    generateBuildId: () => 'dev-build-stable',
    logging: { fetches: { fullUrl: true } },
  }),

  compress: process.env.NODE_ENV === 'production',

  async redirects() {
    const redirects = [
      { source: '/metrics', destination: '/api/metrics', permanent: false },
    ];
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      redirects.push({
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://:path*',
        permanent: true,
      });
    }
    return redirects;
  },

  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-hashes' https://js.sentry-cdn.com https://www.googletagmanager.com",
      "script-src-attr 'unsafe-hashes'",
      "script-src-elem 'self' 'unsafe-inline' https://js.sentry-cdn.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com https://cdnjs.cloudflare.com",
      "style-src-elem 'self' 'unsafe-inline' fonts.googleapis.com https://cdnjs.cloudflare.com",
      "img-src 'self' data: blob: https://storage.googleapis.com https://firebasestorage.googleapis.com",
      "connect-src 'self' https://sentry.io https://pigeon-4fba2.firebaseapp.com https://storage.googleapis.com https://palkamtm.pl https://palkamtm.pl/api/metrics https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://firebasestorage.googleapis.com https://firebaseinstallations.googleapis.com https://*.googleapis.com https://*.google-analytics.com https://region1.google-analytics.com https://www.google-analytics.com https://googletagmanager.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
      "worker-src 'self' blob:",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
      "child-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join('; ')

    const headers = [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), fullscreen=self' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: csp },
          // Headers for Firebase Auth popup compatibility
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
    ];
    if (process.env.NODE_ENV === 'development') {
      headers.push({
        source: '/(.*)',
        headers: [{ key: 'Strict-Transport-Security', value: 'max-age=0' }],
      });
    }
    return headers;
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/pigeon-aucion-a722b.firebasestorage.app/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.firebasestorage.app', pathname: '/**' },
      { protocol: 'https', hostname: 'pigeon-aucion-a722b.firebasestorage.app', pathname: '/**' },
      { protocol: 'https', hostname: 'palkamtm.pl', pathname: '/**' },
      { protocol: 'https', hostname: 'www.palkamtm.pl', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.pixabay.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.buymeacoffee.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.us-east4.hosted.app', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 90],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Nie ustawiaj globalnie unoptimized, pozwól Next optymalizować obrazy
  },
};

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: { cacheName: 'google-fonts' },
    },
    {
      urlPattern: /^\/_next\/image\?/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'next-image' },
    },
    {
      urlPattern: /^\/api\/.*$/i,
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
      },
    },
  ],
});

const isPhaseProductionBuild = process.env.NEXT_PHASE === 'phase-production-build'

let nextConfig = withPWA(baseConfig);

nextConfig.webpack = (config, options) => {
  const webpack = require('webpack');
  const path = require('path');

  // Exclude --template folder from compilation
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    '--template': false,
  };

  if (options.dev || isPhaseProductionBuild) {
    config.plugins = [
      ...(config.plugins || []),
      new webpack.IgnorePlugin({ resourceRegExp: /@prisma\/instrumentation/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /require-in-the-middle/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@opentelemetry\/instrumentation/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /@sentry\/node\/.*\/integrations\/tracing\/(prisma|postgresjs)/ }),
    ];

    config.resolve.alias = {
      ...config.resolve.alias,
      '@/lib/sentry-helpers': path.resolve(__dirname, 'lib/stubs/sentry-helpers-stub.ts'),
      '@sentry/nextjs': path.resolve(__dirname, 'lib/stubs/sentry-stub.ts'),
      '@sentry/node': path.resolve(__dirname, 'lib/stubs/sentry-stub.ts'),
      '@prisma/instrumentation': path.resolve(__dirname, 'lib/stubs/prisma-instrumentation-stub.ts'),
      'require-in-the-middle': path.resolve(__dirname, 'lib/stubs/require-in-the-middle-stub.ts'),
      '@opentelemetry/instrumentation': path.resolve(__dirname, 'lib/stubs/opentelemetry-instrumentation-stub.ts'),
      '@opentelemetry/instrumentation-http': path.resolve(__dirname, 'lib/stubs/opentelemetry-instrumentation-stub.ts'),
    };
  }

  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    { module: /@prisma\/instrumentation/ },
    { module: /require-in-the-middle/ },
    { module: /@opentelemetry\/instrumentation/ },
    { module: /@sentry\/node/ },
    { message: /Critical dependency/ },
    (warning) => warning.module?.resource?.includes('node_modules') &&
      (warning.message?.includes('Critical dependency') || warning.message?.includes('require function is used')),
  ];

  config.plugins = [
    ...(config.plugins || []),
    new webpack.IgnorePlugin({ resourceRegExp: /require-in-the-middle/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /@opentelemetry\/instrumentation/ }),
  ];

  config.stats = {
    ...config.stats,
    warningsFilter: [/Critical dependency/, /require function is used/, /@prisma\/instrumentation/, /require-in-the-middle/, /@opentelemetry\/instrumentation/, /@sentry\/node/],
  };

  if (!options.isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    // Prevent server-only modules from being bundled into client code
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'firebase-admin': path.resolve(__dirname, 'lib/stubs/firebase-admin-stub.ts'),
    };
  }

  // Ensure OpenTelemetry instrumentation modules are stubbed during build
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    '@opentelemetry/instrumentation': path.resolve(__dirname, 'lib/stubs/opentelemetry-instrumentation-stub.ts'),
    '@opentelemetry/instrumentation-http': path.resolve(__dirname, 'lib/stubs/opentelemetry-instrumentation-stub.ts'),
  };

  config.externals = [...(config.externals || []), '@prisma/client', 'firebase-admin', 'redis'];

  // Ignore common system swap/page files to avoid Watchpack EINVAL errors on Windows
  try {
    config.watchOptions = config.watchOptions || {}
    config.watchOptions.ignored = [
      ...(config.watchOptions.ignored || []),
      /(^|[\\/])node_modules([\\/]|$)/,
      /(^|[\\/])C:[\\/](?:pagefile|swapfile)\.sys$/i,
      /(^|[\\/])--template([\\/]|$)/, // Ignore template folder
    ]
  } catch {
    // ignore
  }

  // Exclude --template folder from build
  if (config.module && config.module.rules) {
    config.module.rules.push({
      test: /--template/,
      use: 'ignore-loader'
    });
  }

  return config;
};



module.exports = nextConfig;
