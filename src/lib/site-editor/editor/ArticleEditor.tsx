import React, {useMemo} from 'react'
import {AddIcon} from '@sanity/icons/Add'
import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowUpIcon} from '@sanity/icons/ArrowUp'
import {ImageIcon} from '@sanity/icons/Image'
import {TrashIcon} from '@sanity/icons/Trash'
import {VideoIcon} from '@sanity/icons/Video'
import {editorKey, sanityAssetUrl} from './asset'

type ArticleBlock = Record<string, unknown> & {_key?: string; _type?: string}

type Props = {
  value: unknown
  projectId: string
  dataset: string
  onChange: (value: unknown) => void
  onUpload: (file: File, kind: 'image' | 'video') => Promise<{id: string; url: string}>
}

const textForBlock = (block: ArticleBlock) =>
  Array.isArray(block.children)
    ? block.children
        .map((child) =>
          child && typeof child === 'object' && 'text' in child ? String(child.text || '') : '',
        )
        .join('')
    : ''

export function ArticleEditor({value, projectId, dataset, onChange, onUpload}: Props) {
  const article = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const blocks = useMemo(
    () => (Array.isArray(article.pt) ? (article.pt as ArticleBlock[]) : []),
    [article.pt],
  )

  const commit = (nextBlocks: ArticleBlock[]) =>
    onChange({...article, _type: 'localizedArticle', pt: nextBlocks})

  const update = (index: number, next: ArticleBlock) => {
    const values = [...blocks]
    values[index] = next
    commit(values)
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= blocks.length) return
    const values = [...blocks]
    const [item] = values.splice(index, 1)
    values.splice(target, 0, item)
    commit(values)
  }

  const addText = () =>
    commit([
      ...blocks,
      {
        _key: editorKey(),
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_key: editorKey(), _type: 'span', text: '', marks: []}],
      },
    ])

  const addYoutube = () =>
    commit([
      ...blocks,
      {_key: editorKey(), _type: 'youtubeEmbed', url: '', title: '', caption: ''},
    ])

  const addImage = async (file: File) => {
    const asset = await onUpload(file, 'image')
    commit([
      ...blocks,
      {
        _key: editorKey(),
        _type: 'image',
        asset: {_type: 'reference', _ref: asset.id},
        alt: '',
        caption: '',
      },
    ])
  }

  return (
    <div className="site-editor-article">
      <div className="site-editor-article-note">
        Edite a estrutura em português. As traduções são geridas automaticamente.
      </div>
      <div className="site-editor-article-blocks">
        {blocks.map((block, index) => {
          const key = block._key || String(index)
          return (
            <article className="site-editor-article-block" key={key}>
              <div className="site-editor-array-toolbar">
                <strong>
                  {block._type === 'block'
                    ? 'Texto'
                    : block._type === 'image'
                      ? 'Imagem'
                      : block._type === 'youtubeEmbed'
                        ? 'Vídeo YouTube'
                        : block._type === 'articleTable'
                          ? 'Tabela'
                          : 'Bloco'}
                </strong>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Subir">
                  <ArrowUpIcon />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === blocks.length - 1} aria-label="Descer">
                  <ArrowDownIcon />
                </button>
                <button
                  type="button"
                  onClick={() => commit(blocks.filter((_, itemIndex) => itemIndex !== index))}
                  aria-label="Eliminar bloco"
                >
                  <TrashIcon />
                </button>
              </div>

              {block._type === 'block' ? (
                <>
                  <div className="site-editor-inline-fields">
                    <label>
                      <span>Formato</span>
                      <select
                        value={String(block.style || 'normal')}
                        onChange={(event) => update(index, {...block, style: event.currentTarget.value})}
                      >
                        <option value="normal">Parágrafo</option>
                        <option value="h2">Título de secção</option>
                        <option value="h3">Subtítulo</option>
                        <option value="blockquote">Citação</option>
                      </select>
                    </label>
                    <label>
                      <span>Lista</span>
                      <select
                        value={String(block.listItem || '')}
                        onChange={(event) => {
                          const listItem = event.currentTarget.value
                          const next = {...block}
                          if (listItem) next.listItem = listItem
                          else delete next.listItem
                          update(index, next)
                        }}
                      >
                        <option value="">Sem lista</option>
                        <option value="bullet">Marcadores</option>
                        <option value="number">Numerada</option>
                      </select>
                    </label>
                  </div>
                  <textarea
                    rows={String(block.style || 'normal').startsWith('h') ? 2 : 5}
                    value={textForBlock(block)}
                    onChange={(event) =>
                      update(index, {
                        ...block,
                        markDefs: [],
                        children: [
                          {
                            _key:
                              Array.isArray(block.children) &&
                              block.children[0] &&
                              typeof block.children[0] === 'object' &&
                              '_key' in block.children[0]
                                ? block.children[0]._key
                                : editorKey(),
                            _type: 'span',
                            text: event.currentTarget.value,
                            marks: [],
                          },
                        ],
                      })
                    }
                  />
                </>
              ) : block._type === 'image' ? (
                <div className="site-editor-article-media">
                  {sanityAssetUrl(
                    (block.asset as {_ref?: string} | undefined)?._ref,
                    projectId,
                    dataset,
                  ) ? (
                    <img
                      src={sanityAssetUrl(
                        (block.asset as {_ref?: string} | undefined)?._ref,
                        projectId,
                        dataset,
                      )}
                      alt=""
                    />
                  ) : null}
                  <label>
                    <span>Descrição da imagem</span>
                    <textarea
                      rows={2}
                      value={String(block.alt || '')}
                      onChange={(event) => update(index, {...block, alt: event.currentTarget.value})}
                    />
                  </label>
                  <label>
                    <span>Legenda</span>
                    <textarea
                      rows={2}
                      value={String(block.caption || '')}
                      onChange={(event) => update(index, {...block, caption: event.currentTarget.value})}
                    />
                  </label>
                </div>
              ) : block._type === 'youtubeEmbed' ? (
                <div className="site-editor-form-stack">
                  <label>
                    <span>Link do YouTube</span>
                    <input
                      type="url"
                      value={String(block.url || '')}
                      onChange={(event) => update(index, {...block, url: event.currentTarget.value})}
                    />
                  </label>
                  <label>
                    <span>Título acessível</span>
                    <input
                      value={String(block.title || '')}
                      onChange={(event) => update(index, {...block, title: event.currentTarget.value})}
                    />
                  </label>
                  <label>
                    <span>Legenda</span>
                    <textarea
                      rows={2}
                      value={String(block.caption || '')}
                      onChange={(event) => update(index, {...block, caption: event.currentTarget.value})}
                    />
                  </label>
                </div>
              ) : (
                <div className="site-editor-unsupported-block">
                  Este bloco continua preservado. Use o Studio para alterar esta estrutura específica.
                </div>
              )}
            </article>
          )
        })}
      </div>
      <div className="site-editor-article-add">
        <button type="button" onClick={addText}>
          <AddIcon /> Texto
        </button>
        <label>
          <ImageIcon /> Imagem
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              if (file) void addImage(file)
              event.currentTarget.value = ''
            }}
          />
        </label>
        <button type="button" onClick={addYoutube}>
          <VideoIcon /> Vídeo
        </button>
      </div>
    </div>
  )
}
