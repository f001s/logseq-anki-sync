import "@logseq/libs";
import {beforeEach, describe, expect, test, vi} from "vitest";

const mockLogseqSettings = vi.hoisted(() => ({
    pluginSettings: {}
}));

vi.mock("../../../src/logseq/LogseqToHtmlConverter", () => ({
    LogseqToHtmlConverterProxy: {
        convertToHTMLFile: (content: string) => ({
            html: `<span>${content}</span>`,
            assets: new Set<string>(),
            tags: new Set<string>()
        })
    }
}));

vi.mock("../../../src/logseq/LogseqProxy", () => ({
    LogseqProxy: {
        Editor: {
            getBlock: () => ({properties: {}})
        },
        Settings: {
            getPluginSettings: () => mockLogseqSettings.pluginSettings
        }
    }
}));

import {MultilineCardNote} from "../../../src/anki-notes/MultilineCardNote";

describe("MultilineCardNote unit tests", () => {
    beforeEach(() => {
        mockLogseqSettings.pluginSettings = {};
    });

    test("exports DB-native task metadata on child list items", async () => {
        const note = new MultilineCardNote(
            "parent-uuid",
            "Parent",
            "markdown",
            {},
            1,
            [],
            [
                {
                    uuid: "child-uuid",
                    content: "Neutral child title",
                    format: "markdown",
                    properties: {
                        tags: ["Task"],
                        status: "logseq.property/status.doing",
                        priority: "logseq.property/priority.high",
                        deadline: 1781740800000,
                        scheduled: "2026-06-19"
                    },
                    children: []
                }
            ]
        );

        const htmlFile = await note.getClozedContentHTML();

        expect(htmlFile.html).toContain("logseq-db-task logseq-db-task--doing");
        expect(htmlFile.html).toContain('data-logseq-task-status="Doing"');
        expect(htmlFile.html).toContain('data-logseq-task-priority="High"');
        expect(htmlFile.html).toContain('data-logseq-task-deadline="2026-06-18"');
        expect(htmlFile.html).toContain('data-logseq-task-scheduled="2026-06-19"');
        expect(htmlFile.html).not.toContain("logseq-db-task-status");
        expect(htmlFile.html).not.toContain("<svg");
        expect(htmlFile.html).toContain("logseq-db-task-priority--high");
        expect(htmlFile.html).toContain('aria-label="Priority: High"');
        expect(htmlFile.html).toContain("Deadline: 2026-06-18");
        expect(htmlFile.html).toContain("Scheduled: 2026-06-19");
        expect(htmlFile.html).toContain("Neutral child title");
        expect(htmlFile.html.indexOf("Neutral child title")).toBeLessThan(
            htmlFile.html.indexOf("Deadline: 2026-06-18")
        );
    });

    test("does not export DB-native task metadata features when disabled in settings", async () => {
        mockLogseqSettings.pluginSettings = {
            exportDbTaskMetadataToAnki: false
        };
        const note = new MultilineCardNote(
            "parent-uuid",
            "Parent",
            "markdown",
            {},
            1,
            [],
            [
                {
                    uuid: "child-uuid",
                    content: "Neutral child title",
                    format: "markdown",
                    properties: {
                        tags: ["Task"],
                        status: "logseq.property/status.doing",
                        priority: "logseq.property/priority.high",
                        deadline: 1781740800000,
                        scheduled: "2026-06-19"
                    },
                    children: []
                }
            ]
        );

        const htmlFile = await note.getClozedContentHTML();

        expect(htmlFile.html).toContain('<li class="children">');
        expect(htmlFile.html).toContain("Neutral child title");
        expect(htmlFile.html).not.toContain("logseq-db-task");
        expect(htmlFile.html).not.toContain("data-logseq-task");
        expect(htmlFile.html).not.toContain("Priority: High");
        expect(htmlFile.html).not.toContain("logseq-db-task-priority");
        expect(htmlFile.html).not.toContain("Deadline: 2026-06-18");
        expect(htmlFile.html).not.toContain("Scheduled: 2026-06-19");
    });
});
