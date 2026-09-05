import { ImageResponse } from "next/og"
import { readFileSync } from "fs"
import { join } from "path"

export const alt = "Cozy Craft - Handmade Gifts"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  const logoPath = join(process.cwd(), "public", "assets", "logo.png");
  const logoBuffer = readFileSync(logoPath);
  const base64Logo = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#FAF6EF",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img src={base64Logo} style={{ width: 600, height: "auto", objectFit: "contain" }} />
        <div style={{ marginTop: 40, fontSize: 36, color: "#6B5648", fontFamily: "serif" }}>
          Little Things, Made With Love.
        </div>
      </div>
    ),
    { ...size }
  )
}
