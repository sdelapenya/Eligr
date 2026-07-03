import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

import { showAlert } from "@/utils/alert";
import { persistRentalPhotoUri } from "@/utils/rental-photo";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";
import { radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type RentalPhotoPickerProps = {
  value?: string;
  onChange: (uri?: string) => void;
};

export function RentalPhotoPicker({ value, onChange }: RentalPhotoPickerProps) {
  const { colors } = useThemeColors();
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    if (saving) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert("Permiso necesario", "Activa el acceso a fotos para añadir una imagen del anuncio.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setSaving(true);
      try {
        const persistedUri = await persistRentalPhotoUri(result.assets[0].uri);
        if (!persistedUri) {
          showAlert("Error", "No se pudo guardar la foto. Inténtalo de nuevo.");
          return;
        }
        onChange(persistedUri);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <View style={styles.wrap}>
      <Text variant="caption">Foto del anuncio (opcional)</Text>
      {value ? (
        <Pressable onPress={pickPhoto} accessibilityRole="imagebutton" accessibilityLabel="Cambiar foto del anuncio">
          <Image source={{ uri: value }} style={[styles.preview, { borderColor: colors.border }]} resizeMode="cover" />
        </Pressable>
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Text variant="caption">Sin foto</Text>
        </View>
      )}
      <View style={styles.actions}>
        <Button
          label={saving ? "Guardando…" : value ? "Cambiar foto" : "Añadir foto"}
          variant="secondary"
          icon="image-outline"
          onPress={pickPhoto}
          disabled={saving}
        />
        {value ? <Button label="Quitar" variant="ghost" onPress={() => onChange(undefined)} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  preview: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 180,
    width: "100%",
  },
  placeholder: {
    alignItems: "center",
    borderRadius: radius.md,
    borderStyle: "dashed",
    borderWidth: 1,
    height: 120,
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
