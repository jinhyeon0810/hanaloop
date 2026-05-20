"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        문제가 발생했습니다
      </h1>
      <p style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
        페이지를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
      </p>
      {error.digest && (
        <p style={{ fontSize: 11, color: "#999", marginBottom: 12 }}>
          error id: <code>{error.digest}</code>
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        style={{
          padding: "6px 12px",
          fontSize: 13,
          border: "1px solid #ccc",
          borderRadius: 6,
          cursor: "pointer",
          background: "white",
        }}
      >
        다시 시도
      </button>
    </div>
  );
}
