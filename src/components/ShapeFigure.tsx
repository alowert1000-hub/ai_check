import { View } from "react-native";
import { SHAPE_CELLS, type Transform } from "@/src/games/logic/rotate";

type Props = {
  transform: Transform;
  cell?: number;
  accent?: string;
};

export function ShapeFigure({ transform, cell = 22, accent = "#F2789F" }: Props) {
  const cols = 3;
  const rows = 4;
  const width = cols * cell;
  const height = rows * cell;
  return (
    <View
      style={{
        width: width + 24,
        height: height + 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width,
          height,
          transform: [
            { scaleX: transform.flipX ? -1 : 1 },
            { scaleY: transform.flipY ? -1 : 1 },
            { rotate: `${transform.rotation}deg` },
          ],
        }}
      >
        {SHAPE_CELLS.map(([x, y]) => (
          <View
            key={`${x}-${y}`}
            style={{
              position: "absolute",
              left: x * cell,
              top: y * cell,
              width: cell - 3,
              height: cell - 3,
              borderRadius: 6,
              backgroundColor: y === 0 ? "#6EA8FE" : accent,
            }}
          />
        ))}
      </View>
    </View>
  );
}
