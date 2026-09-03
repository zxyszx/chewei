import { describe, expect, it } from "vitest";
import { normalizePlatformQuery, platformCatalogItem, searchPlatformCatalog } from "./platform-catalog";

describe("platform catalog", () => {
  it("finds platforms by Chinese aliases", () => {
    expect(searchPlatformCatalog("奈飞")[0]?.slug).toBe("netflix");
    expect(searchPlatformCatalog("爱奇艺")[0]?.slug).toBe("iqiyi");
    expect(searchPlatformCatalog("网易云")[0]?.slug).toBe("netease-cloud-music");
    expect(searchPlatformCatalog("B站")[0]?.slug).toBe("bilibili");
    expect(searchPlatformCatalog("微软365")[0]?.slug).toBe("microsoft-365");
  });

  it("keeps an exact Chinese platform match available to the picker", () => {
    expect(searchPlatformCatalog("爱奇艺")).toEqual([
      expect.objectContaining({ name: "iQIYI", slug: "iqiyi" }),
    ]);
  });

  it("normalizes familiar names", () => {
    expect(normalizePlatformQuery(" YouTube Premium ")).toBe("youtube-premium");
    expect(searchPlatformCatalog("Google One")[0]?.slug).toBe("google-drive");
  });

  it("exposes stable defaults", () => {
    expect(platformCatalogItem("netflix")).toMatchObject({ name: "Netflix", defaultCapacity: 5 });
  });
});
