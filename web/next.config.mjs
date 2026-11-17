const strapiMediaUrl = new URL(
  process.env.STRAPI_PUBLIC_URL ??
    process.env.STRAPI_URL ??
    "http://127.0.0.1:1337",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    deviceSizes: [320, 420, 640, 750, 828],
    imageSizes: [128, 256, 384],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: strapiMediaUrl.protocol.replace(":", ""),
        hostname: strapiMediaUrl.hostname,
        port: strapiMediaUrl.port,
        pathname: "/uploads/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
