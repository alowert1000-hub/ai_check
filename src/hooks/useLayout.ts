import { useWindowDimensions } from "react-native";

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const shortest = Math.min(width, height);
  const isTablet = shortest >= 700;
  const contentMax = isTablet ? 920 : 560;
  const columns = isTablet ? 3 : 2;
  return { width, height, isTablet, contentMax, columns };
}
