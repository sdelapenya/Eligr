import { Href, router } from "expo-router";
import { useEffect } from "react";
import { InteractionManager, Platform } from "react-native";

import { useEligrStore } from "@/store/useEligrStore";
import { isExpoGo } from "@/utils/runtime";

export function NotificationBootstrap() {
  const hydrated = useEligrStore((state) => state._hasHydrated);

  useEffect(() => {
    if (!hydrated || Platform.OS === "web" || isExpoGo()) return;

    let removeListener: (() => void) | undefined;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(async () => {
        if (cancelled) return;
        try {
          const Notifications = await import("expo-notifications");
          if (cancelled) return;

          const sub = Notifications.addNotificationResponseReceivedListener((response) => {
            const rentalId = response.notification.request.content.data?.rentalId;
            if (typeof rentalId === "string" && rentalId.length > 0) {
              router.push(`/visit/${rentalId}` as Href);
            }
          });
          removeListener = () => sub.remove();
        } catch {
          // Sin módulo nativo o runtime aún no listo: la app sigue sin deep links de notificación.
        }
      }, 2500);
    });

    return () => {
      cancelled = true;
      task.cancel();
      if (timer) clearTimeout(timer);
      removeListener?.();
    };
  }, [hydrated]);

  return null;
}
