import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "@/minikit.config";
import { RootProvider } from "./rootProvider";
import "./globals.css";

const baseAppId = process.env.NEXT_PUBLIC_BASE_APP_ID || "";

export async function generateMetadata(): Promise<Metadata> {
  const other: Record<string, string> = {
    "fc:miniapp": JSON.stringify({
      version: minikitConfig.miniapp.version,
      imageUrl: minikitConfig.miniapp.heroImageUrl,
      button: {
        title: `Launch ${minikitConfig.miniapp.name}`,
        action: {
          name: `Launch ${minikitConfig.miniapp.name}`,
          type: "launch_miniapp",
        },
      },
    }),
  };

  if (baseAppId) {
    other["base:app_id"] = baseAppId;
  }

  return {
    title: minikitConfig.miniapp.name,
    description: minikitConfig.miniapp.description,
    other,
  };
}

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootProvider>
      <html lang="en">
        <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
          <SafeArea>{children}</SafeArea>
        </body>
      </html>
    </RootProvider>
  );
}
