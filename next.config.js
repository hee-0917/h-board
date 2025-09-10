/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // 이 설정을 제거하여 동적 라우팅 활성화
  trailingSlash: true,
  eslint: {
    // 빌드 시 ESLint 오류를 무시
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 빌드 시 TypeScript 오류를 무시
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('next/dist/compiled/source-map')
    }
    return config
  },
  images: {
    unoptimized: true
  },
  // 서버 실행 설정 추가 (deprecated 설정 제거)
  // experimental: {
  //   serverComponentsExternalPackages: [] // Deprecated
  // },
  // 개발 서버 설정
  ...(process.env.NODE_ENV === 'development' && {
    webpack: (config, { dev }) => {
      if (dev) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        }
      }
      return config
    }
  })
}

module.exports = nextConfig
