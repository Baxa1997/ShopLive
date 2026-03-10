import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/blog': ['./src/content/blog/**/*'],
    '/api/blog/[slug]': ['./src/content/blog/**/*'],
    '/sitemap.xml': ['./src/content/blog/**/*'],
  },
};

export default nextConfig;
