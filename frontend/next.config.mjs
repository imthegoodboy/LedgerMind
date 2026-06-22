import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: appRoot,
  },
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@terminal3/t3n-sdk/dist/wasm/generated/session.core.wasm"],
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
