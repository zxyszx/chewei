import { siHbo, siNetflix, siSpotify, siTidal, type SimpleIcon } from "simple-icons";
import { cn } from "@/lib/utils";

const brandIcons: Record<string, SimpleIcon> = {
  hbo: siHbo,
  netflix: siNetflix,
  spotify: siSpotify,
  tidal: siTidal,
};

const fallbackColors: Record<string, string> = {
  "disney-plus": "#113ccf",
  iqiyi: "#00be06",
  "prime-video": "#00a8e1",
  viki: "#5b4cff",
};

export function PlatformIcon({ slug, name, icon: customIcon, size = 18, className }: { slug: string; name: string; icon?: string | null; size?: number; className?: string }) {
  const icon = brandIcons[slug];
  const color = icon ? `#${icon.hex}` : fallbackColors[slug] || "#667085";

  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center rounded-[5px] bg-white", className)}
      style={{ width: size + 8, height: size + 8 }}
      aria-hidden="true"
    >
      {customIcon ? (
        <span className="block size-full rounded-[4px] bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${JSON.stringify(customIcon)})` }} />
      ) : icon ? (
        <svg width={size} height={size} viewBox="0 0 24 24" role="img">
          <path d={icon.path} fill={color} />
        </svg>
      ) : (
        <span className="font-bold leading-none" style={{ color, fontSize: Math.max(11, size - 4) }}>{name.slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}
