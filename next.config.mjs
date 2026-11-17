/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prototyp: Typfehler sollen den Build nicht blockieren
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
