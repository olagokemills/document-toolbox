/** @type {import('next').NextConfig} */
const config = {
  // Transpile internal workspace packages
  transpilePackages: ['@private-pdf/pdf-core', '@private-pdf/image-core', '@private-pdf/shared-types'],

  // No external image domains — all assets are local
  images: {
    remotePatterns: [],
  },

  experimental: {
    // Keep Node.js-only packages out of the Webpack bundle.
    // These use `node:` URI imports that Webpack 5 doesn't handle;
    // Next.js will require() them at runtime instead of bundling them.
    serverComponentsExternalPackages: [
      'mammoth',
      'pdf-parse',
      'docx',
      'xlsx',
      '@cantoo/pdf-lib',
      'sharp',
      'puppeteer',
    ],
  },

  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '')
        }),
      )
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        os: false,
        path: false,
      }
    }
    return config
  },
}

export default config
