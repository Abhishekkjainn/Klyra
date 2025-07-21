// src/hooks/usePageAnalytics.js
import { useEffect, useRef, useCallback } from "react";

export default function usePageAnalytics({ apikey, pagename, enabled = true }) {
  const startTimeRef = useRef(Date.now());
  const handlerRef = useRef();

  useEffect(() => {
    handlerRef.current = () => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const payload = {
        apikey,
        pagename,
        startTime: new Date(startTimeRef.current).toISOString(),
        duration,
      };
      fetch("http://localhost:3000/updatePageViewCount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(() => {
          // Minimal log for confirmation
          console.log("[Analytics] Sent");
        });
    };
  }, [apikey, pagename, enabled]);

  useEffect(() => {
    if (!enabled || !apikey || !pagename) return;
    const sendAnalytics = () => handlerRef.current();
    window.addEventListener("beforeunload", sendAnalytics);
    return () => {
      sendAnalytics();
      window.removeEventListener("beforeunload", sendAnalytics);
    };
  }, [apikey, pagename, enabled]);
}

// Button click analytics function
export function sendButtonClickAnalytics({ apikey, buttonName }) {
  if (!apikey || !buttonName) return;
  const payload = {
    apikey,
    buttonName,
    timestamp: new Date().toISOString(),
  };
  fetch("http://localhost:3000/updateButtonClickAnalytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(() => {
      // Minimal log for confirmation
      console.log(`[Analytics] Button click sent for ${buttonName}`);
    });
}



