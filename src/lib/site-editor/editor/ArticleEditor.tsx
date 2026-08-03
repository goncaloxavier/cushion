import React, {useEffect, useMemo, useRef, useState} from 'react'
import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
  useEditor,
  useEditorSelector,
  type BlockListItemRenderProps,
  type BlockRenderProps,
  type EditorSelection,
  type Path,
  type PortableTextBlock,
  type PortableTextObject,
  type RenderAnnotationFunction,
  type RenderDecoratorFunction,
  type RenderStyleFunction,
} from '@portabletext/editor'
import {defineBehavior, raise} from '@portabletext/editor/behaviors'
import {BehaviorPlugin, EventListenerPlugin} from '@portabletext/editor/plugins'
import * as selectors from '@portabletext/editor/selectors'
import {getSelectionEndPoint} from '@portabletext/editor/utils'
import {MarkdownShortcutsPlugin} from '@portabletext/plugin-markdown-shortcuts'
import {PasteLinkPlugin} from '@portabletext/plugin-paste-link'
import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowUpIcon} from '@sanity/icons/ArrowUp'
import {BoldIcon} from '@sanity/icons/Bold'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CloseIcon} from '@sanity/icons/Close'
import {EditIcon} from '@sanity/icons/Edit'
import {ImageIcon} from '@sanity/icons/Image'
import {ItalicIcon} from '@sanity/icons/Italic'
import {LinkIcon} from '@sanity/icons/Link'
import {OlistIcon} from '@sanity/icons/Olist'
import {RedoIcon} from '@sanity/icons/Redo'
import {ThListIcon} from '@sanity/icons/ThList'
import {TrashIcon} from '@sanity/icons/Trash'
import {UlistIcon} from '@sanity/icons/Ulist'
import {UndoIcon} from '@sanity/icons/Undo'
import {VideoIcon} from '@sanity/icons/Video'
import type {SiteEditorUploadProgress} from './api'
import {editorKey, sanityAssetUrl} from './asset'
import {ConfirmDialog} from './ConfirmDialog'
import {MediaUploadProgress, type MediaUploadStatus} from './MediaUploadProgress'

type ArticleObject = PortableTextObject & {
  asset?: {_ref?: string}
  alt?: string
  caption?: string
  title?: string
  url?: string
  columns?: unknown[]
  rows?: Array<{_key?: string; _type?: string; cells?: unknown[]}>
}

type SelectedObject = {
  node: ArticleObject
  path: Path
}

type Props = {
  value: unknown
  documentKey: string
  projectId: string
  dataset: string
  onChange: (value: unknown) => void
  onUpload: (
    file: File,
    kind: 'image' | 'video',
    onProgress?: (progress: SiteEditorUploadProgress) => void,
  ) => Promise<{id: string; url: string}>
}

const schemaDefinition = defineSchema({
  styles: [
    {name: 'normal', title: 'Parágrafo'},
    {name: 'h2', title: 'Título de secção'},
    {name: 'h3', title: 'Subtítulo'},
    {name: 'blockquote', title: 'Citação'},
  ],
  lists: [
    {name: 'bullet', title: 'Marcadores'},
    {name: 'number', title: 'Numerada'},
  ],
  decorators: [
    {name: 'strong', title: 'Negrito'},
    {name: 'em', title: 'Itálico'},
  ],
  annotations: [
    {
      name: 'link',
      title: 'Ligação',
      fields: [{name: 'href', title: 'Destino', type: 'string'}],
    },
  ],
  inlineObjects: [],
  blockObjects: [
    {
      name: 'image',
      title: 'Imagem',
      fields: [
        {name: 'asset', title: 'Ficheiro', type: 'object'},
        {name: 'alt', title: 'Descrição', type: 'string'},
        {name: 'caption', title: 'Legenda', type: 'string'},
      ],
    },
    {
      name: 'youtubeEmbed',
      title: 'Vídeo',
      fields: [
        {name: 'url', title: 'Link', type: 'string'},
        {name: 'title', title: 'Título', type: 'string'},
        {name: 'caption', title: 'Legenda', type: 'string'},
      ],
    },
    {
      name: 'articleTable',
      title: 'Tabela',
      fields: [
        {name: 'columns', title: 'Cabeçalhos', type: 'array', of: [{type: 'string'}]},
        {
          name: 'rows',
          title: 'Linhas',
          type: 'array',
          of: [
            {
              name: 'articleTableRow',
              title: 'Linha',
              type: 'object',
              fields: [{name: 'cells', title: 'Células', type: 'array', of: [{type: 'string'}]}],
            },
          ],
        },
      ],
    },
  ],
})

const MAX_PARAGRAPH_INDENT = 4

const paragraphIndentLevel = (block: Pick<PortableTextBlock, 'level' | 'listItem'>) =>
  block.listItem
    ? 0
    : Math.min(MAX_PARAGRAPH_INDENT, Math.max(0, Number(block.level) || 0))

const paragraphIndentProps = (block: Pick<PortableTextBlock, 'level' | 'listItem'>) => {
  const level = paragraphIndentLevel(block)
  if (!level) return {}

  return {
    className: 'site-editor-rich-indented-block',
    'data-indent-level': level,
    style: {'--article-indent-level': level} as React.CSSProperties,
  }
}

const isPlainTab = (event: {
  key: string
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
}) =>
  event.key === 'Tab' &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.shiftKey

const isPlainShiftTab = (event: {
  key: string
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
}) =>
  event.key === 'Tab' &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.metaKey &&
  event.shiftKey

const indentParagraphOnTab = defineBehavior({
  on: 'keyboard.keydown',
  guard: ({snapshot, event}) => {
    if (!isPlainTab(event.originEvent)) return false
    const selectedBlocks = selectors.getSelectedTextBlocks(snapshot)
    if (!selectedBlocks.length || selectedBlocks.some(({node}) => Boolean(node.listItem))) {
      return false
    }
    return {selectedBlocks}
  },
  actions: [
    (_, {selectedBlocks}) =>
      selectedBlocks.map(({node, path}) =>
        raise({
          type: 'block.set',
          at: path,
          props: {level: Math.min(MAX_PARAGRAPH_INDENT, paragraphIndentLevel(node) + 1)},
        }),
      ),
  ],
})

const unindentParagraphOnShiftTab = defineBehavior({
  on: 'keyboard.keydown',
  guard: ({snapshot, event}) => {
    if (!isPlainShiftTab(event.originEvent)) return false
    const selectedBlocks = selectors.getSelectedTextBlocks(snapshot)
    if (!selectedBlocks.length || selectedBlocks.some(({node}) => Boolean(node.listItem))) {
      return false
    }
    return {selectedBlocks}
  },
  actions: [
    (_, {selectedBlocks}) =>
      selectedBlocks.map(({node, path}) => {
        const nextLevel = paragraphIndentLevel(node) - 1
        return nextLevel > 0
          ? raise({type: 'block.set', at: path, props: {level: nextLevel}})
          : raise({type: 'block.unset', at: path, props: ['level']})
      }),
  ],
})

const paragraphIndentBehaviors = [indentParagraphOnTab, unindentParagraphOnShiftTab]

const renderStyle: RenderStyleFunction = ({block, children, schemaType}) => {
  const indentProps = paragraphIndentProps(block)
  if (schemaType.value === 'h2') return <h2 {...indentProps}>{children}</h2>
  if (schemaType.value === 'h3') return <h3 {...indentProps}>{children}</h3>
  if (schemaType.value === 'blockquote') {
    return <blockquote {...indentProps}>{children}</blockquote>
  }
  return <p {...indentProps}>{children}</p>
}

const renderDecorator: RenderDecoratorFunction = ({children, value}) => {
  if (value === 'strong') return <strong>{children}</strong>
  if (value === 'em') return <em>{children}</em>
  return <>{children}</>
}

const renderAnnotation: RenderAnnotationFunction = ({children, value}) => (
  <a href={String(value.href || '')} onClick={(event) => event.preventDefault()}>
    {children}
  </a>
)

function ArticleListItem(props: BlockListItemRenderProps) {
  const editor = useEditor()
  const blocks = useEditorSelector(editor, selectors.getValue)
  const level = Math.max(1, Number(props.level) || 1)
  const currentIndex = blocks.findIndex((block) => block._key === props.block._key)
  let number = 1

  if (props.value === 'number' && currentIndex > 0) {
    for (let index = currentIndex - 1; index >= 0; index -= 1) {
      const previous = blocks[index] as PortableTextBlock & {
        listItem?: string
        level?: number
      }
      if (
        previous._type !== 'block' ||
        previous.listItem !== 'number' ||
        Math.max(1, Number(previous.level) || 1) !== level
      ) {
        break
      }
      number += 1
    }
  }

  return (
    <div
      className={`site-editor-rich-list-item is-${props.value}`}
      style={{marginInlineStart: `${(level - 1) * 18}px`}}
      data-list-level={level}
    >
      <span className="site-editor-rich-list-marker" contentEditable={false} aria-hidden="true">
        {props.value === 'number' ? `${number}.` : ''}
      </span>
      <div className="site-editor-rich-list-content">{props.children}</div>
    </div>
  )
}

const objectLabel = (node: ArticleObject) => {
  if (node._type === 'image') return 'Imagem'
  if (node._type === 'youtubeEmbed') return 'Vídeo'
  if (node._type === 'articleTable') return 'Tabela'
  return 'Conteúdo'
}

function ArticleObjectCard({
  props,
  projectId,
  dataset,
  selected,
  onEdit,
}: {
  props: BlockRenderProps
  projectId: string
  dataset: string
  selected?: SelectedObject
  onEdit: (selected?: SelectedObject) => void
}) {
  const editor = useEditor()
  const node = props.value as ArticleObject
  const isEditing = selected?.node._key === node._key
  const [pendingRemoval, setPendingRemoval] = useState(false)
  const currentNode = isEditing ? selected.node : node
  const imageUrl =
    node._type === 'image' ? sanityAssetUrl(node.asset?._ref, projectId, dataset) : ''
  const columns = Array.isArray(node.columns) ? node.columns.map((item) => String(item || '')) : []
  const rows = Array.isArray(node.rows) ? node.rows : []

  const keepEditorSelection = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const selectObject = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (target instanceof Element && target.closest('button, input, textarea, select, a, label')) {
      return
    }

    const point = {path: props.path, offset: 0}
    editor.send({type: 'select', at: {anchor: point, focus: point}})
    editor.send({type: 'focus'})
  }

  return (
    <div
      className={`site-editor-rich-object${props.selected || isEditing ? ' is-selected' : ''}${isEditing ? ' is-editing' : ''}`}
      data-object-type={node._type}
      onClick={selectObject}
    >
      <span className="site-editor-rich-object-spacer">{props.children}</span>
      <div className="site-editor-rich-object-content" contentEditable={false}>
        <header>
          <span>
            {node._type === 'image' ? (
              <ImageIcon />
            ) : node._type === 'youtubeEmbed' ? (
              <VideoIcon />
            ) : (
              <ThListIcon />
            )}
            <strong>{objectLabel(node)}</strong>
          </span>
          <nav aria-label={`Ações da ${objectLabel(node).toLowerCase()}`}>
            <button
              type="button"
              onMouseDown={keepEditorSelection}
              onClick={() => onEdit(isEditing ? undefined : {node, path: props.path})}
              aria-label={`${isEditing ? 'Concluir edição da' : 'Editar'} ${objectLabel(node).toLowerCase()}`}
              title={`${isEditing ? 'Concluir edição da' : 'Editar'} ${objectLabel(node).toLowerCase()}`}
            >
              {isEditing ? <CheckmarkIcon /> : <EditIcon />}
            </button>
            <button
              type="button"
              onMouseDown={keepEditorSelection}
              onClick={() => editor.send({type: 'move.block up', at: props.path})}
              aria-label="Mover para cima"
              title="Mover para cima"
            >
              <ArrowUpIcon />
            </button>
            <button
              type="button"
              onMouseDown={keepEditorSelection}
              onClick={() => editor.send({type: 'move.block down', at: props.path})}
              aria-label="Mover para baixo"
              title="Mover para baixo"
            >
              <ArrowDownIcon />
            </button>
            <button
              type="button"
              onMouseDown={keepEditorSelection}
              onClick={() => setPendingRemoval(true)}
              aria-label={`Eliminar ${objectLabel(node).toLowerCase()}`}
              title={`Eliminar ${objectLabel(node).toLowerCase()}`}
            >
              <TrashIcon />
            </button>
          </nav>
        </header>

        {node._type === 'image' ? (
          <figure>
            {imageUrl ? <img src={imageUrl} alt={String(node.alt || '')} /> : <ImageIcon />}
            {node.caption ? <figcaption>{String(node.caption)}</figcaption> : null}
          </figure>
        ) : node._type === 'youtubeEmbed' ? (
          <div className="site-editor-rich-video-preview">
            <VideoIcon />
            <span>
              <strong>{String(node.title || 'Vídeo do YouTube')}</strong>
              <small>{String(node.url || 'Adicione o link do vídeo')}</small>
            </span>
          </div>
        ) : node._type === 'articleTable' ? (
          isEditing ? (
            <TableFields
              node={currentNode}
              embedded
              onChange={(next) => {
                editor.send({type: 'block.set', at: props.path, props: next})
                onEdit({node: {...currentNode, ...next}, path: props.path})
              }}
            />
          ) : columns.length ? (
            <div className="site-editor-rich-table-wrap">
              <table>
                <thead>
                  <tr>
                    {columns.map((column, index) => (
                      <th key={`${index}-${column}`}>{column || `Coluna ${index + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={row._key || String(rowIndex)}>
                      {columns.map((_, columnIndex) => (
                        <td key={columnIndex}>
                          {String(Array.isArray(row.cells) ? row.cells[columnIndex] || '' : '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="site-editor-rich-object-empty">Tabela sem colunas.</p>
          )
        ) : (
          <p className="site-editor-rich-object-empty">Este conteúdo está preservado.</p>
        )}
      </div>
      <ConfirmDialog
        open={pendingRemoval}
        title={`Eliminar ${objectLabel(node).toLowerCase()}?`}
        description="Pode anular com Ctrl+Z antes de guardar."
        onCancel={() => setPendingRemoval(false)}
        onConfirm={() => {
          editor.send({type: 'delete.block', at: props.path})
          setPendingRemoval(false)
        }}
      />
    </div>
  )
}

/**
 * A caret rather than a span of text. Annotating a collapsed range marks nothing,
 * so the link the client asked for simply never appears — with no error and no
 * clue why. Worth distinguishing before either remembering or restoring one.
 */
const isCollapsedSelection = (selection: EditorSelection | undefined) => {
  if (!selection) return true
  const {anchor, focus} = selection
  return (
    anchor.offset === focus.offset && JSON.stringify(anchor.path) === JSON.stringify(focus.path)
  )
}

function ArticleToolbar({
  onUpload,
  onObjectInserted,
}: {
  onUpload: Props['onUpload']
  onObjectInserted: (selected: SelectedObject) => void
}) {
  const editor = useEditor()
  const activeStyle = useEditorSelector(editor, selectors.getActiveStyle)
  const bold = useEditorSelector(editor, selectors.isActiveDecorator('strong'))
  const italic = useEditorSelector(editor, selectors.isActiveDecorator('em'))
  const bullet = useEditorSelector(editor, selectors.isActiveListItem('bullet'))
  const numbered = useEditorSelector(editor, selectors.isActiveListItem('number'))
  const linked = useEditorSelector(editor, selectors.isActiveAnnotation('link'))
  const [openForm, setOpenForm] = useState<'link' | 'video'>()
  const [link, setLink] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [uploadStatus, setUploadStatus] = useState<MediaUploadStatus>()
  const linkSelectionRef = useRef<NonNullable<EditorSelection>>()

  const preserveSelection = (event: React.MouseEvent) => event.preventDefault()
  const refocus = () => editor.send({type: 'focus'})

  const toggleDecorator = (decorator: 'strong' | 'em') => {
    editor.send({type: 'decorator.toggle', decorator})
    refocus()
  }

  const toggleList = (listItem: 'bullet' | 'number') => {
    editor.send({type: 'list item.toggle', listItem})
    refocus()
  }

  const insertObject = (
    name: 'image' | 'youtubeEmbed' | 'articleTable',
    value: Record<string, unknown>,
  ) => {
    const existingKeys = new Set(
      editor
        .getSnapshot()
        .context.value.map((block) => block._key)
        .filter(Boolean),
    )
    refocus()
    editor.send({
      type: 'insert.block object',
      placement: 'auto',
      blockObject: {name, value},
    })
    window.requestAnimationFrame(() => {
      const inserted = editor
        .getSnapshot()
        .context.value.find(
          (block) => block._type === name && block._key && !existingKeys.has(block._key),
        ) as ArticleObject | undefined
      if (!inserted?._key) return
      onObjectInserted({node: inserted, path: [{_key: inserted._key}]})
    })
  }

  const uploadImage = async (file: File) => {
    setUploadStatus({key: 'image', phase: 'preparing', fileName: file.name, percent: 0})
    try {
      const asset = await onUpload(file, 'image', (progress) =>
        setUploadStatus({
          key: 'image',
          phase: progress.percent >= 100 ? 'processing' : 'uploading',
          fileName: file.name,
          percent: progress.percent,
        }),
      )
      setUploadStatus(undefined)
      insertObject('image', {asset: {_type: 'reference', _ref: asset.id}, alt: '', caption: ''})
    } catch (error) {
      setUploadStatus({
        key: 'image',
        phase: 'error',
        fileName: file.name,
        percent: 0,
        message: error instanceof Error ? error.message : 'Não foi possível carregar o ficheiro',
      })
    }
  }

  return (
    <div className="site-editor-rich-toolbar">
      <div className="site-editor-rich-toolbar-main">
        <div className="site-editor-rich-toolbar-row is-formatting">
          <select
            aria-label="Formato do texto"
            value={activeStyle || 'normal'}
            onChange={(event) => {
              editor.send({type: 'style.toggle', style: event.currentTarget.value})
              refocus()
            }}
          >
            <option value="normal">Parágrafo</option>
            <option value="h2">Título de secção</option>
            <option value="h3">Subtítulo</option>
            <option value="blockquote">Citação</option>
          </select>

          <span className="site-editor-rich-toolbar-group is-formatting" aria-label="Formatação">
            <button
              type="button"
              className={bold ? 'is-active' : ''}
              onMouseDown={preserveSelection}
              onClick={() => toggleDecorator('strong')}
              aria-label="Negrito"
              title="Negrito"
            >
              <BoldIcon />
            </button>
            <button
              type="button"
              className={italic ? 'is-active' : ''}
              onMouseDown={preserveSelection}
              onClick={() => toggleDecorator('em')}
              aria-label="Itálico"
              title="Itálico"
            >
              <ItalicIcon />
            </button>
            <button
              type="button"
              className={linked ? 'is-active' : ''}
              onMouseDown={preserveSelection}
              onClick={() => {
                if (linked) {
                  editor.send({type: 'annotation.remove', annotation: {name: 'link'}})
                  refocus()
                } else if (openForm === 'link') {
                  linkSelectionRef.current = undefined
                  setOpenForm(undefined)
                } else {
                  // Only a real range is worth remembering. The editor's own
                  // selection can still be the caret from an earlier click if the
                  // drag that selected the phrase has not reached it yet — and a
                  // collapsed range annotates nothing, so the link silently never
                  // appears. Falling back to the live selection at submit time is
                  // better than restoring a caret over it.
                  const captured = editor.getSnapshot().context.selection
                  linkSelectionRef.current = isCollapsedSelection(captured)
                    ? undefined
                    : (captured ?? undefined)
                  setOpenForm('link')
                }
              }}
              aria-label={linked ? 'Remover ligação' : 'Adicionar ligação'}
              title={linked ? 'Remover ligação' : 'Adicionar ligação'}
            >
              <LinkIcon />
            </button>
          </span>

          <span className="site-editor-rich-toolbar-group is-history" aria-label="Histórico">
            <button
              type="button"
              onMouseDown={preserveSelection}
              onClick={() => editor.send({type: 'history.undo'})}
              aria-label="Desfazer"
              title="Desfazer"
            >
              <UndoIcon />
            </button>
            <button
              type="button"
              onMouseDown={preserveSelection}
              onClick={() => editor.send({type: 'history.redo'})}
              aria-label="Refazer"
              title="Refazer"
            >
              <RedoIcon />
            </button>
          </span>
        </div>

        <div className="site-editor-rich-toolbar-row is-content">
          <span className="site-editor-rich-toolbar-group is-lists" aria-label="Listas">
            <button
              type="button"
              className={bullet ? 'is-active' : ''}
              onMouseDown={preserveSelection}
              onClick={() => toggleList('bullet')}
              aria-label="Lista com marcadores"
              title="Lista com marcadores"
            >
              <UlistIcon /> <span>Lista</span>
            </button>
            <button
              type="button"
              className={numbered ? 'is-active' : ''}
              onMouseDown={preserveSelection}
              onClick={() => toggleList('number')}
              aria-label="Lista numerada"
              title="Lista numerada"
            >
              <OlistIcon /> <span>Numerada</span>
            </button>
          </span>

          <span className="site-editor-rich-toolbar-group is-media" aria-label="Inserir conteúdo">
            <label
              aria-label="Adicionar imagem"
              title="Adicionar imagem"
              aria-disabled={Boolean(uploadStatus) && uploadStatus.phase !== 'error'}
            >
              <ImageIcon /> <span>Imagem</span>
              <input
                type="file"
                accept="image/*"
                disabled={Boolean(uploadStatus) && uploadStatus.phase !== 'error'}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0]
                  if (file) void uploadImage(file)
                  event.currentTarget.value = ''
                }}
              />
            </label>
            <button
              type="button"
              onMouseDown={preserveSelection}
              onClick={() => setOpenForm((current) => (current === 'video' ? undefined : 'video'))}
              aria-label="Adicionar vídeo"
              title="Adicionar vídeo"
            >
              <VideoIcon /> <span>Vídeo</span>
            </button>
            <button
              type="button"
              onMouseDown={preserveSelection}
              onClick={() =>
                insertObject('articleTable', {
                  columns: ['Coluna 1', 'Coluna 2'],
                  rows: [
                    {_key: editorKey(), _type: 'articleTableRow', cells: ['', '']},
                    {_key: editorKey(), _type: 'articleTableRow', cells: ['', '']},
                  ],
                })
              }
              aria-label="Adicionar tabela"
              title="Adicionar tabela"
            >
              <ThListIcon /> <span>Tabela</span>
            </button>
          </span>
        </div>
      </div>

      <MediaUploadProgress status={uploadStatus} />

      {openForm === 'link' ? (
        <form
          className="site-editor-rich-toolbar-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (!link.trim()) return
            const remembered = linkSelectionRef.current
            const live = editor.getSnapshot().context.selection
            const selection = remembered ?? (isCollapsedSelection(live) ? undefined : live)
            const href = link.trim()

            // `select` is dispatched, not applied inline, so annotating in the
            // same tick could run against the selection the editor still had —
            // usually a caret, which marks nothing and drops the link with no
            // error. Restoring the range first and applying once it has landed
            // is what makes this survive a slow machine.
            const applyLink = () => {
              editor.send({
                type: 'annotation.add',
                annotation: {name: 'link', value: {href}},
                ...(selection ? {at: selection} : {}),
              })
              const endPoint = getSelectionEndPoint(editor.getSnapshot().context.selection)
              if (endPoint) {
                editor.send({type: 'select', at: {anchor: endPoint, focus: endPoint}})
              }
            }

            if (selection) {
              editor.send({type: 'select', at: selection})
              setTimeout(applyLink, 0)
            } else {
              applyLink()
            }
            linkSelectionRef.current = undefined
            setLink('')
            setOpenForm(undefined)
            refocus()
          }}
        >
          <label>
            <span>Destino da ligação</span>
            <input
              type="url"
              value={link}
              onChange={(event) => setLink(event.currentTarget.value)}
              placeholder="https://…"
              autoFocus
            />
          </label>
          <button type="submit">Aplicar</button>
          <button
            type="button"
            onClick={() => {
              linkSelectionRef.current = undefined
              setOpenForm(undefined)
              refocus()
            }}
            aria-label="Fechar"
          >
            <CloseIcon />
          </button>
        </form>
      ) : openForm === 'video' ? (
        <form
          className="site-editor-rich-toolbar-form is-video"
          onSubmit={(event) => {
            event.preventDefault()
            if (!videoUrl.trim()) return
            insertObject('youtubeEmbed', {
              url: videoUrl.trim(),
              title: videoTitle.trim(),
              caption: '',
            })
            setVideoUrl('')
            setVideoTitle('')
            setOpenForm(undefined)
          }}
        >
          <label>
            <span>Link do YouTube</span>
            <input
              type="url"
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.currentTarget.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              autoFocus
            />
          </label>
          <label>
            <span>Título</span>
            <input
              value={videoTitle}
              onChange={(event) => setVideoTitle(event.currentTarget.value)}
              placeholder="Ex.: Instalação de decking em 5 passos"
            />
          </label>
          <button type="submit">Adicionar</button>
          <button type="button" onClick={() => setOpenForm(undefined)} aria-label="Fechar">
            <CloseIcon />
          </button>
        </form>
      ) : null}
    </div>
  )
}

function TableFields({
  node,
  onChange,
  embedded = false,
}: {
  node: ArticleObject
  onChange: (props: Record<string, unknown>) => void
  embedded?: boolean
}) {
  const columns = Array.isArray(node.columns) ? node.columns.map((item) => String(item || '')) : []
  const rows = Array.isArray(node.rows) ? node.rows : []
  const grid = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<{row: number; column: number}>()
  const [pendingColumnRemoval, setPendingColumnRemoval] = useState<number>()
  const [pendingRowRemoval, setPendingRowRemoval] = useState<number>()

  useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    pendingFocus.current = undefined
    window.requestAnimationFrame(() => {
      grid.current
        ?.querySelector<HTMLElement>(
          `[data-table-row="${target.row}"][data-table-column="${target.column}"]`,
        )
        ?.focus()
    })
  }, [rows.length])

  const setColumns = (nextColumns: string[]) => onChange({columns: nextColumns})
  const addColumn = () => {
    const nextColumns = [...columns, `Coluna ${columns.length + 1}`]
    const nextRows = rows.map((row) => ({
      ...row,
      cells: [...(Array.isArray(row.cells) ? row.cells : []), ''],
    }))
    onChange({columns: nextColumns, rows: nextRows})
  }
  const removeColumn = (columnIndex: number) => {
    if (columns.length <= 1) return
    onChange({
      columns: columns.filter((_, index) => index !== columnIndex),
      rows: rows.map((row) => ({
        ...row,
        cells: (Array.isArray(row.cells) ? row.cells : []).filter(
          (_, index) => index !== columnIndex,
        ),
      })),
    })
  }
  const addRow = () =>
    onChange({
      rows: [
        ...rows,
        {
          _key: editorKey(),
          _type: 'articleTableRow',
          cells: columns.map(() => ''),
        },
      ],
    })
  const updateCell = (rowIndex: number, columnIndex: number, text: string) => {
    const nextRows = rows.map((row, index) => {
      if (index !== rowIndex) return row
      const cells = Array.from({length: columns.length}, (_, cellIndex) =>
        cellIndex === columnIndex
          ? text
          : String(Array.isArray(row.cells) ? row.cells[cellIndex] || '' : ''),
      )
      return {...row, cells}
    })
    onChange({rows: nextRows})
  }
  const moveBetweenFields = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (event.key !== 'Tab') return
    const fields = Array.from(
      grid.current?.querySelectorAll<HTMLElement>('[data-table-field="true"]') ?? [],
    )
    const index = fields.indexOf(event.currentTarget)
    if (index < 0) return

    const nextIndex = index + (event.shiftKey ? -1 : 1)
    if (nextIndex >= 0 && nextIndex < fields.length) {
      event.preventDefault()
      fields[nextIndex].focus()
      return
    }

    if (!event.shiftKey && columns.length) {
      event.preventDefault()
      pendingFocus.current = {row: rows.length, column: 0}
      addRow()
    }
  }

  return (
    <div className={`site-editor-rich-table-fields${embedded ? ' is-embedded' : ''}`}>
      <header className="site-editor-rich-table-manager-head">
        <span>
          <strong>Conteúdo da tabela</strong>
          <small>
            {columns.length} {columns.length === 1 ? 'coluna' : 'colunas'} · {rows.length}{' '}
            {rows.length === 1 ? 'linha' : 'linhas'}
          </small>
        </span>
        <nav aria-label="Estrutura da tabela">
          <button type="button" onClick={addColumn}>
            + Coluna
          </button>
          <button type="button" onClick={addRow} disabled={!columns.length}>
            + Linha
          </button>
        </nav>
      </header>

      {columns.length ? (
        <div className="site-editor-rich-table-grid-shell">
          <div
            ref={grid}
            className="site-editor-rich-table-grid"
            style={{gridTemplateColumns: `42px repeat(${columns.length}, minmax(150px, 1fr))`}}
          >
            <div className="site-editor-rich-table-corner" aria-hidden="true">
              Linha
            </div>
            {columns.map((column, columnIndex) => (
              <label className="site-editor-rich-table-heading" key={`heading-${columnIndex}`}>
                <span>Coluna {columnIndex + 1}</span>
                <span>
                  <input
                    aria-label={`Nome da coluna ${columnIndex + 1}`}
                    data-table-field="true"
                    data-table-row="heading"
                    data-table-column={columnIndex}
                    placeholder={`Ex.: Coluna ${columnIndex + 1}`}
                    value={column}
                    onKeyDown={moveBetweenFields}
                    onChange={(event) => {
                      const next = [...columns]
                      next[columnIndex] = event.currentTarget.value
                      setColumns(next)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPendingColumnRemoval(columnIndex)}
                    disabled={columns.length <= 1}
                    aria-label={`Eliminar coluna ${columnIndex + 1}`}
                    title={
                      columns.length <= 1 ? 'A tabela precisa de uma coluna' : 'Eliminar coluna'
                    }
                  >
                    <TrashIcon />
                  </button>
                </span>
              </label>
            ))}

            {rows.map((row, rowIndex) => (
              <React.Fragment key={row._key || String(rowIndex)}>
                <div className="site-editor-rich-table-row-control">
                  <span>{rowIndex + 1}</span>
                  <button
                    type="button"
                    onClick={() => setPendingRowRemoval(rowIndex)}
                    aria-label={`Eliminar linha ${rowIndex + 1}`}
                    title="Eliminar linha"
                  >
                    <TrashIcon />
                  </button>
                </div>
                {columns.map((column, columnIndex) => (
                  <label
                    className="site-editor-rich-table-cell"
                    key={`${row._key || rowIndex}-${columnIndex}`}
                  >
                    <span className="site-editor-visually-hidden">
                      Linha {rowIndex + 1}, {column || `coluna ${columnIndex + 1}`}
                    </span>
                    <textarea
                      rows={2}
                      aria-label={`Linha ${rowIndex + 1}, ${column || `coluna ${columnIndex + 1}`}`}
                      data-table-field="true"
                      data-table-row={rowIndex}
                      data-table-column={columnIndex}
                      placeholder="Conteúdo"
                      value={String(Array.isArray(row.cells) ? row.cells[columnIndex] || '' : '')}
                      onChange={(event) =>
                        updateCell(rowIndex, columnIndex, event.currentTarget.value)
                      }
                      onKeyDown={moveBetweenFields}
                    />
                  </label>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : null}

      {!rows.length && columns.length ? (
        <button className="site-editor-rich-table-empty" type="button" onClick={addRow}>
          A tabela ainda não tem linhas. Adicionar a primeira linha
        </button>
      ) : null}
      <ConfirmDialog
        open={pendingColumnRemoval !== undefined}
        title={`Eliminar a coluna ${(pendingColumnRemoval ?? 0) + 1}?`}
        description="Remove essa coluna em todas as linhas. Pode anular com Ctrl+Z antes de guardar."
        onCancel={() => setPendingColumnRemoval(undefined)}
        onConfirm={() => {
          if (pendingColumnRemoval === undefined) return
          removeColumn(pendingColumnRemoval)
          setPendingColumnRemoval(undefined)
        }}
      />
      <ConfirmDialog
        open={pendingRowRemoval !== undefined}
        title={`Eliminar a linha ${(pendingRowRemoval ?? 0) + 1}?`}
        description="Pode anular com Ctrl+Z antes de guardar."
        onCancel={() => setPendingRowRemoval(undefined)}
        onConfirm={() => {
          if (pendingRowRemoval === undefined) return
          onChange({rows: rows.filter((_, index) => index !== pendingRowRemoval)})
          setPendingRowRemoval(undefined)
        }}
      />
    </div>
  )
}

function ArticleObjectEditor({
  selected,
  setSelected,
  onUpload,
}: {
  selected?: SelectedObject
  setSelected: React.Dispatch<React.SetStateAction<SelectedObject | undefined>>
  onUpload: Props['onUpload']
}) {
  const editor = useEditor()
  const [uploadStatus, setUploadStatus] = useState<MediaUploadStatus>()

  useEffect(() => {
    if (!selected) return
    const latest = editor
      .getSnapshot()
      .context.value.find((block) => block._key === selected.node._key) as ArticleObject | undefined
    if (!latest) setSelected(undefined)
  }, [editor, selected, setSelected])

  if (!selected) return null
  if (selected.node._type === 'articleTable') return null

  const patch = (props: Record<string, unknown>) => {
    editor.send({type: 'block.set', at: selected.path, props})
    setSelected((current) => (current ? {...current, node: {...current.node, ...props}} : current))
  }

  const uploadImage = async (file: File) => {
    setUploadStatus({key: 'image', phase: 'preparing', fileName: file.name, percent: 0})
    try {
      const asset = await onUpload(file, 'image', (progress) =>
        setUploadStatus({
          key: 'image',
          phase: progress.percent >= 100 ? 'processing' : 'uploading',
          fileName: file.name,
          percent: progress.percent,
        }),
      )
      setUploadStatus(undefined)
      patch({asset: {_type: 'reference', _ref: asset.id}})
    } catch (error) {
      setUploadStatus({
        key: 'image',
        phase: 'error',
        fileName: file.name,
        percent: 0,
        message: error instanceof Error ? error.message : 'Não foi possível carregar o ficheiro',
      })
    }
  }

  return (
    <section className="site-editor-rich-object-editor">
      <header>
        <span>
          <small>A editar</small>
          <strong>{objectLabel(selected.node)}</strong>
        </span>
        <button type="button" onClick={() => setSelected(undefined)} aria-label="Fechar edição">
          <CloseIcon />
        </button>
      </header>
      <div>
        {selected.node._type === 'image' ? (
          <div className="site-editor-form-stack">
            <label
              className="site-editor-upload-button"
              aria-disabled={Boolean(uploadStatus) && uploadStatus.phase !== 'error'}
            >
              <ImageIcon /> Substituir imagem
              <input
                type="file"
                accept="image/*"
                disabled={Boolean(uploadStatus) && uploadStatus.phase !== 'error'}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0]
                  if (file) void uploadImage(file)
                  event.currentTarget.value = ''
                }}
              />
            </label>
            <MediaUploadProgress status={uploadStatus} />
            <label>
              <span>Descrição da imagem</span>
              <textarea
                rows={3}
                placeholder="Ex.: Banco em plástico reciclado num jardim público"
                value={String(selected.node.alt || '')}
                onChange={(event) => patch({alt: event.currentTarget.value})}
              />
            </label>
            <label>
              <span>Legenda</span>
              <textarea
                rows={3}
                placeholder="Ex.: O banco Gavião instalado no Parque da Cidade"
                value={String(selected.node.caption || '')}
                onChange={(event) => patch({caption: event.currentTarget.value})}
              />
            </label>
          </div>
        ) : selected.node._type === 'youtubeEmbed' ? (
          <div className="site-editor-form-stack">
            <label>
              <span>Link do YouTube</span>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={String(selected.node.url || '')}
                onChange={(event) => patch({url: event.currentTarget.value})}
              />
            </label>
            <label>
              <span>Título do vídeo</span>
              <input
                placeholder="Ex.: Instalação de decking em 5 passos"
                value={String(selected.node.title || '')}
                onChange={(event) => patch({title: event.currentTarget.value})}
              />
            </label>
            <label>
              <span>Legenda</span>
              <textarea
                rows={3}
                placeholder="Ex.: Veja o processo completo de instalação"
                value={String(selected.node.caption || '')}
                onChange={(event) => patch({caption: event.currentTarget.value})}
              />
            </label>
          </div>
        ) : (
          <p>Este conteúdo está preservado, mas ainda não pode ser alterado aqui.</p>
        )}
      </div>
    </section>
  )
}

function ArticleSurface({
  projectId,
  dataset,
  onUpload,
}: {
  projectId: string
  dataset: string
  onUpload: Props['onUpload']
}) {
  const [selected, setSelected] = useState<SelectedObject>()

  const renderBlock = (props: BlockRenderProps) =>
    props.value._type === 'block' ? (
      <div>{props.children}</div>
    ) : (
      <ArticleObjectCard
        props={props}
        projectId={projectId}
        dataset={dataset}
        selected={selected}
        onEdit={setSelected}
      />
    )

  return (
    <>
      <ArticleToolbar onUpload={onUpload} onObjectInserted={setSelected} />
      <div className="site-editor-rich-canvas">
        <PortableTextEditable
          aria-label="Texto do artigo"
          renderStyle={renderStyle}
          renderDecorator={renderDecorator}
          renderAnnotation={renderAnnotation}
          renderBlock={renderBlock}
          renderListItem={(props) => <ArticleListItem {...props} />}
        />
      </div>
      <ArticleObjectEditor selected={selected} setSelected={setSelected} onUpload={onUpload} />
    </>
  )
}

export function ArticleEditor({value, documentKey, projectId, dataset, onChange, onUpload}: Props) {
  const article = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const blocks = useMemo(
    () => (Array.isArray(article.pt) ? (article.pt as PortableTextBlock[]) : []),
    [article.pt],
  )

  return (
    <div className="site-editor-article">
      <EditorProvider
        key={documentKey}
        initialConfig={{
          schemaDefinition,
          initialValue: blocks,
        }}
      >
        <EventListenerPlugin
          on={(event) => {
            if (event.type !== 'mutation') return
            onChange({
              ...article,
              _type: 'localizedArticle',
              pt: event.value || [],
            })
          }}
        />
        <BehaviorPlugin behaviors={paragraphIndentBehaviors} />
        <MarkdownShortcutsPlugin
          boldDecorator={({context}) =>
            context.schema.decorators.find((decorator) => decorator.name === 'strong')?.name
          }
          italicDecorator={({context}) =>
            context.schema.decorators.find((decorator) => decorator.name === 'em')?.name
          }
          defaultStyle={({context}) =>
            context.schema.styles.find((style) => style.name === 'normal')?.name
          }
          headingStyle={({context, props}) =>
            context.schema.styles.find((style) => style.name === `h${props.level}`)?.name
          }
          blockquoteStyle={({context}) =>
            context.schema.styles.find((style) => style.name === 'blockquote')?.name
          }
          orderedList={({context}) =>
            context.schema.lists.find((list) => list.name === 'number')?.name
          }
          unorderedList={({context}) =>
            context.schema.lists.find((list) => list.name === 'bullet')?.name
          }
          linkObject={({context, props}) => {
            const link = context.schema.annotations.find((annotation) => annotation.name === 'link')
            return link ? {_type: link.name, href: props.href} : undefined
          }}
        />
        <PasteLinkPlugin />
        <ArticleSurface projectId={projectId} dataset={dataset} onUpload={onUpload} />
      </EditorProvider>
    </div>
  )
}
