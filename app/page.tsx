"use client";

import { useEffect, useRef, useState } from "react";
import mqtt from "mqtt";

type ConnStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

const MQTT_URL =
  process.env.NEXT_PUBLIC_MQTT_URL ?? "wss://test.mosquitto.org:8081/mqtt";
const TOPIC = process.env.NEXT_PUBLIC_MQTT_TOPIC ?? "device/ESP32-D15644";

type AmountSpec = { label: string; amount: number; drop: number };
const AMOUNTS: AmountSpec[] = [
  { label: "30 THB", amount: 30, drop: 3 },
  { label: "40 THB", amount: 40, drop: 4 },
  { label: "50 THB", amount: 50, drop: 5 },
];

export default function Page() {
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<any | null>(null);
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const cooldownTimerRef = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    // Generate a reasonably unique client id
    const clientId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `web-${crypto.randomUUID()}`
        : `web-${Math.random().toString(16).slice(2)}-${Date.now()}`;

    const client = mqtt.connect(MQTT_URL, {
      clientId,
      clean: true,
      reconnectPeriod: 2000,
      connectTimeout: 30_000,
      keepalive: 60,
      protocolVersion: 4, // MQTT 3.1.1
    });

    clientRef.current = client;
    setStatus("connecting");
    setError(null);

    client.on("connect", () => {
      setStatus("connected");
      setError(null);
    });
    client.on("reconnect", () => setStatus("reconnecting"));
    client.on("close", () => setStatus("disconnected"));
    client.on("error", (err: any) => {
      console.error("MQTT error:", err);
      setStatus("error");
      setError(err?.message ?? String(err));
    });

    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
      client.end(true);
    };
  }, []);

  const startCooldown = (sec = 5) => {
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    setCooldown(sec);
    cooldownTimerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          cooldownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const publishPayment = (amount: number, drop: number) => {
    if (
      !clientRef.current ||
      (status !== "connected" && status !== "reconnecting")
    )
      return;
    if (cooldown > 0) return;

    const payload = {
      command: "COINDROP",
      payload: { amount, drop_count: drop },
    };
    const json = JSON.stringify(payload);

    setLoadingAmount(amount);
    setError(null);

    clientRef.current.publish(TOPIC, json, { qos: 1 }, (err: any) => {
      setLoadingAmount(null);
      if (err) {
        console.error("Publish error:", err);
        setError(err?.message ?? String(err));
        return;
      }
      startCooldown(5);
    });
  };

  const pct = cooldown > 0 ? 100 - ((cooldown - 0) / 5) * 100 : 0;
  const humanStatus = (s: ConnStatus) => {
    switch (s) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "reconnecting":
        return "Reconnecting...";
      case "disconnected":
        return "Disconnected";
      case "error":
        return "Error";
    }
  };

  return (
    <main className="center">
      <section className="card" aria-live="polite">
        <div className="header">
          <h1 className="title">Payment Simulation (MQTT)</h1>
          <span className="status" title={humanStatus(status)}>
            <span className={`dot ${status}`}></span>
            <strong>{humanStatus(status)}</strong>
          </span>
        </div>

        <div className="topic">
          <div>
            <strong>Broker</strong>: <span className="mono">{MQTT_URL}</span>
          </div>
          <div>
            <strong>Topic</strong>: <span className="mono">{TOPIC}</span>
          </div>
        </div>

        <div className="btn-row">
          {AMOUNTS.map(({ label, amount, drop }) => {
            const disabled =
              status !== "connected" || cooldown > 0 || loadingAmount !== null;
            const isLoading = loadingAmount === amount;
            return (
              <button
                key={amount}
                className="btn"
                disabled={disabled}
                onClick={() => publishPayment(amount, drop)}
                aria-busy={isLoading}
                aria-label={`Publish ${label}`}
              >
                {isLoading ? <span className="spinner" aria-hidden /> : null}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {cooldown > 0 && (
          <div className="cooldown" role="status" aria-live="polite">
            <strong>Cooldown:</strong>
            <div className="bar" aria-hidden>
              <span style={{ ["--pct" as any]: `${pct}%` }}></span>
            </div>
            <span className="mono">{cooldown}s</span>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, color: "var(--bad)" }}>
            <strong>MQTT Error:</strong> <span className="mono">{error}</span>
          </div>
        )}

        <div className="footer">
          <span className="muted">Payload รูปแบบ:</span>
          <code className="code">
            {`{
  "command": "COINDROP",
  "payload": { "amount": <30|40|50>, "drop_count": <3|4|5> }
}`}
          </code>
        </div>
      </section>
    </main>
  );
}
