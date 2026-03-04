 "use client";
import { useEffect } from "react";

export default function ClientErrorListener() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      try {
        // salva localmente para revisão (evita enviar secrets)
        const logs = JSON.parse(localStorage.getItem("client_errors") || "[]");
        logs.push({
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack || null,
          time: new Date().toISOString(),
        });
        localStorage.setItem("client_errors", JSON.stringify(logs));
        console.error("[ClientErrorListener]", event.message, event.error);
      } catch (e) {
        // ignore
      }
    }

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  return null;
}

