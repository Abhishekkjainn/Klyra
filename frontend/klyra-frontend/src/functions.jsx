// src/hooks/usePageAnalytics.js
import { useEffect, useRef } from "react";

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

// User Journey Analytics Hook

export function useUserJourneyAnalytics({ apikey, enabled = true }) {
  const journeyRef = useRef({
    routes: [],
    startTime: new Date().toISOString(),
    lastPath: null,
  });

  useEffect(() => {
    console.log('[JourneyAnalytics] Hook initialized', { apikey, enabled });
    if (!enabled || !apikey) {
      console.log('[JourneyAnalytics] Disabled or missing apikey');
      return;
    }

    // Helper to record route only if it changed
    const recordRoute = () => {
      const path = window.location.pathname;
      if (journeyRef.current.lastPath !== path) {
        journeyRef.current.routes.push(path);
        journeyRef.current.lastPath = path;
        console.log('[JourneyAnalytics] Route recorded:', path);
      } else {
        console.log('[JourneyAnalytics] Route not changed:', path);
      }
    };

    // Record the initial route
    recordRoute();

    // Listen to route changes
    const onRouteChange = () => {
      console.log('[JourneyAnalytics] Route change detected');
      recordRoute();
    };
    window.addEventListener("popstate", onRouteChange);

    // Patch pushState/replaceState to detect SPA navigation
    const origPushState = window.history.pushState;
    const origReplaceState = window.history.replaceState;
    window.history.pushState = function (...args) {
      origPushState.apply(this, args);
      console.log('[JourneyAnalytics] pushState called');
      onRouteChange();
    };
    window.history.replaceState = function (...args) {
      origReplaceState.apply(this, args);
      console.log('[JourneyAnalytics] replaceState called');
      onRouteChange();
    };

    // Send journey only once, on unload
    const sendJourney = () => {
      if (journeyRef.current.routes.length === 0) {
        console.log('[JourneyAnalytics] No routes to send, skipping');
        return;
      }
      const duration = Math.floor(
        (Date.now() - new Date(journeyRef.current.startTime).getTime()) / 1000
      );
      const payload = {
        apikey,
        routes: journeyRef.current.routes,
        startTime: journeyRef.current.startTime,
        duration,
      };
      console.log('[JourneyAnalytics] Sending journey payload:', payload);
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const result = navigator.sendBeacon(
        "https://klyra-backend.vercel.app/userJourneyAnalytics",
        blob
      );
      console.log('[JourneyAnalytics] sendBeacon result:', result);
    };
    window.addEventListener("beforeunload", sendJourney);

    return () => {
      window.removeEventListener("popstate", onRouteChange);
      window.removeEventListener("beforeunload", sendJourney);
      window.history.pushState = origPushState;
      window.history.replaceState = origReplaceState;
      console.log('[JourneyAnalytics] Cleanup complete');
    };
  }, [apikey, enabled]);
}



