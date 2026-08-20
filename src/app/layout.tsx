import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import LayoutShell from "@/components/LayoutShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://newstepfootwear.lk"),
  title: {
    default: "New Step Footwear Store | Buy Shoes Online Sri Lanka",
    template: "%s | New Step Footwear",
  },
  description:
    "Shop shoes online in Sri Lanka with cash on delivery and island-wide delivery. Live size availability on men's, women's and kids' footwear.",
  keywords: [
    "shoes online Sri Lanka",
    "footwear online Sri Lanka",
    "buy shoes online Sri Lanka cash on delivery",
  ],
  openGraph: {
    type: "website",
    siteName: "New Step Footwear Store",
    locale: "en_LK",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
