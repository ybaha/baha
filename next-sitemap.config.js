/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://baha.vercel.app",
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 7000,
  additionalPaths: async (config) => {
    const result = [];

    // Add writing pages
    result.push({
      loc: "/writing",
      changefreq: "daily",
      priority: 0.8,
    });

    // Add vault pages
    result.push({
      loc: "/vault",
      changefreq: "daily",
      priority: 0.8,
    });

    return result;
  },
};
