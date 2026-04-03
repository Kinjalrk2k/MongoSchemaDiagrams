export const EDITOR_SCHEMA_URI = 'inmemory://schema/mongoml.schema.json'
export const EDITOR_MODEL_URI = 'inmemory://model/schema.mongoml'

export const MONGO_SCHEMA_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'MongoML Schema Document',
  oneOf: [
    {
      $ref: '#/$defs/collectionDocument',
    },
    {
      type: 'array',
      items: {
        $ref: '#/$defs/collectionDocument',
      },
    },
  ],
  $defs: {
    collectionDocument: {
      type: 'object',
      additionalProperties: false,
      required: ['collection'],
      properties: {
        collection: {
          type: 'string',
          description: 'Collection name shown in the diagram.',
        },
        name: {
          type: 'string',
          description: 'Alternative collection name key.',
        },
        schema: {
          $ref: '#/$defs/jsonSchema',
        },
        $jsonSchema: {
          $ref: '#/$defs/jsonSchema',
        },
      },
    },
    jsonSchema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        title: {
          type: 'string',
        },
        bsonType: {
          oneOf: [
            {
              enum: [
                'object',
                'document',
                'array',
                'string',
                'objectId',
                'int',
                'long',
                'double',
                'decimal',
                'bool',
                'date',
                'null',
              ],
            },
            {
              type: 'array',
              items: {
                enum: [
                  'object',
                  'document',
                  'array',
                  'string',
                  'objectId',
                  'int',
                  'long',
                  'double',
                  'decimal',
                  'bool',
                  'date',
                  'null',
                ],
              },
            },
          ],
        },
        required: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        properties: {
          type: 'object',
          additionalProperties: {
            $ref: '#/$defs/schemaProperty',
          },
        },
      },
    },
    schemaProperty: {
      type: 'object',
      additionalProperties: true,
      properties: {
        bsonType: {
          oneOf: [
            {
              enum: [
                'object',
                'document',
                'array',
                'string',
                'objectId',
                'int',
                'long',
                'double',
                'decimal',
                'bool',
                'date',
                'null',
              ],
            },
            {
              type: 'array',
              items: {
                enum: [
                  'object',
                  'document',
                  'array',
                  'string',
                  'objectId',
                  'int',
                  'long',
                  'double',
                  'decimal',
                  'bool',
                  'date',
                  'null',
                ],
              },
            },
          ],
        },
        description: {
          type: 'string',
        },
        __ref: {
          type: 'string',
          description: 'Target collection for a relationship edge.',
        },
        items: {
          $ref: '#/$defs/schemaProperty',
        },
        properties: {
          type: 'object',
          additionalProperties: {
            $ref: '#/$defs/schemaProperty',
          },
        },
      },
    },
  },
} as const
