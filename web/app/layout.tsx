import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
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
        <MasterDataProvider>
        <FilingProvider>
          <ToasterProvider>
            {/* Global header — visible on every page/view */}
            <header className="bg-white border-b border-gray-200 shadow-sm print:hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
                {/* Left — logo + name */}
                 <Link href="/">
                  <div className="flex items-center gap-3">
                    <Image src="/ITAI-logo.png" alt="OpenTax" width={32} height={32} className="rounded-lg" />
                    <div>
                      <h1 className="text-base font-bold text-gray-900 leading-tight">OpenTax</h1>
                      <p className="text-[10px] text-gray-400 leading-tight">Free &amp; Open-Source ITR Filing</p>
                    </div>
                  </div>
                </Link>
                {/* Right — nav links + GitHub + powered by */}
                <div className="flex items-center gap-4">
                  <Link
                    href="/"
                    className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    href="/about"
                    className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    About
                  </Link>
                  <a
                    href="https://github.com/nootus/OpenTax"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    title="View OpenTax on GitHub"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                    <span className="text-xs font-medium hidden sm:inline">Repository</span>
                  </a>
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
              </div>
            </header>
            {children}
            <ContactUs />
          </ToasterProvider>
        </FilingProvider>
        </MasterDataProvider>
      </body>
    </html>
  );
}
