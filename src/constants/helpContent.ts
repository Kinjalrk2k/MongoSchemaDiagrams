export const HELP_MARKDOWN = `
# Help

## Schema format

Use either a single collection object or an array of collections.

\`\`\`json
{
  "collection": "users",
  "schema": {
    "bsonType": "object",
    "required": ["_id", "companyId"],
    "properties": {
      "_id": { "bsonType": "objectId" },
      "companyId": { "bsonType": "objectId", "__ref": "companies" }
    }
  }
}
\`\`\`

## Relationships

- Add \`__ref\` on an \`objectId\` field to connect it to another collection.
- Array item refs also work through \`items.__ref\`.
- If no explicit ref is provided, the parser can infer simple cases like \`authorId -> authors\`.

## Canvas interaction

- Drag nodes to place them where you want.
- Click an edge to focus the relationship.
- Focused edges animate and highlight the related fields.
- Use the bottom zoom controls to zoom in, zoom out, or fit the diagram.

## Validation

Only valid JSON updates the diagram. Invalid edits keep the previous layout intact until the schema parses again.
`
