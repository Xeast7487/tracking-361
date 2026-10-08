import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverBodySizeLimit: '15mb',
  },
  webpack(config) {
    config.resolve.alias = { ...config.resolve.alias, '@': resolve(__dirname, 'src') }
    return config
  },
}
export default nextConfig
