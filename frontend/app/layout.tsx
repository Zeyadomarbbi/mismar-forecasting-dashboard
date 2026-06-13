import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  variable: "--font-tajawal",
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "لوحة توقع طلبات الغسيل | مسمار",
  description:
    "لوحة عربية تجريبية MVP لعرض توقع طلبات الغسيل بشكل مبسط وسريع.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        suppressHydrationWarning
        className={`${cairo.variable} ${tajawal.variable} font-sans`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
