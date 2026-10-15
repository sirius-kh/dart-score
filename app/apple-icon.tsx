import { ImageResponse } from "next/og";

// iOS нүүр дэлгэцийн icon (PNG шаардлагатай) — public/icon.svg-тэй ижил загвар
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const ring = (diameter: number, border: number, color: string) => ({
  position: "absolute" as const,
  width: diameter,
  height: diameter,
  borderRadius: "50%",
  border: `${border}px solid ${color}`,
});

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10151f",
        }}
      >
        <div style={ring(138, 14, "#ff8a14")} />
        <div style={ring(83, 13, "#e7ebf4")} />
        <div style={{ ...ring(24, 0, "#ff8a14"), background: "#ff8a14" }} />
      </div>
    ),
    size,
  );
}
