import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { siteUrl } from "@/lib/site-url";
import { TRPCReactProvider } from "@/trpc/client";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { MercadoPagoProvider } from "./context/mercado-pago-provider";
import "./globals.css";

const roboto = Roboto({
  weight: "600",
  subsets: ["vietnamese"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "My Market | Cardápio e Delivery",
  icons: {
    icon: "/icon.png",
  },
  description:
    "Confira o cardápio do My Market e peça seus produtos favoritos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-br"
      suppressHydrationWarning
      className={`antialiased ${roboto.className}`}
    >
      <body className="h-full min-h-screen">
        <TRPCReactProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </TRPCReactProvider>
        <Toaster />
        <MercadoPagoProvider />
      </body>
    </html>
  );
}
