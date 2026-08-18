import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { useLayout } from "@/src/hooks/useLayout";
import { useSettingsStore } from "@/src/store/useSettingsStore";

export default function SettingsScreen() {
  const router = useRouter();
  const { contentMax } = useLayout();
  const apiKey = useSettingsStore((s) => s.apiKey);
  const model = useSettingsStore((s) => s.model);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setModel = useSettingsStore((s) => s.setModel);
  const [draft, setDraft] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(apiKey);
  }, [apiKey]);

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1 self-center w-full px-5" style={{ maxWidth: contentMax }}>
        <Pressable onPress={() => router.back()} className="mt-2 mb-4 self-start rounded-full bg-white px-3 py-2">
          <Text className="font-semibold text-ink">← 홈</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-ink">AI 코치 설정</Text>
        <Text className="text-muted mt-2 leading-5">
          OpenAI API 키를 넣으면 세트 종료 후 gpt-4o-mini가 맞춤 피드백을 줍니다. 키가 없어도 로컬 코치 팁은 나와요.
        </Text>
        <View className="mt-5 rounded-3xl bg-white p-4">
          <Text className="text-sm font-semibold text-ink mb-2">API Key</Text>
          <TextInput
            value={draft}
            onChangeText={(t) => {
              setDraft(t);
              setSaved(false);
            }}
            placeholder="sk-..."
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            className="rounded-2xl bg-cream px-4 py-3 text-ink"
          />
          <Text className="text-sm font-semibold text-ink mt-4 mb-2">모델</Text>
          <View className="flex-row gap-2">
            {["gpt-4o-mini", "gpt-4o"].map((m) => (
              <Pressable
                key={m}
                onPress={() => setModel(m)}
                className="rounded-2xl px-4 py-3"
                style={{ backgroundColor: model === m ? "#FFE4EC" : "#FFF6F0" }}
              >
                <Text className="font-bold text-ink">{m}</Text>
              </Pressable>
            ))}
          </View>
          <View className="mt-5">
            <PrimaryButton
              label={saved ? "저장됐어요" : "키 저장"}
              onPress={async () => {
                await setApiKey(draft);
                setSaved(true);
              }}
            />
          </View>
        </View>
        <Text className="text-xs text-muted mt-4 leading-5">
          키는 이 기기 SecureStore에만 저장됩니다. 연습용 앱이므로 공식 잡다 시험과 문항이 동일하지 않고, 규칙과 감각을 익히기 위한 훈련입니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}
