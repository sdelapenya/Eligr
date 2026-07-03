import { router } from "expo-router";

import { getActiveOptions } from "@/domain/filters";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SearchForm, SearchFormValues } from "@/components/SearchForm";
import { useEligrStore } from "@/store/useEligrStore";
import { showToast } from "@/store/toastStore";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { spacing } from "@/ui/theme";

function searchNeedsSetup(search: { city: string; destinationLabel: string }) {
  return search.city === "Por definir" || search.destinationLabel === "Por definir";
}

export default function EditSearchScreen() {
  const search = useEligrStore((state) => state.search);
  const rentalOptions = useEligrStore((state) => state.rentalOptions);
  const updateSearch = useEligrStore((state) => state.updateSearch);
  const showSetupHint = searchNeedsSetup(search);
  const activeCount = getActiveOptions(rentalOptions).length;

  const save = (values: SearchFormValues) => {
    updateSearch(values);
    showToast("Búsqueda guardada");
    router.back();
  };

  return (
    <Screen testID="search-edit-screen">
      <ScreenHeader
        eyebrow="Búsqueda"
        title="Define tu búsqueda"
        description="Ciudad, presupuesto y destino del trayecto contextualizan el ranking y el peso del desplazamiento."
      />
      <Button
        label="Volver"
        variant="ghost"
        icon="arrow-back-outline"
        onPress={() => router.back()}
        testID="search-edit-back"
      />
      {showSetupHint ? (
        <Card variant="accent" style={{ gap: spacing.sm }} testID="search-setup-hint">
          <Text variant="subtitle">Completa ciudad y destino</Text>
          <Text>
            El trayecto pesa mucho en el ranking. Indica ciudad y a dónde irías cada día (trabajo, universidad, etc.)
            para que las puntuaciones tengan sentido.
          </Text>
        </Card>
      ) : (
        <Card variant="muted" style={{ gap: spacing.sm }} testID="search-ready-hint">
          <Text variant="subtitle">Búsqueda configurada</Text>
          <Text>
            {activeCount === 0
              ? "Ciudad y destino listos. Añade tu primer anuncio para empezar a comparar."
              : activeCount === 1
                ? "Tienes una opción activa. Cuando visites el piso, registra la impresión para afinar el ranking."
                : `Tienes ${activeCount} opciones activas. Revisa prioridades si cambian tus criterios.`}
          </Text>
          {activeCount === 0 ? (
            <Button
              label="Añadir primer anuncio"
              icon="add-outline"
              onPress={() => router.push("/rental/new")}
              testID="search-go-add"
            />
          ) : activeCount === 1 ? (
            <Button
              label="Registrar visita"
              variant="secondary"
              icon="walk-outline"
              onPress={() => router.push("/visit")}
              testID="search-go-visit"
            />
          ) : (
            <Button
              label="Revisar prioridades"
              variant="secondary"
              icon="options-outline"
              onPress={() => router.push("/priorities")}
              testID="search-go-priorities"
            />
          )}
        </Card>
      )}
      <SearchForm initialValues={search} submitLabel="Guardar búsqueda" onSubmit={save} />
    </Screen>
  );
}
