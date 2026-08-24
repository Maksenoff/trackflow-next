import { readFileSync } from 'node:fs'
import withPWAInit from 'next-pwa'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)))

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  importScripts: ['/push-sw.js'],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  images: {
    // Photos/bannières athlète : uploadées en direct vers Vercel Blob (voir
    // app/api/upload/route.ts) — nécessaire pour que next/image accepte ces
    // URLs distantes. picsum.photos reste utilisé par le seed de dev.
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
}

export default withPWA(nextConfig)
