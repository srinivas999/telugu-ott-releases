/** @type {import('next').NextConfig} */
const isGitHubDeploy = process.env.IS_GITHUB_DEPLOY === 'true';

const nextConfig = {
  ...(isGitHubDeploy && { output: 'export' }),
  ...(isGitHubDeploy && { basePath: '/telugu-ott-releases' }),
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
