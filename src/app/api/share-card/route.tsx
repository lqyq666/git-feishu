import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { isSafeShareCopy, SHARE_COPY, type ShareCardType } from "@/lib/share/domain";

export const runtime = "edge";
export function GET(request: NextRequest) {
  const rawType = request.nextUrl.searchParams.get("type") ?? "DISCOVERY"; const type = (rawType in SHARE_COPY ? rawType : "DISCOVERY") as ShareCardType;
  const custom = (request.nextUrl.searchParams.get("text") ?? "").slice(0, 180); const copy = custom && isSafeShareCopy(custom) ? custom : SHARE_COPY[type];
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f6f0", color: "#173127", padding: "110px", fontFamily: "sans-serif" }}><div style={{ display: "flex", flexDirection: "column" }}><span style={{ color: "#176b4d", fontSize: 34, fontWeight: 700 }}>大学生现实探索</span><h1 style={{ marginTop: 90, fontSize: 78, lineHeight: 1.25, letterSpacing: "-2px" }}>{copy}</h1></div><div style={{ display: "flex", flexDirection: "column", borderTop: "3px solid #cfe0d6", paddingTop: 36 }}><strong style={{ fontSize: 36 }}>方向不是想出来的，是验证出来的。</strong><span style={{ marginTop: 14, fontSize: 27, color: "#607068" }}>由我主动生成 · 不含身份信息</span></div></div>, { width: 1200, height: 1500 });
}
