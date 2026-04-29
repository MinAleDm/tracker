/** @type {import('next').NextConfig} Русская подсказка для редактора. */
const nextConfig = {
  typedRoutes: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["@tracker/types", "@tracker/ui"],
};

module.exports = nextConfig;
