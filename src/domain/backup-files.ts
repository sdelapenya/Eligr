import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export async function exportBackupToFile(json: string): Promise<"shared" | "unavailable"> {
  const directory = FileSystem.cacheDirectory;
  if (!directory) return "unavailable";
  const path = `${directory}eligr-backup-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(path, json);
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return "unavailable";
  await Sharing.shareAsync(path, {
    mimeType: "application/json",
    dialogTitle: "Guardar backup Eligr",
    UTI: "public.json",
  });
  return "shared";
}

export async function pickBackupFileContent(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return FileSystem.readAsStringAsync(result.assets[0].uri);
}
