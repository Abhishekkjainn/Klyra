// src/hooks/usePageAnalytics.js
import { useEffect, useRef } from "react";

export default function usePageAnalytics({ apikey, pagename, enabled = true }) {
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    console.log('[usePageAnalytics] Hook called', { apikey, pagename, enabled });
    if (!enabled || !apikey || !pagename) return;

    const sendAnalytics = () => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const payload = {
        apikey,
        pagename,
        startTime: new Date(startTimeRef.current).toISOString(),
        duration,
      };
      console.log('[usePageAnalytics] Sending analytics:', payload);
      fetch("http://localhost:3000/updatePageViewCount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          console.log('[usePageAnalytics] Analytics sent, response status:', res.status);
        })
        .catch((error) => {
          console.error("[usePageAnalytics] Analytics error:", error);
        });
    };

    window.addEventListener("beforeunload", sendAnalytics);
    return () => {
      sendAnalytics();
      window.removeEventListener("beforeunload", sendAnalytics);
    };
  }, [apikey, pagename, enabled]);
}
