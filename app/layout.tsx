import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AI 健身助手",
    template: "%s · AI 健身助手",
  },
  description:
    "AI 健身助手 —— 帮健身小白科学减脂/增肌：热量计算、训练记录、AI 拍照识餐、未来身材预览。",
  applicationName: "AI 健身助手",
  keywords: ["健身", "减脂", "增肌", "AI 识餐", "卡路里", "训练记录"],
  authors: [{ name: "AI 健身团队" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI 健身",
  },
  formatDetection: {
    telephone: false,  // 禁止 iOS Safari 自动把数字识别成电话链接
    email: false,
    address: false,
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,       // 防止页面被双指缩放，模拟 App 体验
  userScalable: false,
  viewportFit: "cover",  // iPhone 刘海屏支持
  themeColor: "#07090C",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={jetbrainsMono.variable}>
      <head>
        {/* 微信内置浏览器专用：强制清除缓存，支持全屏 */}
        <meta name="format-detection" content="telephone=no,email=no,address=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* 兼容 QQ / 微信 X5 内核 */}
        <meta name="x5-orientation" content="portrait" />
        <meta name="screen-orientation" content="portrait" />
        <meta name="full-screen" content="yes" />
        <meta name="browsermode" content="application" />
      </head>
      <body>
        <div className="mobile-shell">{children}</div>
        <Toaster position="top-center" richColors closeButton theme="dark" />
      </body>
    </html>
  );
}
