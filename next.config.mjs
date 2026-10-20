/** @type {import('next').NextConfig} */
const nextConfig = {
  // SheetJS is only used server-side to parse the Excel export.
  serverExternalPackages: ["xlsx"],
};

export default nextConfig;
