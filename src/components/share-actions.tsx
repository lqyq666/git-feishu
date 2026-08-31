"use client";
import { useState } from "react";
import { SHARE_COPY, type ShareCardType } from "@/lib/share/domain";
import { trackProductEvent } from "@/lib/analytics/client";
export function ShareActions({ type }: { type: ShareCardType }) {
  const [copy, setCopy] = useState(SHARE_COPY[type]);
  const [message, setMessage] = useState("");
  const imageUrl = `/api/share-card?type=${encodeURIComponent(type)}&text=${encodeURIComponent(copy)}`;
  async function share() {
    void trackProductEvent("share_clicked", { type, channel: "system" });
    try {
      if (navigator.share)
        await navigator.share({
          title: "我的现实探索",
          text: copy,
          url: location.origin,
        });
      else {
        await navigator.clipboard.writeText(`${copy}\n${location.origin}`);
        setMessage("文案和链接已复制。你决定发到哪里。 ");
      }
    } catch {
      setMessage("已取消分享，没有发送任何内容。");
    }
  }
  return (
    <section className="share-panel">
      <p className="eyebrow">可选 · 由你主动分享</p>
      <h2>分享一次真实进展，不做公开惩罚。</h2>
      <label>
        分享文案（可编辑或隐藏敏感内容）
        <textarea
          onChange={(event) => setCopy(event.target.value.slice(0, 180))}
          value={copy}
        />
      </label>
      <div className="share-actions">
        <button className="secondary-button" onClick={share} type="button">
          打开系统分享
        </button>
        <a
          className="text-link"
          download="现实探索分享卡.png"
          href={imageUrl}
          onClick={() =>
            void trackProductEvent("share_card_generated", { type })
          }
        >
          下载 1200×1500 图片
        </a>
        <button
          className="text-button"
          onClick={() => {
            void trackProductEvent("share_clicked", { type, channel: "copy" });
            void navigator.clipboard
              .writeText(copy)
              .then(() => setMessage("文案已复制。"));
          }}
          type="button"
        >
          只复制文案
        </button>
      </div>
      <p className="privacy-note">
        图片不包含邮箱、用户 ID、姓名或内部字段；产品不会替你发布。
      </p>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
