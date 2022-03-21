/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NAME_JWT_TOKEN: 'nextauth.token',
    NAME_JWT_REFRESH_TOKEN: 'nextauth.refreshToken'
  }
}

module.exports = nextConfig
