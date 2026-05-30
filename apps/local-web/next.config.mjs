/** @type {import('next').NextConfig} */
const config = {
  // Transpile internal workspace packages
  transpilePackages: ['@private-pdf/pdf-core', '@private-pdf/shared-types'],

  // No external image domains — all assets are local
  images: {
    remotePatterns: [],
  },
}

export default config
