import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: "SLTC — Smart Transportation. Seamless Operations.",
  description:
    "Sri Lakshmi Transport Company (SLTC) — safe, reliable employee, school and outstation transport across Hyderabad and Telangana. AC & Non-AC fleet, 5 to 44 seaters.",
  keywords: ["transport management", "fleet", "school transport", "corporate transport", "SLTC"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
