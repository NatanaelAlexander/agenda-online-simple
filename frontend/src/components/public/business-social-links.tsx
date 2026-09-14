import {
  hasAnySocialLink,
  parseSocialLinks,
  SOCIAL_NETWORKS,
  type BusinessSocialLinks,
  type SocialNetworkKey,
} from "@/lib/social-links";
import { cn } from "@/lib/utils";

const iconClass = "size-5";

function SocialIcon({ network }: { network: SocialNetworkKey }) {
  switch (network) {
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} aria-hidden fill="currentColor">
          <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} aria-hidden fill="currentColor">
          <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4Zm6.4-8.5a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0ZM12 2c-2.7 0-3.04.01-4.1.06A6.1 6.1 0 0 0 3.06 7.9C3.01 8.96 3 9.3 3 12s.01 3.04.06 4.1a6.1 6.1 0 0 0 4.84 4.84c1.06.05 1.4.06 4.1.06s3.04-.01 4.1-.06a6.1 6.1 0 0 0 4.84-4.84c.05-1.06.06-1.4.06-4.1s-.01-3.04-.06-4.1A6.1 6.1 0 0 0 16.1 2.06C15.04 2.01 14.7 2 12 2Zm0 1.8c2.65 0 2.96.01 4 .06a4.3 4.3 0 0 1 4.14 4.14c.05 1.04.06 1.35.06 4s-.01 2.96-.06 4a4.3 4.3 0 0 1-4.14 4.14c-1.04.05-1.35.06-4 .06s-2.96-.01-4-.06a4.3 4.3 0 0 1-4.14-4.14c-.05-1.04-.06-1.35-.06-4s.01-2.96.06-4A4.3 4.3 0 0 1 8 3.86c1.04-.05 1.35-.06 4-.06Z" />
        </svg>
      );
    case "twitter":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} aria-hidden fill="currentColor">
          <path d="M18.244 2H21.5l-7.08 8.09L22.5 22h-6.59l-5.16-6.74L5.1 22H1.84l7.57-8.65L1.5 2h6.76l4.66 6.17L18.244 2Zm-1.16 18h1.82L7.04 3.91H5.09L17.084 20Z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} aria-hidden fill="currentColor">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.75 15.5v-7l6.2 3.5-6.2 3.5Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} aria-hidden fill="currentColor">
          <path d="M19.6 7.2a5.6 5.6 0 0 1-3.3-1.1v7.4a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.9a2.8 2.8 0 1 0 2 2.7V2h2.8a5.6 5.6 0 0 0 3.3 3.1v2.1Z" />
        </svg>
      );
  }
}

export function BusinessSocialLinksRow({
  links,
  className,
  label = "Síguenos en nuestras redes",
}: {
  links: BusinessSocialLinks | Record<string, unknown> | null | undefined;
  className?: string;
  label?: string;
}) {
  const parsed = parseSocialLinks(links ?? undefined);
  if (!hasAnySocialLink(parsed)) return null;

  return (
    <nav
      aria-label={label}
      className={cn("flex flex-col items-center gap-3", className)}
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {SOCIAL_NETWORKS.map(({ key, label: networkLabel }) => {
          const href = parsed[key];
          if (!href) return null;
          return (
            <li key={key}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={networkLabel}
                className="inline-flex size-11 items-center justify-center rounded-full border border-border/80 bg-card/80 text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              >
                <SocialIcon network={key} />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
