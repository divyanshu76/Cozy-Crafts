import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = fs.readFileSync(path.join(process.cwd(), "public/assets/logo.png"));
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAF6EF",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoBase64} width={220} height={64} style={{ objectFit: "contain" }} />
        <p style={{ marginTop: 24, fontSize: 28, color: "#3E2C22", fontFamily: "serif" }}>
          Little Things, Made With Love
        </p>
      </div>
    ),
    size
  );
}
