import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: appRoot,
  },
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/@terminal3/t3n-sdk/**",
      "./node_modules/@bytecodealliance/preview2-shim/**",
      "./node_modules/.pnpm/@bytecodealliance+preview2-shim*/**",
    ],
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
