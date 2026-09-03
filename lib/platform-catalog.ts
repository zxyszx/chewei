export type PlatformCatalogItem = {
  name: string;
  slug: string;
  category: "影音" | "音乐" | "AI" | "效率" | "游戏";
  defaultCapacity: number;
  aliases: string[];
};

export const platformCatalog: PlatformCatalogItem[] = [
  { name: "Netflix", slug: "netflix", category: "影音", defaultCapacity: 5, aliases: ["奈飞", "网飞"] },
  { name: "Disney+", slug: "disney-plus", category: "影音", defaultCapacity: 7, aliases: ["disney", "迪士尼"] },
  { name: "HBO", slug: "hbo", category: "影音", defaultCapacity: 5, aliases: ["hbo max", "max"] },
  { name: "Prime Video", slug: "prime-video", category: "影音", defaultCapacity: 6, aliases: ["amazon", "亚马逊"] },
  { name: "Apple TV+", slug: "apple-tv", category: "影音", defaultCapacity: 6, aliases: ["appletv", "苹果电视"] },
  { name: "YouTube Premium", slug: "youtube-premium", category: "影音", defaultCapacity: 6, aliases: ["youtube", "油管"] },
  { name: "Paramount+", slug: "paramount-plus", category: "影音", defaultCapacity: 6, aliases: ["paramount"] },
  { name: "Crunchyroll", slug: "crunchyroll", category: "影音", defaultCapacity: 5, aliases: ["cr"] },
  { name: "Plex", slug: "plex", category: "影音", defaultCapacity: 5, aliases: [] },
  { name: "Emby", slug: "emby", category: "影音", defaultCapacity: 5, aliases: [] },
  { name: "Jellyfin", slug: "jellyfin", category: "影音", defaultCapacity: 5, aliases: [] },
  { name: "iQIYI", slug: "iqiyi", category: "影音", defaultCapacity: 5, aliases: ["爱奇艺"] },
  { name: "Tencent Video", slug: "tencent-video", category: "影音", defaultCapacity: 5, aliases: ["腾讯视频", "腾讯", "WeTV"] },
  { name: "Youku", slug: "youku", category: "影音", defaultCapacity: 5, aliases: ["优酷"] },
  { name: "Bilibili", slug: "bilibili", category: "影音", defaultCapacity: 4, aliases: ["哔哩哔哩", "B站"] },
  { name: "Mango TV", slug: "mango-tv", category: "影音", defaultCapacity: 5, aliases: ["芒果TV", "芒果"] },
  { name: "Hulu", slug: "hulu", category: "影音", defaultCapacity: 6, aliases: [] },
  { name: "MUBI", slug: "mubi", category: "影音", defaultCapacity: 5, aliases: [] },
  { name: "DAZN", slug: "dazn", category: "影音", defaultCapacity: 5, aliases: [] },
  { name: "ViKi", slug: "viki", category: "影音", defaultCapacity: 4, aliases: [] },
  { name: "Spotify", slug: "spotify", category: "音乐", defaultCapacity: 6, aliases: [] },
  { name: "Apple Music", slug: "apple-music", category: "音乐", defaultCapacity: 6, aliases: ["苹果音乐"] },
  { name: "YouTube Music", slug: "youtube-music", category: "音乐", defaultCapacity: 6, aliases: [] },
  { name: "Tidal", slug: "tidal", category: "音乐", defaultCapacity: 6, aliases: [] },
  { name: "Deezer", slug: "deezer", category: "音乐", defaultCapacity: 6, aliases: [] },
  { name: "QQ Music", slug: "qq-music", category: "音乐", defaultCapacity: 6, aliases: ["QQ音乐", "腾讯音乐"] },
  { name: "NetEase Cloud Music", slug: "netease-cloud-music", category: "音乐", defaultCapacity: 6, aliases: ["网易云", "网易云音乐"] },
  { name: "ChatGPT", slug: "chatgpt", category: "AI", defaultCapacity: 5, aliases: ["openai", "gpt"] },
  { name: "Claude", slug: "claude", category: "AI", defaultCapacity: 5, aliases: ["anthropic"] },
  { name: "Gemini", slug: "gemini", category: "AI", defaultCapacity: 5, aliases: ["google ai"] },
  { name: "Perplexity", slug: "perplexity", category: "AI", defaultCapacity: 5, aliases: [] },
  { name: "Midjourney", slug: "midjourney", category: "AI", defaultCapacity: 5, aliases: ["MJ"] },
  { name: "GitHub Copilot", slug: "github-copilot", category: "AI", defaultCapacity: 5, aliases: ["copilot"] },
  { name: "Notion", slug: "notion", category: "效率", defaultCapacity: 10, aliases: [] },
  { name: "Dropbox", slug: "dropbox", category: "效率", defaultCapacity: 6, aliases: [] },
  { name: "Google Drive", slug: "google-drive", category: "效率", defaultCapacity: 6, aliases: ["google one", "谷歌云盘"] },
  { name: "Microsoft 365", slug: "microsoft-365", category: "效率", defaultCapacity: 6, aliases: ["office 365", "微软365"] },
  { name: "Canva", slug: "canva", category: "效率", defaultCapacity: 5, aliases: ["可画"] },
  { name: "Steam", slug: "steam", category: "游戏", defaultCapacity: 5, aliases: [] },
  { name: "PlayStation", slug: "playstation", category: "游戏", defaultCapacity: 5, aliases: ["psn", "ps5"] },
  { name: "Xbox Game Pass", slug: "xbox-game-pass", category: "游戏", defaultCapacity: 5, aliases: ["xbox", "xgp"] },
  { name: "Nintendo Switch Online", slug: "nintendo-switch-online", category: "游戏", defaultCapacity: 8, aliases: ["switch", "nso", "任天堂"] },
];

export function normalizePlatformQuery(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[+_\s]+/g, "-");
}

export function searchPlatformCatalog(query: string) {
  const normalized = normalizePlatformQuery(query);
  if (!normalized) return platformCatalog;
  return platformCatalog.filter((item) =>
    [item.name, item.slug, item.category, ...item.aliases]
      .map(normalizePlatformQuery)
      .some((value) => value.includes(normalized)),
  );
}

export function platformCatalogItem(slug: string) {
  return platformCatalog.find((item) => item.slug === slug);
}
