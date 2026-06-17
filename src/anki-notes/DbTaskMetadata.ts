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

export function renderDbTaskMetadata(metadata: DbTaskMetadata): string {
    if (!hasDbTaskMetadata(metadata)) return "";

    const labels: Array<[keyof DbTaskMetadata, string]> = [
        ["priority", "Priority"],
        ["deadline", "Deadline"],
        ["scheduled", "Scheduled"]
    ];

    const items = labels
        .filter(([key]) => metadata[key])
        .map(
            ([key, label]) =>
                `<span class="logseq-db-task-meta__item logseq-db-task-meta__item--${key}" data-logseq-task-meta="${key}">${label}: ${escapeHtml(
                    metadata[key] as string
                )}</span>`
        )
        .join("");

    return items ? `<span class="logseq-db-task-meta">${items}</span>` : "";
}
