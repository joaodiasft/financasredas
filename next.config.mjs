/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 14.1: Prisma fora do bundle do Webpack nas rotas (evita prisma.student undefined em dev).
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "pdf-parse"],
  },
};

export default nextConfig;
