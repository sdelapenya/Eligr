import { router } from "expo-router";

import { isDiscarded } from "@/domain/filters";
import { RentalOption, RentalStatus } from "@/domain/types";
import { FREE_TIER_LIMITS } from "@/store/useEligrStore";
import { showAlert } from "@/utils/alert";

type QuickActionHandlers = {
  setStatus: (id: string, status: RentalStatus) => boolean;
};

export function showRentalQuickActions(option: RentalOption, handlers: QuickActionHandlers) {
  const { setStatus } = handlers;
  const discarded = isDiscarded(option);

  const applyStatus = (status: RentalStatus, label: string) => {
    const ok = setStatus(option.id, status);
    if (ok) return;
    showAlert(
      "Límite alcanzado",
      `No puedes reactivar «${label}». El plan free permite ${FREE_TIER_LIMITS.rentalOptions} opciones activas.`,
    );
  };

  showAlert(option.title, "Acción rápida", [
    { text: "Ver detalle", onPress: () => router.push(`/rental/${option.id}`) },
    { text: "Editar", onPress: () => router.push(`/rental/${option.id}/edit`) },
    ...(discarded
      ? [{ text: "Reactivar", onPress: () => applyStatus("new", option.title) }]
      : [
          { text: "Marcar favorito", onPress: () => applyStatus("favorite", option.title) },
          { text: "Descartar", style: "destructive" as const, onPress: () => applyStatus("discarded", option.title) },
        ]),
    { text: "Cancelar", style: "cancel" as const },
  ]);
}
