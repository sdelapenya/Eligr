import { usePrioritiesUiStore } from "@/store/prioritiesUiStore";
import { useEligrStore } from "@/store/useEligrStore";
import { showAlert } from "@/utils/alert";

export function confirmPrioritiesLeave(onLeave: () => void) {
  const { isDirty, draft, clearPrioritiesUi } = usePrioritiesUiStore.getState();
  const updatePriorities = useEligrStore.getState().updatePriorities;
  if (!isDirty || !draft) {
    onLeave();
    return;
  }
  showAlert("Cambios sin guardar", "¿Qué quieres hacer con los pesos de prioridades?", [
    { text: "Cancelar", style: "cancel" },
    {
      text: "Descartar",
      style: "destructive",
      onPress: () => {
        clearPrioritiesUi();
        onLeave();
      },
    },
    {
      text: "Guardar",
      onPress: () => {
        updatePriorities(draft);
        clearPrioritiesUi();
        onLeave();
      },
    },
  ]);
}
