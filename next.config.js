/** @type {import('next').NextConfig} */
const isGitHubDeploy = process.env.IS_GITHUB_DEPLOY === 'true';

const nextConfig = {
  ...(isGitHubDeploy && { output: 'export' }),
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  ...(isGitHubDeploy && { trailingSlash: true }),
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
