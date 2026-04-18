/** @type {import('next').NextConfig} */
const isGitHubDeploy = process.env.IS_GITHUB_DEPLOY === 'true';
const useGitHubPagesSubdirectory = process.env.USE_GITHUB_PAGES_SUBDIRECTORY === 'true';

const nextConfig = {
  ...(isGitHubDeploy && { output: 'export' }),
  ...(isGitHubDeploy && useGitHubPagesSubdirectory && { basePath: '/telugu-ott-releases' }),
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
