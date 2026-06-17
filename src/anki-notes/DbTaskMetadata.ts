interface DbTaskMetadata {
    status?: string;
    priority?: string;
    deadline?: string;
    scheduled?: string;
}

const TASK_TAG_NAMES = new Set(["task"]);

const PROPERTY_KEYS: Record<keyof DbTaskMetadata, string[]> = {
    status: [
        "status",
        "logseq.property/status",
        ":logseq.property/status",
        "logseq.property.status"
    ],
    priority: [
        "priority",
        "logseq.property/priority",
        ":logseq.property/priority",
        "logseq.property.priority"
    ],
    deadline: [
        "deadline",
        "logseq.property/deadline",
        ":logseq.property/deadline",
        "logseq.property.deadline"
    ],
    scheduled: [
        "scheduled",
        "logseq.property/scheduled",
        ":logseq.property/scheduled",
        "logseq.property.scheduled"
    ]
};

const RAW_DB_TASK_PROPERTY_KEYS = new Set([
    "logseq.property/status",
    ":logseq.property/status",
    "logseq.property/priority",
    ":logseq.property/priority",
    "logseq.property/deadline",
    ":logseq.property/deadline",
    "logseq.property/scheduled",
    ":logseq.property/scheduled"
]);

function titleCase(value: string): string {
    return value
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function valueFromEntity(value: unknown): unknown {
    if (!value || typeof value !== "object") return value;
    const entity = value as Record<string, unknown>;
    return (
        entity.title ||
        entity.fullTitle ||
        entity.originalName ||
        entity.name ||
        entity.content ||
        entity.value ||
        entity.ident ||
        value
    );
}

function normalizePropertyValue(value: unknown): string | undefined {
    const raw = valueFromEntity(Array.isArray(value) ? value[0] : value);
    if (raw == null || raw === "") return undefined;

    if (typeof raw === "number") {
        if (raw > 1_000_000_000_000) return new Date(raw).toISOString().slice(0, 10);
        return String(raw);
    }

    if (typeof raw === "boolean") return raw ? "true" : "false";
    if (typeof raw !== "string") return undefined;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    const withoutNamespace = raw.replace(/^:/, "").split("/").pop()?.split(".").pop();

    return titleCase(withoutNamespace || raw);
}

function getProperty(properties: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
        const value = properties[key];
        const normalized = normalizePropertyValue(value);
        if (normalized) return normalized;
    }
    return undefined;
}

function hasTaskTag(properties: Record<string, unknown>): boolean {
    const tags = properties.tags;
    if (!Array.isArray(tags)) return false;

    return tags.some((tag) => {
        const name = normalizePropertyValue(tag);
        return name ? TASK_TAG_NAMES.has(name.toLowerCase()) : false;
    });
}

function hasRawDbTaskProperty(properties: Record<string, unknown>): boolean {
    return Object.keys(properties).some((key) => RAW_DB_TASK_PROPERTY_KEYS.has(key));
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizeAttributeValue(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export function getDbTaskMetadata(properties: Record<string, unknown> = {}): DbTaskMetadata {
    if (!hasTaskTag(properties) && !hasRawDbTaskProperty(properties)) {
        return {};
    }

    return {
        status: getProperty(properties, PROPERTY_KEYS.status),
        priority: getProperty(properties, PROPERTY_KEYS.priority),
        deadline: getProperty(properties, PROPERTY_KEYS.deadline),
        scheduled: getProperty(properties, PROPERTY_KEYS.scheduled)
    };
}

export function hasDbTaskMetadata(metadata: DbTaskMetadata): boolean {
    return Boolean(metadata.status || metadata.priority || metadata.deadline || metadata.scheduled);
}

export function getDbTaskMetadataClasses(metadata: DbTaskMetadata): string {
    if (!hasDbTaskMetadata(metadata)) return "";
    const classes = ["logseq-db-task"];
    if (metadata.status) {
        classes.push(`logseq-db-task--${normalizeAttributeValue(metadata.status)}`);
    }
    return classes.join(" ");
}

export function getDbTaskMetadataAttributes(metadata: DbTaskMetadata): string {
    if (!hasDbTaskMetadata(metadata)) return "";

    return Object.entries(metadata)
        .filter(([, value]) => value)
        .map(([key, value]) => `data-logseq-task-${key}="${escapeHtml(value as string)}"`)
        .join(" ");
}

function renderPriorityMetadata(priority: string): string {
    const normalizedPriority = normalizeAttributeValue(priority);
    const accessibleLabel = escapeHtml(`Priority: ${priority}`);

    if (normalizedPriority === "urgent") {
        return `<span class="logseq-db-task-meta__item logseq-db-task-meta__item--priority" data-logseq-task-meta="priority"><span class="logseq-db-task-priority logseq-db-task-priority--urgent" aria-label="${accessibleLabel}" title="${accessibleLabel}"><span class="logseq-db-task-priority__urgent-mark" aria-hidden="true">!</span></span></span>`;
    }

    return `<span class="logseq-db-task-meta__item logseq-db-task-meta__item--priority" data-logseq-task-meta="priority"><span class="logseq-db-task-priority logseq-db-task-priority--${normalizedPriority}" aria-label="${accessibleLabel}" title="${accessibleLabel}"><span class="logseq-db-task-priority__bars" aria-hidden="true"><span class="logseq-db-task-priority__bar"></span><span class="logseq-db-task-priority__bar"></span><span class="logseq-db-task-priority__bar"></span><span class="logseq-db-task-priority__bar"></span></span></span></span>`;
}

export function renderDbTaskMetadata(metadata: DbTaskMetadata): string {
    if (!hasDbTaskMetadata(metadata)) return "";

    const items = [
        metadata.priority ? renderPriorityMetadata(metadata.priority) : "",
        metadata.deadline
            ? `<span class="logseq-db-task-meta__item logseq-db-task-meta__item--deadline" data-logseq-task-meta="deadline">Deadline: ${escapeHtml(
                  metadata.deadline
              )}</span>`
            : "",
        metadata.scheduled
            ? `<span class="logseq-db-task-meta__item logseq-db-task-meta__item--scheduled" data-logseq-task-meta="scheduled">Scheduled: ${escapeHtml(
                  metadata.scheduled
              )}</span>`
            : ""
    ]
        .filter(Boolean)
        .join("");

    return items ? `<span class="logseq-db-task-meta">${items}</span>` : "";
}
