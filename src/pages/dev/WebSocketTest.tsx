import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { messagingEnv } from "@/config/messagingEnv";
import {
  getEcho,
  isReverbConfigured,
  subscribeToUserNotifications,
} from "@/lib/echo";

type LogLevel = "info" | "success" | "warn" | "error";
type LogEntry = { id: string; level: LogLevel; message: string; ts: string };
type ReceivedEvent = {
  id: string;
  channel: string;
  event: string;
  data: unknown;
  ts: string;
};

type ConnectionStatus =
  | "disabled"
  | "connecting"
  | "connected"
  | "unavailable"
  | "disconnected"
  | "failed";

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  disabled: "Disabled (not configured)",
  connecting: "Connecting…",
  connected: "Connected",
  unavailable: "Unavailable",
  disconnected: "Disconnected",
  failed: "Failed",
};

const STATUS_DOT: Record<ConnectionStatus, string> = {
  connected: "bg-green-500",
  connecting: "bg-yellow-500 animate-pulse",
  unavailable: "bg-orange-500",
  disconnected: "bg-orange-500",
  failed: "bg-red-500",
  disabled: "bg-gray-400",
};

function now() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

type PusherConnection = {
  state?: string;
  socket_id?: string;
  bind: (event: string, cb: (payload?: unknown) => void) => void;
  unbind: (event: string, cb: (payload?: unknown) => void) => void;
};

function getPusherConnection(): PusherConnection | null {
  const echo = getEcho();
  if (!echo) return null;
  const connector = echo.connector as {
    pusher?: { connection?: PusherConnection };
  };
  return connector?.pusher?.connection ?? null;
}

/**
 * End-to-end diagnostic console for the Reverb pipeline:
 * Frontend ⇄ reverb_server ⇄ backend (broadcasting).
 *
 * - Public test: GET /realtime/ping dispatches a broadcast on `reverb-ping`,
 *   which should arrive over the WebSocket (no auth required).
 * - Private test: when logged in, subscribes to `App.Models.User.{id}` and
 *   displays any `.notification.created` events pushed by the backend.
 */
export default function WebSocketTest() {
  const { isAuthenticated, user } = useAuth();
  const configured = isReverbConfigured();

  const [status, setStatus] = useState<ConnectionStatus>(
    configured ? "connecting" : "disabled",
  );
  const [socketId, setSocketId] = useState<string | null>(null);
  const [events, setEvents] = useState<ReceivedEvent[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const idRef = useRef(0);

  const addLog = useCallback((level: LogLevel, message: string) => {
    setLogs((prev) =>
      [...prev.slice(-99), { id: `${idRef.current++}`, level, message, ts: now() }],
    );
  }, []);

  const pushEvent = useCallback((channel: string, event: string, data: unknown) => {
    setEvents((prev) =>
      [{ id: uid(), channel, event, data, ts: now() }, ...prev].slice(0, 50),
    );
  }, []);

  // ── Connection lifecycle + public channel subscription ──────────────────────
  useEffect(() => {
    if (!configured) return;

    const echo = getEcho();
    if (!echo) {
      setStatus("disabled");
      return;
    }

    const connection = getPusherConnection();
    if (connection?.state === "connected") {
      setStatus("connected");
      setSocketId(connection.socket_id ?? null);
    }

    const onConnected = () => {
      setStatus("connected");
      setSocketId(getPusherConnection()?.socket_id ?? null);
      addLog("success", "WebSocket connected");
    };
    const onConnecting = () => setStatus("connecting");
    const onUnavailable = () => {
      setStatus("unavailable");
      addLog("warn", "WebSocket unavailable");
    };
    const onDisconnected = () => {
      setStatus("disconnected");
      setSocketId(null);
      addLog("warn", "WebSocket disconnected");
    };
    const onError = () => {
      setStatus("failed");
      addLog("error", "WebSocket connection error");
    };

    connection?.bind("connected", onConnected);
    connection?.bind("connecting", onConnecting);
    connection?.bind("unavailable", onUnavailable);
    connection?.bind("disconnected", onDisconnected);
    connection?.bind("error", onError);

    // Public diagnostic channel
    const pingChannel = echo.channel("reverb-ping");
    const onPing = (data: unknown) => {
      pushEvent("reverb-ping", "ping", data);
      const message = (data as { message?: string })?.message ?? "ping";
      addLog("success", `Public event received: ${message}`);
    };
    pingChannel.listen(".ping", onPing);

    return () => {
      connection?.unbind("connected", onConnected);
      connection?.unbind("connecting", onConnecting);
      connection?.unbind("unavailable", onUnavailable);
      connection?.unbind("disconnected", onDisconnected);
      connection?.unbind("error", onError);
      echo.leave("reverb-ping");
    };
  }, [configured, addLog, pushEvent]);

  // ── Private user notification channel (authenticated only) ──────────────────
  useEffect(() => {
    if (!configured || !isAuthenticated || user?.id == null) return;

    const unsubscribe = subscribeToUserNotifications(user.id, (payload) => {
      pushEvent(`App.Models.User.${user.id}`, "notification.created", payload);
      const title =
        (payload as { title?: string; type?: string })?.title ??
        (payload as { type?: string })?.type ??
        "notification";
      addLog("success", `Private notification received: ${title}`);
    });

    return unsubscribe;
  }, [configured, isAuthenticated, user?.id, addLog, pushEvent]);

  const firePublicPing = useCallback(async () => {
    setBusy(true);
    addLog("info", "GET /realtime/ping …");
    try {
      const res = await api.get("/realtime/ping", {
        params: { message: `Ping ${now()}` },
      });
      setApiResponse(JSON.stringify(res.data, null, 2));
      addLog("success", "Backend dispatched public ping — awaiting WebSocket push");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setApiResponse(`ERROR: ${msg}`);
      addLog("error", `Ping failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }, [addLog]);

  const checkConfig = useCallback(async () => {
    addLog("info", "GET /realtime/health …");
    try {
      const res = await api.get("/realtime/health");
      setApiResponse(JSON.stringify(res.data, null, 2));
      addLog("success", "Fetched backend broadcasting config");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog("error", `Config fetch failed: ${msg}`);
    }
  }, [addLog]);

  const connected = status === "connected";

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 font-mono text-sm">
      <header className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h1 className="text-lg font-bold">🔌 Reverb WebSocket Console</h1>
        <p className="mt-1 text-xs text-gray-500">
          End-to-end test: Frontend ⇄ reverb_server ⇄ backend broadcasting
        </p>
      </header>

      <section className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className={`h-3 w-3 rounded-full ${STATUS_DOT[status]}`} />
          <span className="font-semibold">{STATUS_LABELS[status]}</span>
          {socketId && (
            <span className="text-xs text-gray-500">
              socket_id:{" "}
              <span className="text-green-600 dark:text-green-400">{socketId}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={firePublicPing}
            disabled={busy || !connected}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40"
          >
            🚀 Trigger public ping
          </button>
          <button
            type="button"
            onClick={checkConfig}
            className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Check backend config
          </button>
          <button
            type="button"
            onClick={() => {
              setEvents([]);
              setLogs([]);
              setApiResponse(null);
            }}
            className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Clear
          </button>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-1 border-t border-gray-200 pt-2 text-xs text-gray-500 sm:grid-cols-2 dark:border-gray-700">
          <div>
            WS Host:{" "}
            <span className="text-gray-900 dark:text-gray-100">
              {messagingEnv.reverbHost || "⚠️ MISSING"}
            </span>
          </div>
          <div>
            WS Port:{" "}
            <span className="text-gray-900 dark:text-gray-100">{messagingEnv.reverbPort}</span>
          </div>
          <div>
            Scheme:{" "}
            <span className="text-gray-900 dark:text-gray-100">{messagingEnv.reverbScheme}</span>
          </div>
          <div>
            App Key:{" "}
            <span className="text-gray-900 dark:text-gray-100">
              {messagingEnv.reverbKey ? `${messagingEnv.reverbKey.slice(0, 8)}…` : "⚠️ MISSING"}
            </span>
          </div>
          <div className="sm:col-span-2">
            Private channel:{" "}
            <span className="text-gray-900 dark:text-gray-100">
              {isAuthenticated && user?.id != null
                ? `App.Models.User.${user.id} (listening)`
                : "log in to test private notifications"}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <h2 className="mb-2 font-semibold">📨 Received events ({events.length})</h2>
          <div className="h-64 space-y-2 overflow-y-auto rounded bg-gray-50 p-2 dark:bg-gray-900/40">
            {events.length === 0 ? (
              <p className="mt-8 text-center text-gray-500">No events yet.</p>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded border border-gray-200 p-2 text-xs dark:border-gray-700"
                >
                  <div className="mb-1 flex justify-between text-gray-500">
                    <span className="text-green-600 dark:text-green-400">
                      {ev.channel} → {ev.event}
                    </span>
                    <span>{ev.ts}</span>
                  </div>
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(ev.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <h2 className="mb-2 font-semibold">📋 Debug log ({logs.length})</h2>
          <div className="h-64 space-y-0.5 overflow-y-auto rounded bg-gray-50 p-2 dark:bg-gray-900/40">
            {logs.length === 0 ? (
              <p className="mt-8 text-center text-gray-500">No log entries.</p>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="flex gap-2 text-xs leading-5">
                  <span className="shrink-0 text-gray-500">{l.ts}</span>
                  <span
                    className={
                      l.level === "error"
                        ? "text-red-500"
                        : l.level === "warn"
                          ? "text-yellow-600"
                          : l.level === "success"
                            ? "text-green-600 dark:text-green-400"
                            : "text-blue-500"
                    }
                  >
                    [{l.level.toUpperCase()}]
                  </span>
                  <span className="break-all">{l.message}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {apiResponse && (
        <section className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <h2 className="mb-2 font-semibold">🔗 Last API response</h2>
          <pre
            className={`whitespace-pre-wrap break-all rounded bg-gray-50 p-2 text-xs dark:bg-gray-900/40 ${
              apiResponse.startsWith("ERROR")
                ? "text-red-500"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {apiResponse}
          </pre>
        </section>
      )}
    </div>
  );
}
