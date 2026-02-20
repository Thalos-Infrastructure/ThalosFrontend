import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      pino: path.resolve(__dirname, "lib", "mocks", "pino.js"),
    },
  },
  webpack: (config, { isServer } ) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      pino: path.resolve(__dirname, "lib", "mocks", "pino.js"),
    }
    return config
  },
}

export default nextConfig
