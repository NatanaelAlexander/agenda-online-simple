export const SOCIAL_NETWORKS = [
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/…",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/…",
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    placeholder: "https://x.com/…",
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/…",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@…",
  },
] as const;

export type SocialNetworkKey = (typeof SOCIAL_NETWORKS)[number]["key"];

export type BusinessSocialLinks = Partial<Record<SocialNetworkKey, string>>;

export function parseSocialLinks(
  value: Record<string, unknown> | null | undefined,
): BusinessSocialLinks {
  if (!value || typeof value !== "object") return {};
  const out: BusinessSocialLinks = {};
  for (const { key } of SOCIAL_NETWORKS) {
    const raw = value[key];
    if (typeof raw === "string" && raw.trim()) {
      out[key] = raw.trim();
    }
  }
  return out;
}

/** Normaliza URLs y omite vacíos. Devuelve objeto listo para guardar. */
export function buildSocialLinks(
  draft: BusinessSocialLinks,
): BusinessSocialLinks {
  const out: BusinessSocialLinks = {};
  for (const { key } of SOCIAL_NETWORKS) {
    const raw = draft[key]?.trim();
    if (!raw) continue;
    out[key] = normalizeHttpUrl(raw);
  }
  return out;
}

export function hasAnySocialLink(links: BusinessSocialLinks): boolean {
  return SOCIAL_NETWORKS.some(({ key }) => Boolean(links[key]?.trim()));
}

function normalizeHttpUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}
