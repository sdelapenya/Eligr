import { buildCollaborationInviteShortMessage } from "@/domain/collaboration";
import { RentalSearch } from "@/domain/types";
import { shareContent } from "@/utils/share-content";

export async function shareCollaborationPack(search: RentalSearch, exportBackupJson: () => string) {
  await shareContent({
    message: buildCollaborationInviteShortMessage(search),
    title: "Comparar piso juntos — Eligr",
  });
  await shareContent({
    message: exportBackupJson(),
    title: "Backup Eligr",
  });
}
