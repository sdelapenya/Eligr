import { Platform } from "react-native";

import { isExpoGo } from "@/utils/runtime";

const CHANNEL_ID = "visit-reminders";

type NotificationsModule = typeof import("expo-notifications");

let notificationsModule: NotificationsModule | null | undefined;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (notificationsModule !== undefined) return notificationsModule;
  if (Platform.OS === "web" || isExpoGo()) {
    notificationsModule = null;
    return null;
  }
  try {
    notificationsModule = await import("expo-notifications");
    return notificationsModule;
  } catch {
    notificationsModule = null;
    return null;
  }
}

export function visitReminderId(optionId: string, slot: "soon" | "day") {
  return `visit-debrief-${optionId}-${slot}`;
}

export async function configureVisitNotifications() {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Recordatorios de visita",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180],
    });
  }
}

export async function ensureVisitReminderPermissions(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleVisitDebriefReminders(optionId: string, optionTitle: string) {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  const granted = await ensureVisitReminderPermissions();
  if (!granted) return false;

  await configureVisitNotifications();
  await cancelVisitDebriefReminders(optionId);

  const title = optionTitle.trim() || "tu visita";

  await Notifications.scheduleNotificationAsync({
    identifier: visitReminderId(optionId, "soon"),
    content: {
      title: "¿Cómo fue la visita?",
      body: `Registra «${title}» en menos de 1 minuto con Eligr.`,
      data: { rentalId: optionId, kind: "visit-debrief" },
      ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2 * 60 * 60,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: visitReminderId(optionId, "day"),
    content: {
      title: "Visita sin registrar",
      body: `Aún puedes anotar impresiones de «${title}» antes de que se enfríen.`,
      data: { rentalId: optionId, kind: "visit-debrief" },
      ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 24 * 60 * 60,
    },
  });

  return true;
}

export async function cancelVisitDebriefReminders(optionId: string) {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(visitReminderId(optionId, "soon"));
  await Notifications.cancelScheduledNotificationAsync(visitReminderId(optionId, "day"));
}

type PlannedVisit = {
  id: string;
  title: string;
  status: string;
};

export async function syncAllVisitReminders(options: PlannedVisit[], enabled: boolean) {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await configureVisitNotifications();
  for (const option of options) {
    if (!enabled || option.status !== "visit_planned") {
      await cancelVisitDebriefReminders(option.id);
      continue;
    }
    await scheduleVisitDebriefReminders(option.id, option.title);
  }
}
