import * as fs from "node:fs";
import {beforeAll, describe, expect, test} from "vitest";
import {getTemplateMediaFiles} from "../../../src/anki-template/AnkiCardTemplates";

describe("Anki Card Templates JavaScript Build Tests", () => {
    let templateMediaFiles = getTemplateMediaFiles();

    beforeAll(() => {
        templateMediaFiles = getTemplateMediaFiles();
    });

    describe("_logseq_anki_sync_front.js (Front Side JavaScript)", () => {
        let jsContent = "";

        beforeAll(() => {
            jsContent = templateMediaFiles["_logseq_anki_sync_front.js"];
        });

        test("should be valid JavaScript (no syntax errors)", () => {
            expect(() => {
                new Function(jsContent);
            }).not.toThrow();
        });

        test("should contain compiled code from fabric.js", () => {
            expect(jsContent).toMatch(/fabric\.js/i);
        });

        test("should preserve multiline placeholders as dedicated layout class", () => {
            expect(jsContent).toContain("logseq-cloze-placeholder");
            expect(jsContent).toMatch(/window\.type={2,3}"multiline_card"/);
        });
    });

    describe("_logseq_anki_sync_back.js (Back Side JavaScript)", () => {
        let jsContent = "";

        beforeAll(() => {
            jsContent = templateMediaFiles["_logseq_anki_sync_back.js"];
        });

        test("should be valid JavaScript (no syntax errors)", () => {
            expect(() => {
                new Function(jsContent);
            }).not.toThrow();
        });
    });

    describe("_logseq_anki_sync.js (Both Side JavaScript)", () => {
        let jsContent = "";

        beforeAll(() => {
            jsContent = templateMediaFiles["_logseq_anki_sync.js"];
        });

        test("should be valid JavaScript (no syntax errors)", () => {
            expect(() => {
                new Function(jsContent);
            }).not.toThrow();
        });
    });

    describe("template media manifest", () => {
        test("should expose the shared template assets that Anki loads", () => {
            expect(Object.keys(templateMediaFiles)).toEqual([
                "_logseq_anki_sync.css",
                "_logseq_anki_sync_front.css",
                "_logseq_anki_sync_back.css",
                "_logseq_anki_sync.js",
                "_logseq_anki_sync_front.js",
                "_logseq_anki_sync_back.js"
            ]);
        });

        test("should include lighter DB task and embed styling", () => {
            const logseqAnkiSyncScss = fs.readFileSync(
                "src/anki-template/_logseq_anki_sync.scss",
                "utf8"
            );
            expect(logseqAnkiSyncScss).toContain("white-space: nowrap");
            expect(logseqAnkiSyncScss).toContain(".children.logseq-db-task::before");
            expect(logseqAnkiSyncScss).not.toContain(
                ".children.logseq-db-task {\n    display: grid;"
            );
            for (const status of ["backlog", "todo", "doing", "in-review", "done", "canceled"]) {
                expect(logseqAnkiSyncScss).toContain(`.children.logseq-db-task--${status}::before`);
            }
            expect(logseqAnkiSyncScss).toContain(".logseq-db-task-status {\n    display: none;");
            expect(logseqAnkiSyncScss).toContain(".logseq-db-task-meta");
            expect(logseqAnkiSyncScss).toContain(".logseq-db-task-priority--urgent");
            expect(logseqAnkiSyncScss).toContain(".logseq-db-task-priority__bars");
        });
    });
});
