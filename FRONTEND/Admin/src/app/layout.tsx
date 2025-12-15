import "@/css/satoshi.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import { LayoutWrapper } from "./layout-wrapper";
import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s |Service Management",
    default: "Service Management",
  },
  description:
    "Service Management integrations for fast dashboard development.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Service Management",
    description: "Service Management integrations for fast dashboard development.",
    images: [
      {
        url: "/images/logo/aquapulse_logo.png",
        width: 512,
        height: 512,
        alt: "Service Management Logo",
      },
    ],
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
