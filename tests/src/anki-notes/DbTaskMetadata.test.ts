import {describe, expect, test} from "vitest";
import {
    getDbTaskMetadata,
    getDbTaskMetadataAttributes,
    getDbTaskMetadataClasses,
    renderDbTaskMetadata
} from "../../../src/anki-notes/DbTaskMetadata";

describe("DbTaskMetadata", () => {
    test("extracts DB-native task metadata from task-tagged child properties", () => {
        const metadata = getDbTaskMetadata({
            tags: ["Task"],
            status: "logseq.property/status.doing",
            priority: "logseq.property/priority.high",
            deadline: 1781740800000,
            scheduled: "2026-06-19"
        });

        expect(metadata).toEqual({
            status: "Doing",
            priority: "High",
            deadline: "2026-06-18",
            scheduled: "2026-06-19"
        });
        expect(getDbTaskMetadataClasses(metadata)).toBe("logseq-db-task logseq-db-task--doing");
        expect(getDbTaskMetadataAttributes(metadata)).toContain('data-logseq-task-status="Doing"');
        expect(renderDbTaskMetadata(metadata)).not.toContain("logseq-db-task-status");
        expect(renderDbTaskMetadata(metadata)).toContain("logseq-db-task-priority--high");
        expect(renderDbTaskMetadata(metadata)).toContain('aria-label="Priority: High"');
        expect(renderDbTaskMetadata(metadata)).toContain("Deadline: 2026-06-18");
        expect(renderDbTaskMetadata(metadata)).toContain("Scheduled: 2026-06-19");
    });

    test("recognizes urgent priority as the fourth built-in Logseq DB priority tier", () => {
        const metadata = getDbTaskMetadata({
            tags: ["Task"],
            priority: "logseq.property/priority.urgent"
        });

        expect(metadata).toEqual({
            status: undefined,
            priority: "Urgent",
            deadline: undefined,
            scheduled: undefined
        });
        expect(getDbTaskMetadataAttributes(metadata)).toContain(
            'data-logseq-task-priority="Urgent"'
        );
        expect(renderDbTaskMetadata(metadata)).toContain("logseq-db-task-priority--urgent");
        expect(renderDbTaskMetadata(metadata)).toContain('aria-label="Priority: Urgent"');
    });

    test("maps Logseq DB's built-in task statuses to semantic classes", () => {
        const statuses = [
            ["logseq.property/status.backlog", "logseq-db-task logseq-db-task--backlog"],
            ["logseq.property/status.todo", "logseq-db-task logseq-db-task--todo"],
            ["logseq.property/status.doing", "logseq-db-task logseq-db-task--doing"],
            ["logseq.property/status.in-review", "logseq-db-task logseq-db-task--in-review"],
            ["logseq.property/status.done", "logseq-db-task logseq-db-task--done"],
            ["logseq.property/status.canceled", "logseq-db-task logseq-db-task--canceled"]
        ];

        for (const [status, className] of statuses) {
            expect(getDbTaskMetadataClasses(getDbTaskMetadata({tags: ["Task"], status}))).toBe(
                className
            );
        }
    });

    test("also recognizes raw DB property keys even if tags are not expanded yet", () => {
        const metadata = getDbTaskMetadata({
            ":logseq.property/status": "Todo",
            ":logseq.property/deadline": 1781827200000
        });

        expect(metadata).toEqual({
            status: "Todo",
            priority: undefined,
            deadline: "2026-06-19",
            scheduled: undefined
        });
    });

    test("ignores non-task custom properties", () => {
        const metadata = getDbTaskMetadata({
            tags: ["Project"],
            priority: "High",
            deadline: 1781740800000
        });

        expect(metadata).toEqual({});
        expect(getDbTaskMetadataClasses(metadata)).toBe("");
        expect(getDbTaskMetadataAttributes(metadata)).toBe("");
        expect(renderDbTaskMetadata(metadata)).toBe("");
    });
});
