export const HELP_MARKDOWN = `
## Start here

The editor accepts either:

- one collection object
- an array of collection objects

Each collection should usually define:

- \`collection\`
- \`schema\` or \`$jsonSchema\`
- \`properties\`

## Minimal example

\`\`\`json
{
  "collection": "users",
  "schema": {
    "bsonType": "object",
    "required": ["_id", "companyId"],
    "properties": {
      "_id": { "bsonType": "objectId" },
      "name": { "bsonType": "string" },
      "companyId": { "bsonType": "objectId", "__ref": "companies" },
      "role": {
        "bsonType": "string",
        "enum": ["admin", "member"],
        "default": "member"
      }
    }
  }
}
\`\`\`

## Relationships

- Add \`__ref\` on an \`objectId\` field to create an edge.
- Use an array for polymorphic relations:

\`\`\`json
"ownerId": {
  "bsonType": "objectId",
  "__ref": ["users", "teams"]
}
\`\`\`

- Array relationships also work through \`items.__ref\`.
- If \`__ref\` is omitted, simple names like \`authorId\` can be inferred automatically.

## Most useful field features

- \`description\`: shown in field metadata
- \`default\`: shown in field metadata
- \`enum\`: shown as possible values in field metadata
- nested \`object\` / \`document\` fields: shown as collapsible children
- \`timestamp\`: supported as a type

## Working in the canvas

- Drag nodes to reposition them.
- Click an edge to highlight the related fields.
- Click a field or collection to jump to that section in the editor.
- Use the bottom canvas controls to zoom, fit, and auto-arrange.

## Import, export, and formatting

- Import schemas from the top-right.
- Export the current document as \`.mongoml\`.
- Use the status bar beautify button to pretty-format valid JSON.

## Important behavior

- Only valid JSON updates the diagram.
- If the current draft is invalid, the previous valid diagram remains visible.
- Your raw editor content is saved locally and restored on refresh.
- Node positions are also saved locally.

## If something looks wrong

- Check the status bar for schema errors.
- Add explicit \`__ref\` when inference is ambiguous.
- Use auto-arrange if the graph becomes messy after manual movement.
`;

export const DETAILED_HELP_MARKDOWN = `
# Detailed Help

This application helps you author MongoDB-style JSON Schema and immediately visualize it as a document-model diagram.

## What the app expects

The editor accepts either:

- a single collection object
- an array of collection objects

Each collection usually includes:

- \`collection\`
- \`schema\` or \`$jsonSchema\`
- \`properties\`

## Basic collection example

\`\`\`json
{
  "collection": "users",
  "schema": {
    "bsonType": "object",
    "required": ["_id", "email"],
    "properties": {
      "_id": { "bsonType": "objectId" },
      "email": { "bsonType": "string" },
      "role": {
        "bsonType": "string",
        "enum": ["admin", "member"],
        "default": "member",
        "description": "Role assigned to the user"
      }
    }
  }
}
\`\`\`

## Relationships

Relationships are modeled with \`__ref\`.

### Single target

\`\`\`json
"companyId": {
  "bsonType": "objectId",
  "__ref": "companies"
}
\`\`\`

### Polymorphic target

\`\`\`json
"ownerId": {
  "bsonType": "objectId",
  "__ref": ["users", "teams"]
}
\`\`\`

### Array relation

\`\`\`json
"postIds": {
  "bsonType": "array",
  "items": {
    "bsonType": "objectId",
    "__ref": "posts"
  }
}
\`\`\`

If no explicit \`__ref\` is present, the parser may infer simple relationships from names like \`authorId\` or \`postIds\`.

## Supported field metadata

Fields can also include:

- \`description\`
- \`default\`
- \`enum\`
- \`items\`
- \`properties\`
- \`__ref\`

These appear in the field metadata card from the info badge.

## Nested objects

Object/document fields are rendered as collapsible nested sections inside the collection node.

\`\`\`json
"profile": {
  "bsonType": "object",
  "properties": {
    "timezone": { "bsonType": "string" },
    "bio": { "bsonType": "string" }
  }
}
\`\`\`

## Supported types

Common supported types include:

- \`string\`
- \`objectId\`
- \`array\`
- \`object\`
- \`document\`
- \`date\`
- \`timestamp\`
- \`int\`
- \`long\`
- \`double\`
- \`decimal\`
- \`bool\`
- \`null\`

## Editor features

The editor supports:

- autocomplete and snippets
- schema validation
- beautify formatting
- click-to-focus sync from the diagram

When you click a collection or top-level field in the diagram, the editor tries to reveal the matching section in the JSON source.

## Canvas features

The canvas supports:

- draggable nodes
- edge focus and highlighting
- temporary minimap on zoom
- zoom in / fit / zoom out
- auto-arrange

Auto-arrange uses a Dagre-based layout pass and is useful after large schema changes or manual dragging.

## Import, export, and persistence

### Import

Use the top-right import action for:

- \`.mongoml\`
- \`.json\`
- plain text schema files

### Export

Use export to save the current editor content as \`.mongoml\`.

### Persistence

The application stores local workspace state, including:

- current raw editor content
- last valid source used to build the diagram
- node positions

That means refresh should preserve both draft text and layout.

## Error behavior

If the editor contains invalid JSON:

- the status bar switches to error mode
- the last valid diagram remains visible
- the invalid raw text is still preserved

This prevents losing work while editing.

## Best practices

- Prefer explicit \`__ref\` for important relationships.
- Use \`description\`, \`default\`, and \`enum\` to make field semantics clear.
- Keep relationship fields top-level when possible so the graph stays readable.
- Use auto-arrange when the graph becomes crowded.
- Use beautify before exporting to keep saved files clean.

## Troubleshooting

### The diagram does not update

- Check whether the status bar shows an error.
- Fix JSON syntax issues first.

### A relationship points to the wrong collection

- Add explicit \`__ref\`.
- Avoid relying only on inferred naming when multiple targets are possible.

### The graph looks messy

- Use auto-arrange from the canvas controls.

### Metadata is not visible

- Hover the info badge for that field.
- Add \`description\`, \`default\`, \`enum\`, or \`__ref\` to the field.
`;
