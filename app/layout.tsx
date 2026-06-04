import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import { Sparkles } from "@/components/sparkles";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Suspiro Brechó | Peças únicas com alma",
  description: "Brechó curado com peças únicas de moda de segunda mão. Cada peça conta uma história.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${jost.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased" style={{ fontFamily: "var(--font-jost)" }} suppressHydrationWarning>
        <CartProvider>
          <Sparkles />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
