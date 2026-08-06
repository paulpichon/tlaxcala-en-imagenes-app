import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Permitir imagenes de Cloudinary
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME}/**`, // tu carpeta en Cloudinary
      },
    ],
  },
};

export default nextConfig;
