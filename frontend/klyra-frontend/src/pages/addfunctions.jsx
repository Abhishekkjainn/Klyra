import React, { useState } from "react";
import Header from "../components/header";
import Actions from "../components/actions";

const functions = [
  { key: "usePageAnalytics", label: "Page Analytics", code: `export default function usePageAnalytics({ apikey, pagename, enabled = true }) {
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
}` },
  { key: "sendButtonClickAnalytics", label: "Button Click Analytics", code: `export function sendButtonClickAnalytics({ apikey, buttonName }) {
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
      
    });
}` },
  { key: "useUserJourneyAnalytics", label: "User Journey", code: `
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
}` },
  { key: "sendDeviceInfoAnalytics", label: "Device Info", code: `export function sendDeviceInfoAnalytics({ apikey, getLocation = false }) {
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
}` },
  { key: "useActiveUserTracker", label: "Active User Tracker", code: `function getTabId() {
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

    const tabId = getTabId();
    const incrementFlagKey = \`klyra_incremented_\${tabId}\`;
    let heartbeatInterval = null;
    let stopped = false;

    // Increment only once per tab
    if (!sessionStorage.getItem(incrementFlagKey)) {
      fetch('https://klyra-backend.vercel.app/activeUserIncrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apikey, tabId }),
      })
        .then(res => {
          if (res.ok) {
            sessionStorage.setItem(incrementFlagKey, '1');
            console.log('[ActiveUserTracker] Incremented');
          } else {
            throw new Error('Increment failed');
          }
        })
        .catch(err => {
          console.error('[ActiveUserTracker] Increment error:', err);
        });
    }

    // Heartbeat function
    const sendHeartbeat = () => {
      if (stopped) return;
      fetch('https://klyra-backend.vercel.app/activeUserHeartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apikey, tabId, timestamp: new Date().toISOString() }),
        keepalive: true,
      })
        .then(res => {
          if (!res.ok) throw new Error('Heartbeat failed');
          console.log('[ActiveUserTracker] Heartbeat sent');
        })
        .catch(err => {
          console.error('[ActiveUserTracker] Heartbeat error:', err);
        });
    };

    // Start heartbeat interval (every 60s)
    heartbeatInterval = setInterval(sendHeartbeat, 60000);
    // Send initial heartbeat immediately
    sendHeartbeat();

    // Decrement on unmount or beforeunload (best effort)
    const decrement = () => {
      stopped = true;
      if (!sessionStorage.getItem(incrementFlagKey)) return;
      fetch('https://klyra-backend.vercel.app/activeUserDecrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apikey, tabId }),
        keepalive: true,
      })
        .then(() => {
          sessionStorage.removeItem('klyra_tab_id');
          sessionStorage.removeItem(incrementFlagKey);
          console.log('[ActiveUserTracker] Decrement sent');
        })
        .catch(err => {
          console.error('[ActiveUserTracker] Decrement error:', err);
        });
    };

    window.addEventListener('beforeunload', decrement);

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      decrement();
      window.removeEventListener('beforeunload', decrement);
    };
  }, [apikey, enabled]);
}` },
];

const importMap = {
  usePageAnalytics: ``,
  sendButtonClickAnalytics: ``,
  useUserJourneyAnalytics: ``,
  sendDeviceInfoAnalytics: ``,
  useActiveUserTracker: ``,
};

export default function AddFunctions({ user, sessionLoading, refreshSession }) {
  const [selected, setSelected] = useState([]);

  const toggleFunction = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const copyCode = () => {
    const imports = Array.from(new Set(selected.map((fn) => importMap[fn])));
    const bodies = selected.map((fn) =>
      functions.find((f) => f.key === fn)?.code
    );
    const finalCode = [...imports, "", ...bodies].join("\n");

    navigator.clipboard.writeText(finalCode);
    alert("Copied to clipboard!");
  };

  return (
    <div className="container">
        <Header/>
        <Actions user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />
      <div className="heading">
        <h1>Add Analytics Functions</h1>
        <p>
          Select any analytics functions you want to include in your app. Your
          code will be generated automatically below.
        </p>
      </div>

      <div className="tabs">
        {functions.map((f) => (
          <div
            key={f.key}
            className={`tab ${selected.includes(f.key) ? "selected" : ""}`}
            onClick={() => toggleFunction(f.key)}
          >
            <span>{f.label}</span>
            {selected.includes(f.key) && (
              <span className="check">✔</span>
            )}
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="codespace-wrapper">
          <div className="codespace">
            <pre>
              {Array.from(new Set(selected.map((k) => importMap[k]))).join("\n")}
              {"\n\n"}
              {selected
                .map((k) => functions.find((f) => f.key === k)?.code)
                .join("\n")}
            </pre>
          </div>
          <button className="copy-btn" onClick={copyCode}>Copy Code</button>
        </div>
      )}
    </div>
  );
}
