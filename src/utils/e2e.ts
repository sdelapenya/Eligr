import Constants from "expo-constants";

export const isE2eMode =
  process.env.EXPO_PUBLIC_ELIGR_E2E === "1" || Constants.expoConfig?.extra?.eligrE2e === true;

export const isE2eExpressJourneyMode =
  process.env.EXPO_PUBLIC_ELIGR_E2E_EXPRESS === "1" || Constants.expoConfig?.extra?.eligrE2eExpress === true;
