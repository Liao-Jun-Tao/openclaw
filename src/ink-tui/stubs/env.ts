export const env = {
  isTest: false,
  isDev: process.env.NODE_ENV === "development",
  isCI: Boolean(process.env.CI),
  terminal: process.env.TERM ?? "",
  platform: process.platform,
};
