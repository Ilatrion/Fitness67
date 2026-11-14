import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  activities,
  energy,
  forecast,
  forecastTitle,
  suggestedIntake,
  validPlan,
  type WeightPlan,
  type Sex,
  type Activity,
} from "./plan";
import { dateKey } from "./nutrition";
import { styles, type Palette } from "./theme";
type Props = {
  visible: boolean;
  existing?: WeightPlan;
  weight?: number;
  initialHeight: string;
  currentGoal: number;
  C: Palette;
  onSave: (p: WeightPlan, kcal: number) => void;
  onSkip: () => void;
};
export function Onboarding({
  visible,
  existing,
  weight,
  initialHeight,
  currentGoal,
  C,
  onSave,
  onSkip,
}: Props) {
  const s = styles(C),
    [age, setAge] = useState(""),
    [height, setHeight] = useState(""),
    [start, setStart] = useState(""),
    [target, setTarget] = useState(""),
    [sex, setSex] = useState<Sex>("unspecified"),
    [activity, setActivity] = useState<Activity>("low"),
    [step, setStep] = useState(0),
    [calories, setCalories] = useState(""),
    [error, setError] = useState(""),
    [detailsOpen,setDetailsOpen]=useState(false);
  useEffect(() => {
    if (visible) {
      setAge(existing ? String(existing.age) : "");
      setHeight(existing ? String(existing.height) : initialHeight);
      setStart(
        weight ? String(weight) : existing ? String(existing.startWeight) : "",
      );
      setTarget(existing ? String(existing.targetWeight) : "");
      setSex(existing?.sex || "unspecified");
      setActivity(existing?.activity || "low");
      setStep(0);
      setDetailsOpen(false);
      setError("");
    }
  }, [visible]);
  const number = (s: string) => Number(s.replace(",", "."));
  const p: WeightPlan = {
    age: number(age),
    height: number(height),
    startWeight: number(start),
    targetWeight: number(target),
    sex,
    activity,
    startedAt: dateKey(new Date()),
  };
  const isValid =
    [age, height, start, target].every((x) => x.trim()) && validPlan(p);
  const intake = number(calories),
    f = isValid && intake > 0 ? forecast(p, p.startWeight, intake) : null;
  const button = (label: string, fn: () => void, secondary = false) => (
    <Pressable
      accessibilityRole="button"
      onPress={fn}
      style={[s.button, secondary && s.secondary]}
    >
      <Text style={[s.buttonText, { color: secondary ? C.text : C.bg }]}>
        {label}
      </Text>
    </Pressable>
  );
  const input = (label: string, value: string, change: (v: string) => void) => (
    <View style={{ marginBottom: 6 }}>
      <Text style={s.sub}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholder={label}
        placeholderTextColor={C.muted}
        value={value}
        onChangeText={change}
        keyboardType="decimal-pad"
        style={s.input}
      />
    </View>
  );
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onSkip}>
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          style={s.modalShell}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, paddingBottom: 50 }}
            key={step}
          >
            <Text style={[s.eyebrow, { color: C.green, marginBottom: 18 }]}>
              FITNESS67 · {step === 0 ? "ЗНАКОМСТВО" : "ТВОЙ ОРИЕНТИР"}
            </Text>
            <Text style={[s.h1, { marginBottom: 12 }]}>
              {step === 0 ? "План под тебя" : "Твой план готов"}
            </Text>
            <Text style={[s.sub, { lineHeight: 23, marginBottom: 26 }]}>
              {step === 0
                ? "Рост, вес и образ жизни помогут оценить расход энергии и примерный срок снижения веса. Данные сохраняются на устройстве."
                : "Меняй калораж — прогноз пересчитается. Выбери ориентир, с которым удобно начать."}
            </Text>
            {step === 0 ? (
              <>
                {input("Возраст, лет", age, setAge)}
                {input("Рост, см", height, setHeight)}
                {input("Текущий вес, кг", start, setStart)}
                {input("Желаемый вес, кг", target, setTarget)}
                <Text style={[s.label, { marginTop: 10 }]}>
                  Коэффициент для формулы
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginVertical: 12,
                  }}
                >
                  {(
                    [
                      ["male", "Мужской"],
                      ["female", "Женский"],
                      ["unspecified", "Не указывать"],
                    ] as const
                  ).map(([value, label]) => (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sex === value }}
                      onPress={() => setSex(value)}
                      style={[
                        s.chip,
                        {
                          flex: undefined,
                          paddingHorizontal: 14,
                          backgroundColor: sex === value ? C.green : C.card,
                        },
                      ]}
                    >
                      <Text style={{ color: sex === value ? C.bg : C.text }}>
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[s.small, { marginBottom: 20 }]}>
                  При выборе «Не указывать» используется среднее двух
                  коэффициентов; погрешность оценки остается существенной.
                </Text>
                <Text style={s.label}>Твоя обычная активность</Text>
                {activities.map((a) => (
                  <Pressable
                    key={a.value}
                    accessibilityRole="button"
                    accessibilityLabel={a.label}
                    accessibilityState={{ selected: activity === a.value }}
                    onPress={() => setActivity(a.value)}
                    style={[
                      s.card,
                      {
                        marginTop: 10,
                        borderWidth: 1,
                        borderColor: activity === a.value ? C.green : C.line,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.label,
                        { color: activity === a.value ? C.green : C.text },
                      ]}
                    >
                      {a.label}
                    </Text>
                    <Text style={[s.small, { marginTop: 5 }]}>
                      {a.description}
                    </Text>
                  </Pressable>
                ))}
                {!!error && <Text style={s.error}>{error}</Text>}
                {button("Рассчитать мой план", () => {
                  if (!isValid) {
                    setError(
                      "Укажите возраст 10–100 полных лет, рост 100–230 см и вес 20–300 кг. Поля не должны быть пустыми.",
                    );
                    return;
                  }
                  if(p.targetWeight>p.startWeight){setError('Для этого плана выберите желаемый вес не выше текущего. Равный вес означает поддержание.');return;}
                  setCalories(String(suggestedIntake(p) ?? currentGoal));
                  setError("");
                  setStep(1);
                })}
                {button(
                  existing ? "Отмена" : "Начать без расчета",
                  onSkip,
                  true,
                )}
              </>
            ) : (
              <>
                <View style={[s.card, { marginBottom: 20 }]}>
                  <Text style={s.sub}>
                    {p.age >= 18
                      ? "Расчетное поддержание веса"
                      : "Без назначения калорий"}
                  </Text>
                  <Text style={[s.big, { fontSize: 34, marginVertical: 8 }]}>
                    {p.age >= 18
                      ? "≈ " + energy(p).maintenance.toLocaleString("ru-RU") + " ккал"
                      : "Ручной дневник"}
                  </Text>
                  <Text style={s.small}>
                    {p.age >= 18
                      ? "Ориентир для сохранения текущего веса при выбранной активности."
                      : "Для возраста младше 18 лет дефицит и срок не рассчитываются."}
                  </Text>
                </View>
                {input("Мой дневной калораж, ккал", calories, setCalories)}
                {suggestedIntake(p) !== null && (
                  <Text style={[s.small, { marginBottom: 20 }]}>
                    Умеренный старт: {suggestedIntake(p)} ккал. Можно изменить.
                  </Text>
                )}
                {f && (
                  <View
                    style={[
                      s.card,
                      {
                        borderWidth: 1,
                        borderColor: C.green,
                        marginBottom: 20,
                      },
                    ]}
                  >
                    <Text style={s.sub}>
                      {p.startWeight} → {p.targetWeight} кг
                    </Text>
                    <Text style={[s.h2, { marginTop: 14, marginBottom: 12 }]}>
                      {forecastTitle(f)}
                    </Text>
                    {["estimate", "plateau"].includes(f.status) && (
                      <Text style={[s.label, { marginBottom: 12 }]}>
                        Базовый темп: ≈ {Math.max(0,(f.maintenance-intake)*7/7700).toFixed(1)} кг/нед. в начале
                      </Text>
                    )}
                    <Text style={[s.sub, { lineHeight: 22 }]}>{f.message}</Text>
                  </View>
                )}
                <Text style={[s.small,{lineHeight:20,marginBottom:12}]}>Ориентир, а не обещание. Вес может колебаться из-за воды; оценивай динамику нескольких измерений.</Text>
                {button(detailsOpen?'Скрыть расчет':'Как посчитан план',()=>setDetailsOpen(v=>!v),true)}
                {detailsOpen&&<View style={[s.card,{marginTop:12,marginBottom:15}]}><Text style={[s.small,{lineHeight:20}]}>Расход: формула Миффлина — Сан Жеора × выбранная активность. Стартовый дефицит — до 15% и до 500 ккал, с округлением вверх до 50 ккал и нижним ориентиром 1500 ккал. В сценариях расход меняется на ±15%; это не статистическая гарантия, реальная погрешность может быть больше. Условно 7700 ккал принимаются за 1 кг; расход пересчитывается с весом. Состав тела и адаптация могут изменить срок. Для возраста до 18 лет, слишком низкой цели или большого дефицита прогноз не строится. Это не индивидуальное медицинское назначение.</Text></View>}
                {!!error && <Text style={s.error}>{error}</Text>}
                <Text style={[s.small, { marginBottom: 10 }]}>
                  При сохранении обновятся цель по калориям и БЖУ (25% / 30% /
                  45%). Текущий вес станет точкой отсчета плана.
                </Text>
                {button("Сохранить и открыть дневник", () => {
                  if (
                    !Number.isFinite(intake) ||
                    intake <= 0 ||
                    intake > 10000
                  ) {
                    setError("Введите калораж больше нуля и до 10 000 ккал");
                    return;
                  }
                  onSave(p, intake);
                })}
                {button(
                  "Изменить параметры",
                  () => {
                    setError("");
                    setStep(0);
                  },
                  true,
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
