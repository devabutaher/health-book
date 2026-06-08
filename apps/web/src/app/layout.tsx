import type { Metadata, Viewport } from "next";
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { ReduxProvider } from "@/components/shared/ReduxProvider";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { MotionProvider } from "@/components/shared/MotionProvider";
import PWAProvider from "@/components/shared/PWAProvider";
import { themeInitScript } from "@/lib/theme";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "HealthBook",
  description: "Your health journey, shared",
  manifest: "/manifest.json",
  icons: { icon: "/icons/icon.svg" },
  appleWebApp: { capable: true, title: "HealthBook", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#080C14" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased dark", dmSans.variable, bricolage.variable, "font-sans")}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Script src="https://widget.cloudinary.com/v2.0/global/all.js" strategy="lazyOnload" />
        <ReduxProvider>
          <ThemeProvider>
            <AuthProvider>
              <MotionProvider>
                <PWAProvider>{children}</PWAProvider>
              </MotionProvider>
            </AuthProvider>
          </ThemeProvider>
        </ReduxProvider>
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              borderRadius: "14px",
              backdropFilter: "blur(20px)",
            },
          }}
        />
      </body>
    </html>
  );
}
