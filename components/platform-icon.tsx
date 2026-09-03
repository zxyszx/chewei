import {
  siApplemusic, siAppletv, siClaude, siCrunchyroll, siDeezer, siDropbox,
  siEmby, siGoogledrive, siGooglegemini, siHbo, siHbomax, siJellyfin,
  siNetflix, siNotion, siParamountplus, siPerplexity, siPlaystation, siPlex,
  siSpotify, siSteam, siTidal, siYoutube, siYoutubemusic, type SimpleIcon,
} from "simple-icons";
import { cn } from "@/lib/utils";

const brandIcons: Record<string, SimpleIcon> = {
  hbo: siHbo,
  "hbo-max": siHbomax,
  netflix: siNetflix,
  spotify: siSpotify,
  tidal: siTidal,
  "apple-music": siApplemusic,
  "apple-tv": siAppletv,
  claude: siClaude,
  crunchyroll: siCrunchyroll,
  deezer: siDeezer,
  dropbox: siDropbox,
  emby: siEmby,
  "google-drive": siGoogledrive,
  gemini: siGooglegemini,
  jellyfin: siJellyfin,
  notion: siNotion,
  "paramount-plus": siParamountplus,
  perplexity: siPerplexity,
  playstation: siPlaystation,
  plex: siPlex,
  steam: siSteam,
  "youtube-premium": siYoutube,
  "youtube-music": siYoutubemusic,
};

const fallbackColors: Record<string, string> = {
  "disney-plus": "#113ccf",
  iqiyi: "#00be06",
  "prime-video": "#00a8e1",
  viki: "#5b4cff",
  chatgpt: "#10a37f",
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
