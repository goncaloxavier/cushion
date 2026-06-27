import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {defineLocations, presentationTool} from 'sanity/presentation'
import {visionTool} from '@sanity/vision'
import {crmSchemaTypes, websiteSchemaTypes} from './schemaTypes'
import {crmStructure, websiteStructure} from './sanity.structure'

const projectId = 'u4uyfix8'
const localPreviewOrigin = 'http://localhost:5173'

const collectionLocation = (basePath: string, fallbackTitle: string) =>
  defineLocations({
    select: {
      slug: 'slug.current',
      title: 'title.pt',
    },
    resolve: (value) => {
      const slug = value?.slug

      if (!slug) {
        return {
          message: 'Publique um endereço da página para ativar a pré-visualização.',
          tone: 'caution',
        }
      }

      return {
        locations: [
          {
            title: value?.title || fallbackTitle,
            href: `${basePath}/${slug}`,
          },
        ],
      }
    },
  })

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
          origin: process.env.SANITY_STUDIO_PREVIEW_ORIGIN || localPreviewOrigin,
          previewMode: {
            enable: '/preview/enable',
          },
        },
        resolve: {
          locations: {
            siteLanding: defineLocations({
              locations: [
                {title: 'Início', href: '/'},
                {title: 'Sobre', href: '/sobre-nos'},
                {title: 'Produtos', href: '/produtos'},
                {title: 'Loja', href: '/loja'},
                {title: 'Catálogo', href: '/catalogo'},
                {title: 'Casos', href: '/casos-de-estudo'},
                {title: 'Blog', href: '/blog'},
                {title: 'Contacto', href: '/contacto'},
              ],
            }),
            productCategory: collectionLocation('/produtos', 'Produto'),
            storeProduct: collectionLocation('/loja', 'Produto da loja'),
            caseStudy: collectionLocation('/casos-de-estudo', 'Caso de estudo'),
            blogPost: collectionLocation('/blog', 'Artigo do blog'),
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
