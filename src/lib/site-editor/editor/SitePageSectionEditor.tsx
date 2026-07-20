import React, {useMemo, useState} from 'react'
import {AddIcon} from '@sanity/icons/Add'
import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowUpIcon} from '@sanity/icons/ArrowUp'
import {EditIcon} from '@sanity/icons/Edit'
import {ImageIcon} from '@sanity/icons/Image'
import {TrashIcon} from '@sanity/icons/Trash'
import {UploadIcon} from '@sanity/icons/Upload'
import {builderAssetUrl} from '$lib/builder/media'
import {createBuilderKey} from '$lib/builder/defaults'
import type {
  BuilderCard,
  BuilderLink,
  BuilderMedia,
  BuilderSection,
  BuilderStat,
  BuilderTypography,
  LocalizedValue,
} from '$lib/builder/types'
import type {SiteEditorUploadProgress} from './api'
import {ConfirmDialog} from './ConfirmDialog'
import {MediaUploadProgress, type MediaUploadStatus} from './MediaUploadProgress'
import {Toggle} from './Toggle'

type Asset = {id: string; url: string}
type UploadAsset = (
  file: File,
  kind: 'image' | 'video',
  onProgress?: (progress: SiteEditorUploadProgress) => void,
) => Promise<Asset>

type Props = {
  section: BuilderSection
  dataset: string
  onUpdate: (section: BuilderSection) => void
  onUpload: UploadAsset
  onOpenArticle?: (path: string, returnFocus: HTMLButtonElement) => void
}

const textValue = (value?: LocalizedValue | unknown[]) =>
  Array.isArray(value) ? '' : (value?.pt ?? '')

const localizedValue = (
  current: LocalizedValue | unknown[] | undefined,
  value: string,
  type: 'localizedString' | 'localizedText',
): LocalizedValue => ({
  ...(Array.isArray(current) ? {} : current),
  _type: type,
  pt: value,
})

const clampNumber = (value: string, fallback: number, min: number, max: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

const fileSize = (value: number) =>
  value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
    : `${Math.max(1, Math.round(value / 1024))} KB`

function Field({
  label,
  help,
  localized = false,
  children,
}: {
  label: string
  help?: string
  localized?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="site-page-field">
      <span>{label}</span>
      {children}
      {help ? <small>{help}</small> : null}
      {localized ? <small className="site-editor-translation-note">Português · EN e ES automáticos</small> : null}
    </label>
  )
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  // Same widget as every other on/off toggle in the editor, not a bespoke
  // checkbox — see Toggle.tsx.
  return (
    <span className="site-page-switch">
      <span>{label}</span>
      <Toggle checked={checked} label={label} onChange={onChange} />
    </span>
  )
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{value: T; label: string}>
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="site-page-choice">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? 'is-active' : undefined}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function MediaUpload({
  label,
  help,
  accept,
  status,
  hasAsset,
  disabled = false,
  onFile,
}: {
  label: string
  help: string
  accept: string
  status?: MediaUploadStatus
  hasAsset: boolean
  disabled?: boolean
  onFile: (file: File) => void
}) {
  return (
    <div className="site-page-media-upload-wrap">
      <label className={`site-page-media-upload${hasAsset ? ' has-asset' : ''}${disabled ? ' is-disabled' : ''}`}>
        <UploadIcon />
        <span>
          <strong>{hasAsset ? `Substituir ${label.toLowerCase()}` : label}</strong>
          <small>{help}</small>
        </span>
        <input
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (file) onFile(file)
            event.currentTarget.value = ''
          }}
        />
      </label>
      <MediaUploadProgress status={status} />
    </div>
  )
}

const titleSizePresets = [
  {value: 'small', label: 'Discreto', sizes: {desktop: 36, tablet: 32, mobile: 28}},
  {value: 'normal', label: 'Normal', sizes: {desktop: 48, tablet: 42, mobile: 34}},
  {value: 'large', label: 'Grande', sizes: {desktop: 64, tablet: 52, mobile: 40}},
  {value: 'display', label: 'Destaque', sizes: {desktop: 80, tablet: 64, mobile: 48}},
] as const

const bodySizePresets = [
  {value: 'small', label: 'Pequeno', sizes: {desktop: 15, tablet: 15, mobile: 15}},
  {value: 'normal', label: 'Normal', sizes: {desktop: 18, tablet: 18, mobile: 17}},
  {value: 'large', label: 'Grande', sizes: {desktop: 21, tablet: 20, mobile: 18}},
] as const

function TypographyEditor({
  label,
  value,
  kind,
  onChange,
}: {
  label: string
  value?: BuilderTypography
  kind: 'title' | 'body'
  onChange: (value: BuilderTypography) => void
}) {
  const current = value ?? {_type: 'builderTypography'}
  const presets = kind === 'title' ? titleSizePresets : bodySizePresets
  const desktopSize = current.fontSize?.desktop ?? (kind === 'title' ? 48 : 18)
  const selected = presets.reduce((closest, candidate) =>
    Math.abs(candidate.sizes.desktop - desktopSize) < Math.abs(closest.sizes.desktop - desktopSize)
      ? candidate
      : closest,
  )

  return (
    <details className="site-page-subdetails">
      <summary>{label}</summary>
      <div>
        <Field label="Fonte">
          <select
            value={current.fontFamily ?? 'inherit'}
            onChange={(event) => onChange({...current, fontFamily: event.currentTarget.value})}
          >
            <option value="inherit">Fonte do site</option>
            <option value="space-grotesk">Space Grotesk</option>
            <option value="inter">Inter</option>
            <option value="arial">Arial</option>
            <option value="georgia">Georgia</option>
            <option value="times-new-roman">Times New Roman</option>
          </select>
        </Field>
        <Choice
          label="Tamanho"
          value={selected.value}
          options={presets.map((preset) => ({value: preset.value, label: preset.label}))}
          onChange={(presetValue) => {
            const preset = presets.find((candidate) => candidate.value === presetValue) ?? presets[0]
            onChange({...current, fontSize: {...preset.sizes}})
          }}
        />
        <Choice
          label="Alinhamento"
          value={(current.align === 'center' || current.align === 'right' ? current.align : 'left') as 'left' | 'center' | 'right'}
          options={[
            {value: 'left', label: 'Esquerda'},
            {value: 'center', label: 'Centro'},
            {value: 'right', label: 'Direita'},
          ]}
          onChange={(align) => onChange({...current, align})}
        />
        <Switch
          label="Negrito"
          checked={current.fontWeight === '700'}
          onChange={(checked) => onChange({...current, fontWeight: checked ? '700' : '400'})}
        />
      </div>
    </details>
  )
}

function ActionsEditor({
  actions,
  onChange,
}: {
  actions: BuilderLink[]
  onChange: (actions: BuilderLink[]) => void
}) {
  const [pendingRemovalKey, setPendingRemovalKey] = useState<string>()
  return (
    <details className="site-page-editor-group">
      <summary>
        <span><strong>Botões</strong><small>{actions.length ? `${actions.length} configurado${actions.length === 1 ? '' : 's'}` : 'Opcional'}</small></span>
        <b>{actions.length}</b>
      </summary>
      <div className="site-page-editor-group-body">
        {actions.map((action, index) => (
          <div className="site-page-action-row" key={action._key}>
            <header>
              <strong>Botão {index + 1}</strong>
              <button
                type="button"
                aria-label={`Eliminar botão ${index + 1}`}
                onClick={() => setPendingRemovalKey(action._key)}
              >
                <TrashIcon />
              </button>
            </header>
            <Field label="Texto" localized>
              <input
                placeholder="Ex.: Pedir orçamento"
                value={action.label?.pt ?? ''}
                onChange={(event) =>
                  onChange(actions.map((candidate) =>
                    candidate._key === action._key
                      ? {...candidate, label: localizedValue(candidate.label, event.currentTarget.value, 'localizedString')}
                      : candidate,
                  ))
                }
              />
            </Field>
            <Field label="Destino" help="Exemplo: /contacto ou https://exemplo.pt">
              <input
                placeholder="/contacto"
                value={action.href ?? ''}
                onChange={(event) =>
                  onChange(actions.map((candidate) =>
                    candidate._key === action._key ? {...candidate, href: event.currentTarget.value} : candidate,
                  ))
                }
              />
            </Field>
            <Choice
              label="Aspeto"
              value={action.style ?? 'primary'}
              options={[
                {value: 'primary', label: 'Principal'},
                {value: 'secondary', label: 'Secundário'},
                {value: 'text', label: 'Ligação'},
              ]}
              onChange={(style) => onChange(actions.map((candidate) =>
                candidate._key === action._key ? {...candidate, style} : candidate,
              ))}
            />
          </div>
        ))}
        <button
          className="site-page-add-row"
          type="button"
          disabled={actions.length >= 4}
          onClick={() => onChange([
            ...actions,
            {
              _type: 'builderLink',
              _key: createBuilderKey(),
              label: localizedValue(undefined, 'Novo botão', 'localizedString'),
              href: '/',
              style: 'primary',
            },
          ])}
        >
          <AddIcon /> Adicionar botão
        </button>
      </div>
      <ConfirmDialog
        open={pendingRemovalKey !== undefined}
        title="Eliminar este botão?"
        description="Pode anular com Ctrl+Z antes de guardar."
        onCancel={() => setPendingRemovalKey(undefined)}
        onConfirm={() => {
          if (pendingRemovalKey === undefined) return
          onChange(actions.filter((candidate) => candidate._key !== pendingRemovalKey))
          setPendingRemovalKey(undefined)
        }}
      />
    </details>
  )
}

function RepeatersEditor({section, onUpdate}: {section: BuilderSection; onUpdate: (section: BuilderSection) => void}) {
  if (section._type === 'builderStatsSection') {
    const stats = (section.items ?? []) as BuilderStat[]
    return (
      <details className="site-page-editor-group">
        <summary><span><strong>Números</strong><small>Valores e respetiva explicação</small></span><b>{stats.length}</b></summary>
        <div className="site-page-editor-group-body">
          {stats.map((stat, index) => (
            <div className="site-page-repeater" key={stat._key}>
              <header><strong>Número {index + 1}</strong><button type="button" onClick={() => onUpdate({...section, items: stats.filter((item) => item._key !== stat._key)})}><TrashIcon /></button></header>
              <Field label="Valor" localized><input placeholder="Ex.: 15" value={stat.value?.pt ?? ''} onChange={(event) => onUpdate({...section, items: stats.map((item) => item._key === stat._key ? {...item, value: localizedValue(item.value, event.currentTarget.value, 'localizedString')} : item)})} /></Field>
              <Field label="Explicação" localized><input placeholder="Ex.: anos de garantia" value={stat.label?.pt ?? ''} onChange={(event) => onUpdate({...section, items: stats.map((item) => item._key === stat._key ? {...item, label: localizedValue(item.label, event.currentTarget.value, 'localizedString')} : item)})} /></Field>
            </div>
          ))}
          <button className="site-page-add-row" type="button" onClick={() => onUpdate({...section, items: [...stats, {_type: 'builderStat', _key: createBuilderKey(), value: localizedValue(undefined, '0', 'localizedString'), label: localizedValue(undefined, 'Novo indicador', 'localizedString')}]})}><AddIcon /> Adicionar número</button>
        </div>
      </details>
    )
  }

  if (section._type === 'builderCardsSection') {
    const cards = (section.items ?? []) as BuilderCard[]
    return (
      <details className="site-page-editor-group">
        <summary><span><strong>Cartões</strong><small>Uma ideia por cartão</small></span><b>{cards.length}</b></summary>
        <div className="site-page-editor-group-body">
          {cards.map((card, index) => (
            <div className="site-page-repeater" key={card._key}>
              <header><strong>Cartão {index + 1}</strong><button type="button" onClick={() => onUpdate({...section, items: cards.filter((item) => item._key !== card._key)})}><TrashIcon /></button></header>
              <Field label="Título" localized><input placeholder="Ex.: Feito para durar" value={card.title?.pt ?? ''} onChange={(event) => onUpdate({...section, items: cards.map((item) => item._key === card._key ? {...item, title: localizedValue(item.title, event.currentTarget.value, 'localizedString')} : item)})} /></Field>
              <Field label="Texto" localized><textarea rows={4} placeholder="Ex.: Resistente a chuva, sol e variações de temperatura, sem necessidade de manutenção." value={card.body?.pt ?? ''} onChange={(event) => onUpdate({...section, items: cards.map((item) => item._key === card._key ? {...item, body: localizedValue(item.body, event.currentTarget.value, 'localizedText')} : item)})} /></Field>
            </div>
          ))}
          <button className="site-page-add-row" type="button" onClick={() => onUpdate({...section, items: [...cards, {_type: 'builderCard', _key: createBuilderKey(), title: localizedValue(undefined, 'Novo cartão', 'localizedString'), body: localizedValue(undefined, '', 'localizedText')}]})}><AddIcon /> Adicionar cartão</button>
        </div>
      </details>
    )
  }

  return null
}

export function SitePageSectionEditor({section, dataset, onUpdate, onUpload, onOpenArticle}: Props) {
  const [uploadStatus, setUploadStatus] = useState<MediaUploadStatus>()
  const [selectedGalleryKey, setSelectedGalleryKey] = useState<string>()
  const [pendingMediaDelete, setPendingMediaDelete] = useState<BuilderMedia>()
  const uploadBusy = Boolean(
    uploadStatus && ['preparing', 'uploading', 'processing'].includes(uploadStatus.phase),
  )
  const galleryItems = useMemo(() => (section.items ?? []) as BuilderMedia[], [section.items])
  const selectedGalleryItem = galleryItems.find((item) => item._key === selectedGalleryKey)
  const canHaveActions = ['builderHeroSection', 'builderRichTextSection', 'builderMediaSection', 'builderCollectionSection', 'builderCtaSection'].includes(section._type)
  const canHaveMedia = ['builderHeroSection', 'builderMediaSection'].includes(section._type)

  const uploadFile = async (
    key: string,
    file: File,
    kind: 'image' | 'video',
    apply: (asset: Asset) => void,
  ) => {
    setUploadStatus({key, phase: 'preparing', fileName: `${file.name} · ${fileSize(file.size)}`, percent: 0})
    try {
      const asset = await onUpload(file, kind, (progress) => {
        setUploadStatus({
          key,
          phase: progress.percent >= 100 ? 'processing' : 'uploading',
          fileName: `${file.name} · ${fileSize(file.size)}`,
          percent: progress.percent,
        })
      })
      apply(asset)
      setUploadStatus({key, phase: 'done', fileName: file.name, percent: 100})
    } catch (error) {
      setUploadStatus({
        key,
        phase: 'error',
        fileName: file.name,
        percent: 0,
        message: error instanceof Error ? error.message : 'Não foi possível carregar',
      })
    }
  }

  const updateMedia = (media: BuilderMedia) => onUpdate({...section, media})

  const uploadPoster = (file: File, media: BuilderMedia, apply: (next: BuilderMedia) => void) =>
    uploadFile(`poster-${media._key || 'primary'}`, file, 'image', (asset) =>
      apply({...media, poster: {_type: 'image', asset: {_type: 'reference', _ref: asset.id}}}),
    )

  const uploadGallery = async (files: FileList) => {
    const selectedFiles = Array.from(files).slice(0, 20)
    let nextItems = [...galleryItems]
    for (let index = 0; index < selectedFiles.length; index += 1) {
      const file = selectedFiles[index]
      const kind = file.type.startsWith('video/') ? 'video' : 'image'
      await uploadFile(`gallery-${index}`, file, kind, (asset) => {
        const item: BuilderMedia = {
          _type: 'builderMedia',
          _key: createBuilderKey(),
          kind,
          fit: 'contain',
          position: 'center',
          alt: localizedValue(undefined, '', 'localizedString'),
          ...(kind === 'image'
            ? {image: {_type: 'image', asset: {_type: 'reference', _ref: asset.id}}}
            : {
                videoFile: {_type: 'file', asset: {_type: 'reference', _ref: asset.id}},
                autoplay: true,
                muted: true,
                loop: true,
                controls: true,
              }),
        }
        nextItems = [...nextItems, item]
        onUpdate({...section, items: nextItems})
        setSelectedGalleryKey(item._key)
      })
    }
  }

  const renderMediaEditor = (
    media: BuilderMedia,
    apply: (media: BuilderMedia) => void,
    statusPrefix: string,
  ) => {
    const kind = media.kind ?? 'image'
    const assetRef = kind === 'image' ? media.image?.asset?._ref : media.videoFile?.asset?._ref
    const posterRef = media.poster?.asset?._ref
    const previewUrl = builderAssetUrl(kind === 'video' ? posterRef || assetRef : assetRef, dataset)
    return (
      <div className="site-page-media-editor">
        {previewUrl ? (
          <div className={`site-page-media-preview is-${kind}`}>
            {kind === 'video' && !posterRef ? <span>Vídeo</span> : <img src={previewUrl} alt="" />}
          </div>
        ) : null}
        <Choice
          label="Tipo"
          value={kind}
          options={[
            {value: 'image', label: 'Imagem'},
            {value: 'video', label: 'Vídeo'},
            {value: 'youtube', label: 'YouTube'},
          ]}
          onChange={(nextKind) => apply({
            ...media,
            kind: nextKind,
            ...(nextKind === 'video' ? {autoplay: true, muted: true, loop: true, controls: true} : {}),
          })}
        />
        {kind === 'youtube' ? (
          <Field label="Link do YouTube">
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=…"
              value={media.youtubeUrl ?? ''}
              onChange={(event) => apply({...media, youtubeUrl: event.currentTarget.value})}
            />
          </Field>
        ) : (
          <MediaUpload
            label={kind === 'video' ? 'Carregar vídeo' : 'Carregar imagem'}
            help={kind === 'video' ? 'MP4 ou WebM. O progresso aparece aqui.' : 'JPG, PNG ou WebP.'}
            accept={kind === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
            hasAsset={Boolean(assetRef)}
            disabled={uploadBusy}
            status={uploadStatus?.key === statusPrefix ? uploadStatus : undefined}
            onFile={(file) =>
              void uploadFile(statusPrefix, file, kind, (asset) => apply({
                ...media,
                kind,
                ...(kind === 'image'
                  ? {image: {_type: 'image', asset: {_type: 'reference', _ref: asset.id}}}
                  : {
                      videoFile: {_type: 'file', asset: {_type: 'reference', _ref: asset.id}},
                      autoplay: true,
                      muted: true,
                      loop: true,
                      controls: true,
                    }),
              }))
            }
          />
        )}
        {kind === 'video' ? (
          <MediaUpload
            label="Adicionar imagem de capa"
            help="Aparece antes do vídeo e na miniatura da galeria"
            accept="image/*"
            hasAsset={Boolean(posterRef)}
            disabled={uploadBusy}
            status={uploadStatus?.key === `poster-${media._key || 'primary'}` ? uploadStatus : undefined}
            onFile={(file) => void uploadPoster(file, media, apply)}
          />
        ) : null}
        <Field
          label="Descrição acessível"
          help="Descreva o que é importante na imagem ou no vídeo"
          localized
        >
          <textarea rows={3} placeholder="Ex.: Banco em plástico reciclado instalado num jardim público." value={media.alt?.pt ?? ''} onChange={(event) => apply({...media, alt: localizedValue(media.alt, event.currentTarget.value, 'localizedString')})} />
        </Field>
        <details className="site-page-subdetails">
          <summary>Opções de apresentação</summary>
          <div>
            <Choice
              label="Enquadramento"
              value={media.fit ?? 'cover'}
              options={[{value: 'cover', label: 'Preencher'}, {value: 'contain', label: 'Mostrar tudo'}]}
              onChange={(fit) => apply({...media, fit})}
            />
            {kind !== 'image' ? (
              <>
                <Switch label="Reproduzir automaticamente" checked={media.autoplay !== false} onChange={(autoplay) => apply({...media, autoplay, muted: autoplay ? true : media.muted})} />
                <Switch label="Repetir vídeo" checked={media.loop !== false} onChange={(loop) => apply({...media, loop})} />
                <Switch label="Mostrar controlos" checked={media.controls !== false} onChange={(controls) => apply({...media, controls})} />
              </>
            ) : null}
          </div>
        </details>
      </div>
    )
  }

  const layout = section.layout ?? {_type: 'builderLayout'}
  const spacing = layout.spacing ?? {_type: 'builderSpacing'}
  const spacingValue = (spacing.top ?? 64) <= 44 ? 'compact' : (spacing.top ?? 64) >= 84 ? 'wide' : 'normal'
  const textFields = 'title' in section || 'body' in section || 'eyebrow' in section

  return (
    <div className="site-page-section-editor">
      <header className="site-page-section-editor-head">
        <span><small>Secção</small><strong>{section.internalLabel || 'Secção sem nome'}</strong></span>
        <Switch label="Mostrar" checked={section.enabled !== false} onChange={(enabled) => onUpdate({...section, enabled})} />
      </header>

      {textFields ? (
        <section className="site-page-editor-group is-open">
          <header><span><strong>Conteúdo</strong><small>O texto que aparece nesta secção</small></span></header>
          <div className="site-page-editor-group-body">
            {'eyebrow' in section ? <Field label="Etiqueta" localized><input placeholder="Ex.: Sobre nós" value={textValue(section.eyebrow)} onChange={(event) => onUpdate({...section, eyebrow: localizedValue(section.eyebrow, event.currentTarget.value, 'localizedString')})} /></Field> : null}
            {'title' in section ? <Field label="Título" localized><textarea rows={3} placeholder="Ex.: Feito para durar no exterior" value={textValue(section.title)} onChange={(event) => onUpdate({...section, title: localizedValue(section.title, event.currentTarget.value, 'localizedString')})} /></Field> : null}
            {'body' in section && !Array.isArray(section.body) ? <Field label="Texto" localized><textarea rows={6} placeholder="Ex.: Uma frase curta que resume o que esta secção oferece." value={textValue(section.body)} onChange={(event) => onUpdate({...section, body: localizedValue(section.body, event.currentTarget.value, 'localizedText')})} /></Field> : null}
            {Array.isArray(section.body) ? (
              <button
                className="site-page-article-button"
                type="button"
                onClick={(event) => onOpenArticle?.(`sections[_key=="${section._key}"].body`, event.currentTarget)}
              >
                <EditIcon /> <span><strong>Editar texto editorial</strong><small>Abre o editor completo para títulos, listas, imagens e tabelas</small></span>
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {section._type === 'builderCollectionSection' ? (
        <details className="site-page-editor-group" open>
          <summary><span><strong>Lista automática</strong><small>Escolha o conteúdo que o site mostra</small></span></summary>
          <div className="site-page-editor-group-body">
            <Field label="Conteúdo"><select value={section.source ?? 'productCategory'} onChange={(event) => onUpdate({...section, source: event.currentTarget.value as NonNullable<typeof section.source>})}><option value="productCategory">Produtos</option><option value="storeProduct">Produtos da loja</option><option value="caseStudy">Casos de estudo</option><option value="blogPost">Artigos do blog</option></select></Field>
            <Field label="Quantidade"><input type="number" min="1" max="24" value={section.limit ?? 6} onChange={(event) => onUpdate({...section, limit: clampNumber(event.currentTarget.value, 6, 1, 24)})} /></Field>
            <Switch label="Mostrar pesquisa" checked={section.showSearch === true} onChange={(showSearch) => onUpdate({...section, showSearch})} />
            <Switch label="Mostrar paginação" checked={section.showPagination === true} onChange={(showPagination) => onUpdate({...section, showPagination})} />
          </div>
        </details>
      ) : null}

      {section._type === 'builderContactSection' ? (
        <details className="site-page-editor-group" open>
          <summary><span><strong>Formulário</strong><small>Escolha o objetivo do pedido</small></span></summary>
          <div className="site-page-editor-group-body">
            <Field label="Tipo"><select value={section.formKind ?? 'contact'} onChange={(event) => onUpdate({...section, formKind: event.currentTarget.value as NonNullable<typeof section.formKind>})}><option value="contact">Contacto geral</option><option value="quote">Pedido de orçamento</option><option value="catalogue">Pedido de catálogo</option></select></Field>
            <Switch label="Mostrar contactos" checked={section.showContactDetails !== false} onChange={(showContactDetails) => onUpdate({...section, showContactDetails})} />
          </div>
        </details>
      ) : null}

      <RepeatersEditor section={section} onUpdate={onUpdate} />
      {canHaveActions ? <ActionsEditor actions={section.actions ?? []} onChange={(actions) => onUpdate({...section, actions})} /> : null}

      {canHaveMedia ? (
        <details className="site-page-editor-group" open>
          <summary><span><strong>Imagem ou vídeo</strong><small>Media principal da secção</small></span><ImageIcon /></summary>
          <div className="site-page-editor-group-body">
            {renderMediaEditor(section.media ?? {_type: 'builderMedia', kind: 'image', fit: 'cover', position: 'center'}, updateMedia, 'primary')}
          </div>
        </details>
      ) : null}

      {section._type === 'builderGallerySection' ? (
        <details className="site-page-editor-group" open>
          <summary><span><strong>Galeria</strong><small>Imagens e vídeos pela ordem apresentada</small></span><b>{galleryItems.length}</b></summary>
          <div className="site-page-editor-group-body">
            <label className={`site-page-gallery-add${uploadBusy ? ' is-disabled' : ''}`}>
              <UploadIcon /> <span><strong>Adicionar à galeria</strong><small>Pode selecionar vários ficheiros</small></span>
              <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple disabled={uploadBusy} onChange={(event) => { if (event.currentTarget.files?.length) void uploadGallery(event.currentTarget.files); event.currentTarget.value = '' }} />
            </label>
            {uploadStatus?.key.startsWith('gallery-') ? <MediaUploadProgress status={uploadStatus} /> : null}
            <div className="site-page-gallery-list">
              {galleryItems.map((item, index) => {
                const preview = builderAssetUrl(item.kind === 'video' ? item.poster?.asset?._ref : item.image?.asset?._ref, dataset)
                return (
                  <div className={selectedGalleryKey === item._key ? 'is-active' : undefined} key={item._key}>
                    <button type="button" onClick={() => setSelectedGalleryKey(item._key)}>
                      <i>{preview ? <img src={preview} alt="" /> : item.kind === 'video' ? '▶' : <ImageIcon />}</i>
                      <span><strong>{item.kind === 'video' ? 'Vídeo' : 'Imagem'} {index + 1}</strong><small>{item.kind === 'video' && item.poster?.asset?._ref ? 'Com imagem de capa' : 'Editar detalhes'}</small></span>
                    </button>
                    <nav aria-label={`Ordenar item ${index + 1}`}>
                      <button type="button" disabled={index === 0} aria-label="Mover para cima" onClick={() => { const next = [...galleryItems]; const [moved] = next.splice(index, 1); next.splice(index - 1, 0, moved); onUpdate({...section, items: next}) }}><ArrowUpIcon /></button>
                      <button type="button" disabled={index === galleryItems.length - 1} aria-label="Mover para baixo" onClick={() => { const next = [...galleryItems]; const [moved] = next.splice(index, 1); next.splice(index + 1, 0, moved); onUpdate({...section, items: next}) }}><ArrowDownIcon /></button>
                      <button type="button" aria-label="Remover da galeria" onClick={() => setPendingMediaDelete(item)}><TrashIcon /></button>
                    </nav>
                  </div>
                )
              })}
            </div>
            {selectedGalleryItem ? (
              <div className="site-page-gallery-detail">
                <header><strong>Editar {selectedGalleryItem.kind === 'video' ? 'vídeo' : 'imagem'}</strong><button type="button" onClick={() => setSelectedGalleryKey(undefined)}>Fechar</button></header>
                {renderMediaEditor(selectedGalleryItem, (next) => onUpdate({...section, items: galleryItems.map((item) => item._key === next._key ? next : item)}), `gallery-item-${selectedGalleryItem._key}`)}
              </div>
            ) : null}
          </div>
        </details>
      ) : null}

      <details className="site-page-editor-group is-appearance">
        <summary><span><strong>Aparência</strong><small>Ajustes opcionais; o site adapta o telemóvel automaticamente</small></span></summary>
        <div className="site-page-editor-group-body">
          <Field label="Fundo"><select value={layout.surface ?? 'fog'} onChange={(event) => onUpdate({...section, layout: {...layout, surface: event.currentTarget.value as NonNullable<typeof layout.surface>}})}><option value="white">Branco</option><option value="fog">Névoa</option><option value="mint">Verde claro</option><option value="deep">Verde profundo</option><option value="blue">Azul mineral</option><option value="transparent">Transparente</option></select></Field>
          <Choice label="Largura" value={layout.width ?? 'wide'} options={[{value: 'narrow', label: 'Leitura'}, {value: 'content', label: 'Normal'}, {value: 'wide', label: 'Larga'}, {value: 'full', label: 'Total'}]} onChange={(width) => onUpdate({...section, layout: {...layout, width}})} />
          <Choice label="Espaçamento" value={spacingValue} options={[{value: 'compact', label: 'Compacto'}, {value: 'normal', label: 'Normal'}, {value: 'wide', label: 'Amplo'}]} onChange={(preset) => { const amount = preset === 'compact' ? 40 : preset === 'wide' ? 96 : 64; onUpdate({...section, layout: {...layout, spacing: {...spacing, top: amount, bottom: amount}}}) }} />
          {section._type === 'builderHeroSection' ? <Choice label="Composição" value={(section.variant ?? 'split') as 'split' | 'overlay' | 'editorial' | 'media-first'} options={[{value: 'split', label: 'Lado a lado'}, {value: 'overlay', label: 'Sobre imagem'}, {value: 'editorial', label: 'Editorial'}, {value: 'media-first', label: 'Imagem primeiro'}]} onChange={(variant) => onUpdate({...section, variant})} /> : null}
          {section._type === 'builderMediaSection' ? <Choice label="Posição da imagem" value={(section.mediaSide ?? 'right') as 'left' | 'right' | 'top' | 'bottom'} options={[{value: 'left', label: 'Esquerda'}, {value: 'right', label: 'Direita'}, {value: 'top', label: 'Acima'}, {value: 'bottom', label: 'Abaixo'}]} onChange={(mediaSide) => onUpdate({...section, mediaSide})} /> : null}
          {section._type === 'builderGallerySection' ? <Choice label="Apresentação" value={(section.presentation ?? 'gallery') as 'grid' | 'gallery' | 'rail'} options={[{value: 'gallery', label: 'Principal'}, {value: 'grid', label: 'Grelha'}, {value: 'rail', label: 'Faixa'}]} onChange={(presentation) => onUpdate({...section, presentation})} /> : null}
          {['builderGallerySection', 'builderCardsSection', 'builderStatsSection', 'builderCollectionSection'].includes(section._type) ? <Choice label="Colunas" value={String(layout.columns ?? 3) as '1' | '2' | '3' | '4'} options={[{value: '1', label: '1'}, {value: '2', label: '2'}, {value: '3', label: '3'}, {value: '4', label: '4'}]} onChange={(columns) => onUpdate({...section, layout: {...layout, columns: Number(columns), mobileColumns: section._type === 'builderStatsSection' ? 2 : 1}})} /> : null}
          {'title' in section ? <TypographyEditor label="Título" value={section.titleStyle} kind="title" onChange={(titleStyle) => onUpdate({...section, titleStyle})} /> : null}
          {'body' in section && !Array.isArray(section.body) ? <TypographyEditor label="Texto" value={section.bodyStyle} kind="body" onChange={(bodyStyle) => onUpdate({...section, bodyStyle})} /> : null}
        </div>
      </details>

      <details className="site-page-editor-group is-advanced">
        <summary><span><strong>Organização</strong><small>Nome interno e ligação direta</small></span></summary>
        <div className="site-page-editor-group-body">
          <Field label="Nome no editor" help="Só ajuda a reconhecer esta secção"><input placeholder="Ex.: Destaque principal" value={section.internalLabel ?? ''} onChange={(event) => onUpdate({...section, internalLabel: event.currentTarget.value})} /></Field>
          <Field label="Ligação direta" help="Opcional. Exemplo: impacto"><input placeholder="impacto" value={section.anchor ?? ''} onChange={(event) => onUpdate({...section, anchor: event.currentTarget.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})} /></Field>
        </div>
      </details>

      <ConfirmDialog
        open={Boolean(pendingMediaDelete)}
        title="Remover este ficheiro da galeria?"
        description="O ficheiro deixa de aparecer nesta página. Pode desfazer a alteração antes de publicar."
        confirmLabel="Remover"
        onCancel={() => setPendingMediaDelete(undefined)}
        onConfirm={() => {
          if (!pendingMediaDelete) return
          onUpdate({...section, items: galleryItems.filter((item) => item._key !== pendingMediaDelete._key)})
          if (selectedGalleryKey === pendingMediaDelete._key) setSelectedGalleryKey(undefined)
          setPendingMediaDelete(undefined)
        }}
      />
    </div>
  )
}
