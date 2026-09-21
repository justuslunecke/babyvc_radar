import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Lexend_Deca } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";

const lexend = Lexend_Deca({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  title: "baby vc radar",
  description:
    "Funds, companies, funding signals, open roles, learning and networking across the European startup ecosystem. A baby vc alumni tool.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={lexend.variable}>
      <body>
        <Shell>{children}</Shell>
        <Analytics />
      </body>
    </html>
  );
}
