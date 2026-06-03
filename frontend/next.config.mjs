/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    deviceSizes: [320, 420, 640, 750, 828],
    imageSizes: [128, 256, 384],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
