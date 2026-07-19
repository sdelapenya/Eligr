import { Directory, File, Paths } from "expo-file-system";

const PHOTOS_SUBDIR = "rental-photos";

export function getRentalPhotosDirectoryUri(): string {
  return new Directory(Paths.document, PHOTOS_SUBDIR).uri;
}

export function isPersistedRentalPhotoUri(uri: string): boolean {
  return uri.includes(`/${PHOTOS_SUBDIR}/`);
}

export function deletePersistedPhoto(uri: string | undefined): void {
  if (!uri || !isPersistedRentalPhotoUri(uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Best effort: leaving an orphaned file is preferable to crashing on delete.
  }
}

export async function persistRentalPhotoUri(sourceUri: string): Promise<string | null> {
  if (isPersistedRentalPhotoUri(sourceUri)) return sourceUri;

  try {
    const photosDir = new Directory(Paths.document, PHOTOS_SUBDIR);
    if (!photosDir.exists) {
      photosDir.create({ intermediates: true, idempotent: true });
    }
    const extension = sourceUri.match(/\.(\w+)(?:\?|$)/)?.[1]?.toLowerCase() ?? "jpg";
    const destFile = new File(photosDir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`);
    const srcFile = new File(sourceUri);
    srcFile.copy(destFile);
    return destFile.uri;
  } catch {
    return null;
  }
}
