"use client";
import type { ProductEventName } from "./events";
export function trackProductEvent(eventName: ProductEventName, properties: Record<string, unknown> = {}) { return fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventName, properties }), keepalive: true }).catch(() => undefined); }
