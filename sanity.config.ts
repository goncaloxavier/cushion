import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
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

    plugins: [
      // Visual Editing: embeds the live site with click-to-edit overlays.
      presentationTool({
        previewUrl: {
          origin: process.env.SANITY_STUDIO_PREVIEW_ORIGIN || 'http://localhost:5173',
          previewMode: {
            enable: '/preview/enable',
          },
        },
      }),
      structureTool({structure: websiteStructure}),
      visionTool(),
    ],

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
