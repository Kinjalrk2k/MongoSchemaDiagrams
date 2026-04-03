# Mongo Schema Diagrams

Mongo Schema Diagrams is a React + TypeScript web app for turning MongoDB-style JSON Schema into an interactive document-model diagram.

It is designed as a MongoDB-focused alternative to tools like dbdiagram-style schema visualizers, with support for:

- live schema editing
- field-level relationship rendering
- draggable collection nodes
- auto-layout for initial diagrams
- collapsible nested object fields inside nodes
- import/export using `.mongoml`
- schema-aware editor autocomplete and validation

## Preview

The app uses a split-screen interface:

- left pane: Monaco editor for authoring schema
- right pane: React Flow canvas for the diagram
- right sidebar: markdown help drawer
- bottom status bar: validation and diagram status

## Tech Stack

- React 19
- TypeScript
- Vite
- React Flow
- Zustand
- Monaco Editor
- Tailwind CSS
- Dagre
- Lucide React

## Features

### Schema Editor

- Monaco-powered JSON editor
- custom dark theme
- schema-aware validation
- snippet/autocomplete support for common MongoML structures
- local storage persistence across page refreshes

### Diagram Canvas

- React Flow-based interactive canvas
- field-to-field relationship edges
- dynamic left/right handle selection based on node placement
- draggable nodes with preserved positions
- minimap shown only during zoom activity
- zoom controls with icon-based actions

### Relationship Modeling

MongoDB does not enforce relational foreign keys, so this app supports lightweight reference metadata:

- explicit references via `__ref`
- inferred references for common ObjectId naming patterns like `authorId` or `postIds`

### Nested Object Support

- object/document fields can contain nested properties
- nested fields render inside collapsible sections in the node UI
- nested object sections are collapsed by default

### File Workflow

- import `.mongoml`, `.json`, and text-based schema files
- export current schema as `.mongoml`

## MongoML Format

Mongo Schema Diagrams currently uses a JSON-based format informally referred to here as `MongoML`.

You can provide either:

- a single collection object
- an array of collection objects

### Example

```json
[
  {
    "collection": "users",
    "schema": {
      "bsonType": "object",
      "required": ["_id", "email", "companyId"],
      "properties": {
        "_id": { "bsonType": "objectId" },
        "email": { "bsonType": "string" },
        "companyId": {
          "bsonType": "objectId",
          "__ref": "companies"
        },
        "profile": {
          "bsonType": "object",
          "properties": {
            "timezone": { "bsonType": "string" },
            "bio": { "bsonType": "string" }
          }
        }
      }
    }
  },
  {
    "collection": "companies",
    "schema": {
      "bsonType": "object",
      "required": ["_id", "name"],
      "properties": {
        "_id": { "bsonType": "objectId" },
        "name": { "bsonType": "string" }
      }
    }
  }
]
```

## Supported Schema Concepts

### Collection-Level Keys

- `collection`
- `name`
- `schema`
- `$jsonSchema`

### Field-Level Keys

- `bsonType`
- `required`
- `properties`
- `items`
- `description`
- `__ref`

### Common `bsonType` Values

- `object`
- `document`
- `array`
- `string`
- `objectId`
- `int`
- `long`
- `double`
- `decimal`
- `bool`
- `date`
- `null`

## Relationship Rules

### Explicit Relationships

The most reliable way to create an edge is:

```json
"authorId": {
  "bsonType": "objectId",
  "__ref": "users"
}
```

### Array Relationships

```json
"postIds": {
  "bsonType": "array",
  "items": {
    "bsonType": "objectId",
    "__ref": "posts"
  }
}
```

### Inferred Relationships

If `__ref` is omitted, the parser can infer simple relationships from ObjectId-like field names, for example:

- `authorId` -> `authors`
- `companyId` -> `companies`
- `postIds` -> `posts`

Explicit `__ref` is preferred when precision matters.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Project Structure

```text
src/
  components/
    CollectionNode.tsx
    FlowViewport.tsx
    HelpSidebar.tsx
    IconButton.tsx
  constants/
    editorSchema.ts
    helpContent.ts
  hooks/
    useResizableSplit.ts
  lib/
    editorConfig.ts
    schemaParser.ts
  store/
    useSchemaStore.ts
  App.tsx
  main.tsx
  types.ts
```

## Architecture Notes

### State Management

Zustand stores:

- raw editor source
- parsed collections
- generated nodes
- generated edges
- current parse error state

It also preserves node positions across schema updates when possible.

### Parsing

The parser:

- reads collection definitions
- extracts fields and nested fields
- resolves references
- generates diagram nodes and edges
- applies initial Dagre layout

### Rendering

React Flow renders:

- collection nodes
- field-level handles
- selected edge highlighting
- diagram controls
- temporary minimap

### Persistence

The current schema source is stored in local storage and restored on refresh.

## UX Behavior

### Editor

- schema is validated as you type
- valid JSON re-renders the diagram immediately
- invalid JSON keeps the previous diagram state

### Diagram

- nodes can be dragged freely
- selected edges animate
- related fields highlight on edge selection
- clicking empty canvas clears edge selection

### Help Drawer

- markdown-rendered documentation
- toggled from header icon

## SEO / Metadata

The app includes:

- custom title
- description meta tag
- keyword metadata
- Open Graph tags
- Twitter metadata
- custom favicon

## Known Limitations

- Monaco makes the bundle fairly large, so production build may show a chunk-size warning
- nested object fields are displayed inside nodes but only top-level fields currently expose edge handles
- inferred relationship naming is intentionally simple and may not match every pluralization rule

## Future Ideas

- custom edge routing around crowded layouts
- richer schema linting and diagnostics
- collection search/filtering
- undo/redo for layout changes
- multiple saved workspaces
- PNG/SVG export of the diagram
