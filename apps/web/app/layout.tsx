import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { TextSizeProvider } from "@/components/ui/TextSizeProvider";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BajetBuddy — Duit smart, hidup lega",
  description:
    "Malaysia's AI-powered spending intervention engine. Stop bad decisions before they happen.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.ico",
    apple: "/logo.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#BA6200",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${fredoka.variable} ${nunitoSans.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TextSizeProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                borderRadius: "16px",
                padding: "14px 18px",
                fontSize: "14px",
                fontFamily: "var(--font-nunito), sans-serif",
              },
            }}
          />
        </TextSizeProvider>
      </body>
    </html>
  );
}
