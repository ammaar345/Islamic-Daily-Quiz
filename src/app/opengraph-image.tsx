import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION } from "@/lib/site";

export const runtime = "edge";
export const alt = SITE_DESCRIPTION;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded 1200x630 social card, rendered server-side via Satori (no image asset needed). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          background:
            "linear-gradient(160deg, #0F766E 0%, #0B4F4A 55%, #083833 100%)",
          color: "#F7F5F0",
          padding: "0 96px",
        }}
      >
        <div
          style={{
            display: "flex",
            padding: "10px 26px",
            border: "2px solid #D4AF37",
            borderRadius: "999px",
            color: "#E9CE7F",
            fontSize: 30,
            letterSpacing: 10,
            textTransform: "uppercase",
          }}
        >
          Quran · Hadith · Seerah
        </div>

        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.1,
            marginTop: 40,
            maxWidth: 1000,
          }}
        >
          Learn a little,
          <br />
          every single day.
        </div>

        <div
          style={{
            width: 96,
            height: 5,
            borderRadius: 3,
            background: "#D4AF37",
            margin: "44px 0",
          }}
        />

        <div style={{ fontSize: 34, color: "#C9E0DC", maxWidth: 860, lineHeight: 1.4 }}>
          {SITE_DESCRIPTION} Every answer cites its source.
        </div>
      </div>
    ),
    { width: size.width, height: size.height },
  );
}
