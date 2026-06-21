import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {crmSchemaTypes, websiteSchemaTypes} from './schemaTypes'
import {crmStructure, websiteStructure} from './sanity.structure'

const projectId = 'u4uyfix8'

export default defineConfig([
  {
    name: 'website',
    basePath: '/website',
    title: 'DaFábrica4You - Website',

    projectId,
    dataset: 'production',

    plugins: [structureTool({structure: websiteStructure}), visionTool()],

    schema: {
      types: websiteSchemaTypes,
    },
  },
  {
    name: 'crm',
    basePath: '/crm',
    title: 'DaFábrica4You - Pedidos',

    projectId,
    dataset: 'crm',

    plugins: [structureTool({structure: crmStructure})],

    schema: {
      types: crmSchemaTypes,
    },
  },
])
