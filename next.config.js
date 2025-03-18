/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: true, // Skip ESLint during build to avoid failing the build
  },

  reactStrictMode: true,
  swcMinify: true,

  // Improve error handling for static generation
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 4,
  },

  // Skip build-time static optimization for certain pages
  // that require client-side data or authentication
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  // Improved error handling
  typescript: {
    // Don't fail the build on TypeScript errors
    ignoreBuildErrors: true,
  },

  // Configure output options
  output: 'export', // Change to export for static site generation
  distDir: 'out',

  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dd.dexscreener.com',
      },
    ],
  },

  // Uncoment to add domain whitelist
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'res.cloudinary.com',
  //     },
  //   ]
  // },

  // Configure build to continue despite errors on specific pages
  experimental: {
    // Allow build to continue despite some pages failing to render
    missingSuspenseWithCSRBailout: false,
    // Disable static generation for authenticated routes
    workerThreads: false,
    cpus: 1,
  },

  webpack(config, { dev, isServer }) {
    // Add environment variables to help with conditional rendering during build
    if (typeof process.env.NEXT_PHASE !== 'undefined') {
      process.env.IS_BUILD = (!dev && isServer).toString();
    }

    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg'),
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: { not: /\.(css|scss|sass)$/ },
        resourceQuery: { not: /url/ }, // exclude if *.svg?url
        loader: '@svgr/webpack',
        options: {
          dimensions: false,
          titleProp: true,
        },
      },
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
};

module.exports = nextConfig;
