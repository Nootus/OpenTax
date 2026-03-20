import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import { FilingProvider } from "@/filing/context/FilingContext";
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
  metadataBase: new URL("https://github.com/nootus/OpenTax"),
  title: "OpenTax — Free & Open-Source ITR Filing",
  description:
    "OpenTax is a free, open-source Indian income tax return filing application. No login required. Fill in your details and submit your ITR-1 data with one click.",
  keywords: ["OpenTax", "open source", "ITR filing", "income tax India", "ITR-1", "free tax filing", "IndiaTax.AI"],
  authors: [{ name: "IndiaTax.AI" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://github.com/nootus/OpenTax",
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
        <FilingProvider>
          <ToasterProvider>
            {/* Global header — visible on every page/view */}
            <header className="bg-white border-b border-gray-200 shadow-sm print:hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
                {/* Left — logo + name */}
                <div className="flex items-center gap-3">
                  <Image src="/ITAI-logo.png" alt="OpenTax" width={32} height={32} className="rounded-lg" />
                  <div>
                    <h1 className="text-base font-bold text-gray-900 leading-tight">OpenTax</h1>
                    <p className="text-[10px] text-gray-400 leading-tight">Free &amp; Open-Source ITR-1 Filing</p>
                  </div>
                </div>
                {/* Right — powered by */}
                <a
                  href="https://indiatax.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
                >
                  <Image src="/logo.webp" alt="IndiaTax.AI" width={24} height={24} className="rounded" />
                  <span className="text-xs text-gray-500 hidden sm:inline">Powered by <span className="font-semibold text-blue-600">IndiaTax.AI</span></span>
                </a>
              </div>
            </header>
            {children}
            <ContactUs />
          </ToasterProvider>
        </FilingProvider>
      </body>
    </html>
  );
}
