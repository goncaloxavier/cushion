import type {SanityDocument} from '@sanity/client'
import type {BuilderSection} from '$lib/builder/types'

export type Asset = {id: string; url: string}

export type SiteEditorDocumentType =
  | 'siteLanding'
  | 'productCategory'
  | 'storeCategory'
  | 'storeProduct'
  | 'caseStudy'
  | 'blogPost'
  | 'sitePage'

export type SiteEditorNodeKind =
  | 'page'
  | 'global'
  | 'collection'
  | 'document'
  | 'flexiblePage'

export type SiteEditorArea = 'pages' | 'content' | 'global'

export type SiteEditorNode = {
  id: string
  kind: SiteEditorNodeKind
  area: SiteEditorArea
  title: string
  subtitle?: string
  route?: string
  documentId?: string
  documentType?: SiteEditorDocumentType
  rootPath?: string
  collectionType?: SiteEditorDocumentType
  parentId?: string
  draft?: boolean
  updatedAt?: string
  active?: boolean
  count?: number
  thumbnailUrl?: string
  slug?: string
  category?: string
  publishedCategory?: string
}

export type SiteEditorDocument = SanityDocument &
  Record<string, unknown> & {
    _type: SiteEditorDocumentType
  }

export type SiteEditorManifest = {
  nodes: SiteEditorNode[]
  optionSources: Record<string, SiteEditorOption[]>
  capabilities: {
    canRead: boolean
    canWrite: boolean
    canPublish: boolean
    dataset: string
    projectId: string
  }
}

export type SiteEditorOption = {
  label: string
  value: string
}

export type SiteEditorFieldType =
  | 'string'
  | 'text'
  | 'localizedString'
  | 'localizedText'
  | 'number'
  | 'boolean'
  | 'url'
  | 'email'
  | 'date'
  | 'slug'
  | 'select'
  | 'image'
  | 'gallery'
  | 'video'
  | 'navigation'
  | 'article'
  | 'sections'
  | 'object'
  | 'array'

export type SiteEditorField = {
  name: string
  label: string
  type: SiteEditorFieldType
  description?: string
  placeholder?: string
  fields?: SiteEditorField[]
  item?: SiteEditorField
  options?: SiteEditorOption[]
  optionsSource?: string
  min?: number
  max?: number
  step?: number
  required?: boolean
  readOnly?: boolean
  rows?: number
  collapsed?: boolean
}

export type SiteEditorPanel = {
  id: string
  label: string
  description?: string
  fields: SiteEditorField[]
}

export type SitePageDocument = SiteEditorDocument & {
  _type: 'sitePage'
  editorVersion: number
  title: string
  route: string
  active: boolean
  sections: BuilderSection[]
  seo?: Record<string, unknown>
}

export type SiteEditorSelection = {
  documentId: string
  documentType?: string
  path: string
}

export type SiteEditorSaveState =
  | 'idle'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'error'
  | 'conflict'
