"use client";

import { Toaster } from "react-hot-toast";

export function ClientToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "rgb(var(--color-background))",
          color: "rgb(var(--color-content))",
          borderRadius: "8px",
          border: "1px solid rgb(var(--color-subtle) / 0.2)",
        },
      }}
    />
  );
}
