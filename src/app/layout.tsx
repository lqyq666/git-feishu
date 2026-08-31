import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "大学生现实探索系统",
  description: "从一个现实问题出发，完成下一步行动。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
