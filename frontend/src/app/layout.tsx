import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mosque Platform | Community Mosques & Prayer Timetables",
  description: "Find local mosques, accurate prayer and Jamaat schedules, track attendance, and contribute verified community updates across Bangladesh.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-screen min-h-[100dvh] bg-[#fafafa] text-[#111114] antialiased">
        {children}
      </body>
    </html>
  );
}
