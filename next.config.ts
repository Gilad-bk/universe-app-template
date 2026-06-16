/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // allow all origins to access the API for now
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-org-id, ngrok-skip-browser-warning" },
        ]
      }
    ]
  }
};

export default nextConfig;