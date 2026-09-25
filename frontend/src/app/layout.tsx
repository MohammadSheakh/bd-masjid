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
    <html lang="en">
      <body className="min-h-screen bg-[#fafafa] text-[#111114] antialiased">
        {children}
      </body>
    </html>
  );
}
