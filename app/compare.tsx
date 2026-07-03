import { router, useLocalSearchParams } from "expo-router";

import { useEffect, useMemo, useState } from "react";

import { StyleSheet, View } from "react-native";



import { normalizeRouteId } from "@/utils/route";

import { CompareOptionPicker } from "@/components/CompareOptionPicker";

import { ComparePanel } from "@/components/ComparePanel";
import { PartnerOpinionCard } from "@/components/PartnerOpinionCard";

import { EmptyState } from "@/components/EmptyState";

import { ScreenHeader } from "@/components/ScreenHeader";

import { compareRentals } from "@/domain/compare";

import { getActiveOptions, getScoringPool } from "@/domain/filters";

import { RentalOption } from "@/domain/types";

import { buildPairComparisonSummary } from "@/domain/summary";

import { getScoreContext } from "@/domain/score-context";
import { rankRentals } from "@/domain/scoring";

import { useEligrStore } from "@/store/useEligrStore";
import { shareContent } from "@/utils/share-content";

import { Button } from "@/ui/Button";

import { Card } from "@/ui/Card";

import { Screen } from "@/ui/Screen";

import { Text } from "@/ui/Text";

import { spacing } from "@/ui/theme";



function pickActiveId(candidate: string | undefined, activeOptions: RentalOption[], fallbackIndex = 0) {

  if (candidate && activeOptions.some((option) => option.id === candidate)) return candidate;

  return activeOptions[fallbackIndex]?.id;

}



export default function CompareScreen() {

  const params = useLocalSearchParams<{ a?: string | string[]; b?: string | string[] }>();

  const search = useEligrStore((state) => state.search);

  const rentalOptions = useEligrStore((state) => state.rentalOptions);

  const chosenOptionId = useEligrStore((state) => state.appMeta.chosenOptionId);

  const activeOptions = useMemo(() => getActiveOptions(rentalOptions), [rentalOptions]);

  const [selectedA, setSelectedA] = useState(() => pickActiveId(normalizeRouteId(params.a), activeOptions, 0));

  const [selectedB, setSelectedB] = useState<string | undefined>(() =>

    pickActiveId(normalizeRouteId(params.b), activeOptions, 1),

  );



  useEffect(() => {

    const nextA = pickActiveId(normalizeRouteId(params.a), activeOptions, 0);

    if (nextA) setSelectedA(nextA);



    const nextB = normalizeRouteId(params.b);

    if (nextB !== undefined) {

      setSelectedB(pickActiveId(nextB, activeOptions, 1));

      return;

    }



    setSelectedB((current) => (current && activeOptions.some((option) => option.id === current) ? current : undefined));

  }, [params.a, params.b, activeOptions]);



  const optionA = rentalOptions.find((item) => item.id === selectedA);

  const optionB = rentalOptions.find((item) => item.id === selectedB);



  const comparison = useMemo(() => {

    if (!optionA || !optionB || optionA.id === optionB.id) return null;

    const pool = getScoringPool(rentalOptions);

    return compareRentals(optionA, optionB, pool, search.priorities, search);

  }, [optionA, optionB, rentalOptions, search]);

  const suggestedRivalId = useMemo(() => {
    if (selectedB || !selectedA || activeOptions.length < 2) return undefined;
    const pool = getScoringPool(rentalOptions);
    const ranking = rankRentals(pool, search.priorities, getScoreContext(search));
    return ranking.find((item) => item.option.id !== selectedA)?.option.id;
  }, [selectedA, selectedB, activeOptions.length, rentalOptions, search]);



  const shareComparison = async () => {

    if (!optionA || !optionB || !comparison) return;

    const pool = getScoringPool(rentalOptions);

    await shareContent({

      message: buildPairComparisonSummary(search, optionA, optionB, pool),

    });

  };



  if (activeOptions.length === 0) {
    return (
      <Screen testID="compare-screen-empty">
        <ScreenHeader
          eyebrow="Comparar"
          title="Dos opciones, tradeoffs claros."
          description="Enfrenta precio, trayecto y avisos de cada piso según tus prioridades."
        />
        <Button label="Volver" variant="ghost" icon="arrow-back-outline" onPress={() => router.back()} testID="compare-back-button" />
        <EmptyState
          icon="git-compare-outline"
          title="Aún no hay opciones activas"
          body="Pega un anuncio o añade un alquiler. Necesitas al menos dos para comparar lado a lado."
          steps={["Pega o añade un anuncio", "Añade una segunda opción", "Compara tradeoffs aquí"]}
          testID="compare-empty-state"
          actions={[
            {
              label: "Pegar o añadir anuncio",
              onPress: () => router.push("/rental/new"),
              icon: "clipboard-outline",
              testID: "compare-empty-paste",
            },
            { label: "Ir a opciones", onPress: () => router.replace("/(tabs)"), variant: "secondary", icon: "home-outline", testID: "compare-empty-options" },
          ]}
        />
      </Screen>
    );
  }

  if (activeOptions.length === 1) {
    const sole = activeOptions[0];
    return (
      <Screen testID="compare-screen-single">
        <ScreenHeader
          eyebrow="Comparar"
          title="1 de 2 para comparar"
          description={`Tienes «${sole.title}». Añade otra opción para ver tradeoffs lado a lado.`}
        />
        <Button label="Volver" variant="ghost" icon="arrow-back-outline" onPress={() => router.back()} testID="compare-back-button" />
        <Card variant="accent" style={styles.nudge} testID="compare-add-second-nudge">
          <Text variant="subtitle">Falta una opción</Text>
          <Text>Pega otro anuncio y podrás enfrentar precio, trayecto y avisos de cada piso.</Text>
          <View style={styles.nudgeActions}>
            <Button label="Añadir segunda" icon="clipboard-outline" onPress={() => router.push("/rental/new")} />
            <Button label="Rápido" variant="secondary" icon="flash-outline" onPress={() => router.push("/rental/quick")} />
          </View>
        </Card>
        <Card variant="muted" style={styles.nudge}>
          <Text variant="subtitle">Mientras tanto</Text>
          <Text>El ranking orientativo ya muestra pros, contras y avisos de tu opción según tus prioridades.</Text>
          <Button label="Ver ranking" icon="podium-outline" onPress={() => router.push("/ranking")} />
        </Card>
      </Screen>
    );
  }



  return (

    <Screen testID="compare-screen">

      <ScreenHeader

        eyebrow="Comparar"

        title="Dos opciones, tradeoffs claros."

        description="Elige qué alquileres quieres enfrentar según tus prioridades actuales."

      />

      <Button label="Volver" variant="ghost" icon="arrow-back-outline" onPress={() => router.back()} testID="compare-back-button" />

      <CompareOptionPicker

        title="Opción A"

        side="a"

        selectedId={selectedA}

        disabledId={selectedB}

        options={activeOptions}

        onSelect={setSelectedA}

      />

      <CompareOptionPicker

        title="Opción B"

        side="b"

        selectedId={selectedB}

        disabledId={selectedA}

        options={activeOptions}

        onSelect={setSelectedB}

      />



      {!selectedB ? (

        <Card variant="accent" style={styles.nudge} testID="compare-pick-b-nudge">

          <Text variant="subtitle">Elige la opción B</Text>

          <Text>Selecciona el segundo alquiler que quieres comparar con {optionA?.title ?? "la opción A"}.</Text>

          {suggestedRivalId ? (
            <Button
              label="Usar rival del ranking"
              variant="secondary"
              icon="podium-outline"
              onPress={() => setSelectedB(suggestedRivalId)}
              testID="compare-suggest-rival"
            />
          ) : null}

        </Card>

      ) : optionA && optionB && optionA.id === optionB.id ? (

        <Card variant="accent" style={styles.nudge} testID="compare-same-option-nudge">

          <Text variant="subtitle">Elige dos opciones distintas</Text>

          <Text>La comparación necesita dos alquileres diferentes.</Text>

        </Card>

      ) : comparison && optionA && optionB ? (
        <>
          <Card variant="muted" style={styles.nudge}>
            <Text variant="subtitle">Tradeoffs listos</Text>
            <Text>Revisa precio, trayecto y avisos. Comparte el resumen o vuelve al ranking con las notas actualizadas.</Text>
            <View style={styles.nudgeActions}>
              <Button label="Ver ranking" variant="secondary" icon="podium-outline" onPress={() => router.push("/ranking")} />
              {chosenOptionId ? (
                <Button label="Resumen decisión" variant="secondary" icon="heart-outline" onPress={() => router.push("/decision")} />
              ) : null}
            </View>
          </Card>
          <PartnerOpinionCard option={optionA} compact />
          <PartnerOpinionCard option={optionB} compact />
          <Button
            label="Compartir comparación"
            variant="secondary"
            icon="share-outline"
            onPress={shareComparison}
            testID="compare-share-button"
          />
          <ComparePanel optionA={optionA} optionB={optionB} comparison={comparison} />
          {!chosenOptionId ? (
            <Card variant="accent" style={styles.nudge} testID="compare-choose-nudge">
              <Text variant="subtitle">¿Te quedas con alguna?</Text>
              <Text>
                Marca «Esta es mi elección» en el detalle del piso que elijas para generar un resumen compartible.
              </Text>
              <Button
                label={
                  comparison.winner === "b"
                    ? `Ver detalle de ${optionB.title}`
                    : comparison.winner === "a"
                      ? `Ver detalle de ${optionA.title}`
                      : "Ver detalle A"
                }
                icon="heart-outline"
                onPress={() =>
                  router.push(`/rental/${comparison.winner === "b" ? optionB.id : optionA.id}`)
                }
                testID="compare-go-winner"
              />
            </Card>
          ) : null}
        </>
      ) : null}



      <View style={styles.actions}>

        {optionA ? (

          <Button label="Ver detalle A" variant="secondary" icon="open-outline" onPress={() => router.push(`/rental/${optionA.id}`)} />

        ) : null}

        {optionB ? (

          <Button label="Ver detalle B" variant="secondary" icon="open-outline" onPress={() => router.push(`/rental/${optionB.id}`)} />

        ) : null}

      </View>

    </Screen>

  );

}



const styles = StyleSheet.create({
  nudge: {
    gap: spacing.sm,
  },
  nudgeActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});


