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
}

export default withPWA(nextConfig)
