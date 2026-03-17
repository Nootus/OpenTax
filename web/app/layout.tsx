import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { FilingProvider } from "@/domain/filing/context/FilingContext";
import { ToasterProvider } from "@/domain/filing/ui/Toaster";

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
  title: "OpenTax — Free & Open-Source ITR Filing",
  description:
    "OpenTax is a free, open-source Indian income tax return filing application. No login required. Fill in your details and submit your ITR-1 data with one click.",
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
        <FilingProvider>
          <ToasterProvider>{children}</ToasterProvider>
        </FilingProvider>
      </body>
    </html>
  );
}
