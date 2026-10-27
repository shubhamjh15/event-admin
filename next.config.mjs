/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mongoose", "mongodb-memory-server"],
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
};
export default nextConfig;
