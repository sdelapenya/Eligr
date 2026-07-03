import { Share } from "react-native";

import { showAlert } from "@/utils/alert";

type ShareOptions = Parameters<typeof Share.share>[0];

function isShareCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("cancel") || message.includes("dismiss");
}

export async function shareContent(options: ShareOptions): Promise<void> {
  try {
    const result = await Share.share(options);
    if (result.action === Share.dismissedAction) return;
  } catch (error) {
    if (isShareCancelled(error)) return;
    showAlert("Error", "No se pudo compartir. Inténtalo de nuevo.");
  }
}
