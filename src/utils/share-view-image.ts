import * as Sharing from "expo-sharing";
import { Platform, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import type { RefObject } from "react";

import { ShareReportResult } from "@/utils/share-report";

export async function shareViewCapture(ref: RefObject<View | null>, dialogTitle: string): Promise<ShareReportResult> {
  if (Platform.OS === "web") return "unavailable";

  try {
    if (!ref.current) return "error";

    const uri = await captureRef(ref, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) return "unavailable";

    await Sharing.shareAsync(uri, {
      mimeType: "image/png",
      dialogTitle,
      UTI: "public.png",
    });
    return "shared";
  } catch {
    return "error";
  }
}
