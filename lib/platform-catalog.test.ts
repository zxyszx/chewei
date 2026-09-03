import { describe, expect, it } from "vitest";
import { normalizePlatformQuery, platformCatalogItem, searchPlatformCatalog } from "./platform-catalog";

describe("platform catalog", () => {
  it("finds platforms by Chinese aliases", () => {
    expect(searchPlatformCatalog("奈飞")[0]?.slug).toBe("netflix");
    expect(searchPlatformCatalog("爱奇艺")[0]?.slug).toBe("iqiyi");
  });

  it("normalizes familiar names", () => {
    expect(normalizePlatformQuery(" YouTube Premium ")).toBe("youtube-premium");
    expect(searchPlatformCatalog("Google One")[0]?.slug).toBe("google-drive");
  });

  it("exposes stable defaults", () => {
    expect(platformCatalogItem("netflix")).toMatchObject({ name: "Netflix", defaultCapacity: 5 });
  });
});
