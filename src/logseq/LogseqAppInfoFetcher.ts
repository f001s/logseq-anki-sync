import "@logseq/libs";

/**
 * LogseqAppInfoFetcher - Provides abstracted access to Logseq app information
 * and host environment checks with consistent error handling
 */
export class LogseqAppInfoFetcher {
    /**
     * Check if the current graph is a database graph
     * @returns Promise<boolean> - true if current graph is a database graph, false otherwise
     */
    static async checkCurrentIsDbGraph(): Promise<boolean> {
        try {
            const value = await logseq.App.checkCurrentIsDbGraph();
            if (typeof value === "boolean") {
                return value;
            }
        } catch (_e) {
            // Silently fail and return false
        }
        return false;
    }

    /**
     * Check if the host scope (parent window) is accessible
     * @param targetWindow - The window to check access for (defaults to window.parent)
     * @returns boolean - true if host scope is accessible, false otherwise
     */
    static checkHostAccess(targetWindow: Window = window.parent): boolean {
        try {
            // Access addEventListener to check if the window is accessible
            return targetWindow.addEventListener !== null;
        } catch {
            return false;
        }
    }

    /**
     * Check if the plugin is running inside the Logseq desktop app.
     *
     * Recent Logseq desktop builds may isolate plugin iframes behind a separate
     * lsp:// origin. In that case parent-window access is blocked even though
     * desktop-only capabilities, such as local asset access, are still available.
     */
    static checkCurrentIsDesktopApp(): boolean {
        try {
            return /Logseq\/.+Electron\//.test(window.navigator.userAgent);
        } catch {
            return false;
        }
    }

    static checkCanAccessLocalAssets(): boolean {
        return (
            LogseqAppInfoFetcher.checkCurrentIsDesktopApp() ||
            LogseqAppInfoFetcher.checkHostAccess()
        );
    }
}
