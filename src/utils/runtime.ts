import Constants, { ExecutionEnvironment } from "expo-constants";

export function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

export function supportsNativeModules() {
  return !isExpoGo();
}
