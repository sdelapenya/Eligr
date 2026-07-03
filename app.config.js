const appJson = require("./app.json");
const pkg = require("./package.json");

module.exports = {
  expo: {
    ...appJson.expo,
    version: pkg.version,
    android: {
      ...appJson.expo.android,
      versionCode: appJson.expo.android?.versionCode ?? 1,
    },
    extra: {
      ...(appJson.expo.extra ?? {}),
      eligrE2e: process.env.EXPO_PUBLIC_ELIGR_E2E === "1",
      eligrE2eExpress: process.env.EXPO_PUBLIC_ELIGR_E2E_EXPRESS === "1",
    },
  },
};
