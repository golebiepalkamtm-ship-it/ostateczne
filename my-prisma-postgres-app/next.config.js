/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack jest teraz domyślny w Next.js 15, aby wyłączyć użyj --turbo=false przy uruchomieniu
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
