"use client";
import { useEffect } from "react";
import { trackProductEvent } from "@/lib/analytics/client";
import type { ProductEventName } from "@/lib/analytics/events";
export function ProductEvent({ name }: { name: ProductEventName }) { useEffect(() => { void trackProductEvent(name); }, [name]); return null; }
