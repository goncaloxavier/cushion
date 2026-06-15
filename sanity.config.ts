import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {studioStructure} from './sanity.structure'

export default defineConfig({
  name: 'default',
  title: 'cushion',

  projectId: 'u4uyfix8',
  dataset: 'production',

  plugins: [structureTool({structure: studioStructure}), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
