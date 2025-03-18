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

  // Configure output options
  output: 'standalone', // Creates a standalone build optimized for production

  images: {
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
    // Set up output directory for the static files
    outputFileTracingRoot:
      process.env.NODE_ENV === 'production' ? undefined : process.cwd(),
  },

  webpack(config) {
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
