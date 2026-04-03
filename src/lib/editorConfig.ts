import type { editor } from 'monaco-editor'
import { EDITOR_MODEL_URI, EDITOR_SCHEMA_URI, MONGO_SCHEMA_JSON_SCHEMA } from '../constants/editorSchema'

export function configureMonaco(monaco: typeof import('monaco-editor')) {
  const monacoJson = monaco.languages as typeof monaco.languages & {
    json?: {
      jsonDefaults: {
        setDiagnosticsOptions: (options: unknown) => void
      }
    }
  }

  monaco.editor.defineTheme('mongoml-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: 'E6E6E6' },
      { token: 'string.value.json', foreground: '6CB6FF' },
      { token: 'number.json', foreground: 'D19A66' },
      { token: 'keyword.json', foreground: 'C678DD' },
      { token: 'delimiter.bracket.json', foreground: '8B949E' },
    ],
    colors: {
      'editor.background': '#1F1F1F',
      'editor.foreground': '#D4D4D4',
      'editorLineNumber.foreground': '#7D8590',
      'editorLineNumber.activeForeground': '#C9D1D9',
      'editorCursor.foreground': '#C9D1D9',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      'editorIndentGuide.background1': '#2D333B',
      'editorIndentGuide.activeBackground1': '#484F58',
      'editorWidget.background': '#2B303B',
      'editorWidget.border': '#3A414B',
      'editorSuggestWidget.background': '#2B303B',
      'editorSuggestWidget.border': '#3A414B',
      'editorSuggestWidget.selectedBackground': '#373E47',
      'editorHoverWidget.background': '#2B303B',
      'editorHoverWidget.border': '#3A414B',
    },
  })

  monacoJson.json?.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    enableSchemaRequest: false,
    schemas: [
      {
        uri: EDITOR_SCHEMA_URI,
        fileMatch: [EDITOR_MODEL_URI, '*'],
        schema: MONGO_SCHEMA_JSON_SCHEMA,
      },
    ],
  })
}

export function handleEditorMount(
  editorInstance: editor.IStandaloneCodeEditor,
  monaco: typeof import('monaco-editor'),
) {
  const model = editorInstance.getModel()

  if (model) {
    monaco.editor.setModelLanguage(model, 'json')
  }

  monaco.languages.registerCompletionItemProvider('json', {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      return {
        suggestions: [
          {
            label: 'collection document',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              '{',
              '  "collection": "${1:users}",',
              '  "schema": {',
              '    "bsonType": "object",',
              '    "required": ["_id"],',
              '    "properties": {',
              '      "_id": { "bsonType": "objectId" },',
              '      "${2:companyId}": { "bsonType": "objectId", "__ref": "${3:companies}" }',
              '    }',
              '  }',
              '}',
            ].join('\n'),
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Insert a MongoML collection document.',
            range,
          },
          {
            label: '__ref',
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: '"__ref": "${1:targetCollection}"',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Create a relationship to another collection.',
            range,
          },
          {
            label: 'objectId field',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              '"${1:authorId}": { "bsonType": "objectId", "__ref": "${2:users}" }',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Insert a referenced ObjectId field.',
            range,
          },
          {
            label: 'array of objectIds',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              '"${1:postIds}": {',
              '  "bsonType": "array",',
              '  "items": { "bsonType": "objectId", "__ref": "${2:posts}" }',
              '}',
            ].join('\n'),
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Insert an array relationship field.',
            range,
          },
        ],
      }
    },
  })
}
