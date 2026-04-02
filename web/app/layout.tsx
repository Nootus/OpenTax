import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import AppHeader from "./AppHeader";
import "./globals.css";
import { FilingProvider } from "@/filing/context/FilingContext";
import { MasterDataProvider } from "@/filing/context/MasterDataContext";
import { ToasterProvider } from "@/filing/ui/Toaster";
import GoogleAnalytics from "@/filing/analytics/GoogleAnalytics";
import ContactUs from "@/filing/components/ContactUs";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://opentax.indiatax.ai"),
  title: "OpenTax — Free & Open-Source ITR Filing",
  description:
    "OpenTax is a free, open-source Indian income tax return filing application. No login required. Fill in your details and submit your ITR-1 data with one click.",
  keywords: ["OpenTax", "open source", "ITR filing", "income tax India", "ITR-1", "free tax filing", "IndiaTax.AI"],
  authors: [{ name: "IndiaTax.AI" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://opentax.indiatax.ai",
    siteName: "OpenTax",
    title: "OpenTax — Free & Open-Source ITR Filing",
    description:
      "OpenTax is a free, open-source Indian income tax return filing application powered by IndiaTax.AI.",
    images: [
      {
        url: "/meta.png",
        width: 1200,
        height: 630,
        alt: "OpenTax — Free & Open-Source ITR Filing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenTax — Free & Open-Source ITR Filing",
    description:
      "OpenTax is a free, open-source Indian income tax return filing application powered by IndiaTax.AI.",
    images: ["/meta.png"],
    creator: "@indiataxai",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}
      >
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        <MasterDataProvider>
        <FilingProvider>
          <ToasterProvider>
            <AppHeader />
            {children}
            <ContactUs />
          </ToasterProvider>
        </FilingProvider>
        </MasterDataProvider>
      </body>
    </html>
  );
}
