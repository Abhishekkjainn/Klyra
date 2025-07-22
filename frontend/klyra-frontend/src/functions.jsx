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
      fetch("https://klyra-backend.vercel.app/updatePageViewCount", {
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
  fetch("https://klyra-backend.vercel.app/updateButtonClickAnalytics", {
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
      fetch("https://klyra-backend.vercel.app/userJourneyAnalytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      })
        .then(res => res.json())
        .then(data => {
          console.log('[JourneyAnalytics] fetch response:', data);
        })
        .catch(err => {
          console.log('[JourneyAnalytics] fetch error:', err);
        });
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

// Device, Browser, OS & Location Analytics
export function sendDeviceInfoAnalytics({ apikey, getLocation = false }) {
  if (!apikey) {
    console.log('[DeviceInfoAnalytics] Missing apikey, not sending');
    return;
  }
  // Prevent duplicate sends in the same session
  if (sessionStorage.getItem('device_info_sent')) {
    console.log('[DeviceInfoAnalytics] Already sent this session');
    return;
  }

  // Collect device info
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    deviceMemory: navigator.deviceMemory || null,
    hardwareConcurrency: navigator.hardwareConcurrency || null,
    touchSupport: 'ontouchstart' in window,
  };

  // Helper to send the payload
  const sendPayload = (location) => {
    const payload = {
      apikey,
      deviceInfo,
      location: location || null,
    };
    fetch('https://klyra-backend.vercel.app/deviceInfoAnalytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .then(res => res.json())
      .then(data => {
        console.log('[DeviceInfoAnalytics] Sent:', data);
        sessionStorage.setItem('device_info_sent', '1');
      })
      .catch(err => {
        console.log('[DeviceInfoAnalytics] Error:', err);
      });
  };

  if (getLocation && 'geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        sendPayload({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.log('[DeviceInfoAnalytics] Geolocation error:', error);
        sendPayload(null);
      },
      { timeout: 5000 }
    );
  } else {
    sendPayload(null);
  }
}

// Active User Tracker Hook

function getTabId() {
  let tabId = sessionStorage.getItem('klyra_tab_id');
  if (!tabId) {
    tabId = (window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now());
    sessionStorage.setItem('klyra_tab_id', tabId);
  }
  return tabId;
}

export function useActiveUserTracker({ apikey, enabled = true }) {
  useEffect(() => {
    if (!enabled || !apikey) return;
    let retryTimeout = null;
    let incremented = false;
    const tabId = getTabId();
    const incrementFlagKey = `klyra_incremented_${tabId}`;

    const increment = () => {
      if (sessionStorage.getItem(incrementFlagKey)) {
        incremented = true;
        return;
      }
      fetch('https://klyra-backend.vercel.app/activeUserIncrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apikey, tabId }),
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to increment active user');
          sessionStorage.setItem(incrementFlagKey, '1');
          incremented = true;
        })
        .catch(err => {
          console.error('[ActiveUserTracker] Increment error:', err);
          retryTimeout = setTimeout(increment, 2000);
        });
    };

    const decrement = () => {
      if (!incremented && !sessionStorage.getItem(incrementFlagKey)) return;
      fetch('https://klyra-backend.vercel.app/activeUserDecrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apikey, tabId }),
        keepalive: true,
      })
        .then(() => {
          sessionStorage.removeItem('klyra_tab_id');
          sessionStorage.removeItem(incrementFlagKey);
        })
        .catch(err => {
          console.error('[ActiveUserTracker] Decrement error:', err);
        });
    };

    increment();
    window.addEventListener('beforeunload', decrement);

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      decrement();
      window.removeEventListener('beforeunload', decrement);
    };
  }, [apikey, enabled]);
}



