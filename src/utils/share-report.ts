import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export type ShareReportResult = "shared" | "unavailable" | "error";

export async function shareHtmlReport(html: string, basename: string): Promise<ShareReportResult> {
  try {
    const directory = FileSystem.cacheDirectory;
    if (!directory) return "unavailable";

    const safeName = basename.replace(/[^\w.-]+/g, "-").slice(0, 48);
    const path = `${directory}${safeName}-${Date.now()}.html`;
    await FileSystem.writeAsStringAsync(path, html);

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) return "unavailable";

    await Sharing.shareAsync(path, {
      mimeType: "text/html",
      dialogTitle: "Informe Eligr",
      UTI: "public.html",
    });
    return "shared";
  } catch {
    return "error";
  }
}
