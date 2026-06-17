import {describe, expect, test, vi} from "vitest";
import {LogseqAppInfoFetcher} from "../../../src/logseq/LogseqAppInfoFetcher";

describe("LogseqAppInfoFetcher", () => {
    test("recognizes desktop Logseq even when parent-window access is cross-origin blocked", () => {
        vi.spyOn(LogseqAppInfoFetcher, "checkHostAccess").mockReturnValue(false);
        vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(
            "Mozilla/5.0 Logseq/2.0.1 Chrome/148.0.7778.180 Electron/42.3.0 Safari/537.36"
        );

        expect(LogseqAppInfoFetcher.checkCurrentIsDesktopApp()).toBe(true);
        expect(LogseqAppInfoFetcher.checkCanAccessLocalAssets()).toBe(true);
    });

    test("treats true web environment as no local-asset access", () => {
        vi.spyOn(LogseqAppInfoFetcher, "checkHostAccess").mockReturnValue(false);
        vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(
            "Mozilla/5.0 AppleWebKit/537.36 Chrome/148.0.7778.180 Safari/537.36"
        );

        expect(LogseqAppInfoFetcher.checkCurrentIsDesktopApp()).toBe(false);
        expect(LogseqAppInfoFetcher.checkCanAccessLocalAssets()).toBe(false);
    });
});
