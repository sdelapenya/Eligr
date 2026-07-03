import { isE2eMode } from "@/utils/e2e";

/** Premium preview toggle — solo builds de desarrollo y E2E. */
export const showDevPremiumToggle = __DEV__ || isE2eMode;
