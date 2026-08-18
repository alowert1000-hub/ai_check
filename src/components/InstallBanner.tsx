import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { shouldPromptHomeScreenInstall } from "@/src/utils/pwa";

const DISMISS_KEY = "pwa-install-banner-dismissed";

export function InstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shouldPromptHomeScreenInstall()) return;
    AsyncStorage.getItem(DISMISS_KEY).then((value) => {
      if (!value) setVisible(true);
    });
  }, []);

  if (!visible) return null;

  return (
    <View
      className="mt-4 rounded-3xl px-4 py-3"
      style={{ backgroundColor: "#1F2937" }}
    >
      <Text className="text-white font-bold text-base">홈 화면에 앱으로 추가</Text>
      <Text className="text-white mt-1 text-[13px] leading-5" style={{ opacity: 0.92 }}>
        사파리 하단(아이패드면 상단)의 공유 버튼 →{" "}
        <Text className="font-bold text-white">홈 화면에 추가</Text>를 누르면 아이콘이
        생기고, 다음부터는 일반 앱처럼 열 수 있어요. Chrome이 아니라{" "}
        <Text className="font-bold text-white">Safari</Text>에서 열어 주세요.
      </Text>
      <Pressable
        onPress={() => {
          setVisible(false);
          AsyncStorage.setItem(DISMISS_KEY, "1").catch(() => {});
        }}
        className="mt-3 self-start rounded-2xl bg-white px-3 py-2"
      >
        <Text className="font-bold" style={{ color: "#1F2937" }}>
          확인했어요
        </Text>
      </Pressable>
    </View>
  );
}
