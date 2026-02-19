import type { Metadata } from "next";
import { Keania_One, Anek_Bangla, Inter } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "./context/NotificationContext";
import { TimeSheetProvider } from "./context/TimeSheetContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const keanianOne = Keania_One({
  variable: "--font-keania-one",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: true,
});

const anekBangla = Anek_Bangla({
  variable: "--font-anek-bangla",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: true,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "DELAtech Time System",
  description: "Time tracking and timesheet management system",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: "#244B77",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${keanianOne.variable} ${anekBangla.variable} ${inter.variable} antialiased`}
      >
        <Providers>
          <LanguageProvider>
            <NotificationProvider>
              <TimeSheetProvider>{children}</TimeSheetProvider>
            </NotificationProvider>
          </LanguageProvider>
        </Providers>
        <Toaster duration={10000} richColors={true} position="top-center" />
      </body>
    </html>
  );
}
