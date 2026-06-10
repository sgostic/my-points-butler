import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F7A70 0%, #13B1A2 52%, #58D68D 100%)",
          borderRadius: 16,
          color: "#ffffff",
        }}
      >
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none">
          <path
            d="M12 3c-3.3 0-6 2.6-6 5.8 0 1.8.9 3.2 2 4.2v2h8v-2c1.1-1 2-2.4 2-4.2C18 5.6 15.3 3 12 3Z"
            fill="currentColor"
          />
          <rect x="7" y="16.5" width="10" height="2.4" rx="1.2" fill="currentColor" />
          <circle cx="12" cy="20.4" r="1.4" fill="currentColor" />
        </svg>
      </div>
    ),
    size,
  );
}
