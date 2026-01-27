const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

/**
 * MiniApp configuration object. Must follow the mini app manifest specification.
 *
 * @see {@link https://docs.base.org/mini-apps/features/manifest}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: "",
  },
  baseBuilder: {
    ownerAddress: "",
  },
  miniapp: {
    version: "1",
    name: "Pulse Tap",
    subtitle: "30-second combo sprint",
    description:
      "Tap the core, build combo, and chase your best score in a 30-second sprint.",
    screenshotUrls: [`${ROOT_URL}/screenshot.png`],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "games",
    tags: ["arcade", "tap", "combo"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Tap fast. Build combo. Beat your best.",
    ogTitle: "Pulse Tap",
    ogDescription: "A 30-second combo sprint built for Base Mini Apps.",
    ogImageUrl: `${ROOT_URL}/hero.png`,
  },
} as const;
