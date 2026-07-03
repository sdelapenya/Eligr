import { Alert, Platform } from "react-native";

export function showAlert(title: string, message?: string, buttons?: { text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }[]) {
  if (Platform.OS === "web") {
    const primary = buttons?.find((b) => b.style !== "cancel") ?? buttons?.[0];
    const cancel = buttons?.find((b) => b.style === "cancel");
    const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
    if (confirmed) primary?.onPress?.();
    else cancel?.onPress?.();
    return;
  }
  Alert.alert(title, message, buttons);
}

export function showDestructiveConfirm(title: string, message: string, onConfirm: () => void) {
  showAlert(title, message, [
    { text: "Cancelar", style: "cancel" },
    { text: "Confirmar", style: "destructive", onPress: onConfirm },
  ]);
}
