import React, {useMemo, useState, type ChangeEvent} from 'react'
import {AddIcon} from '@sanity/icons/Add'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ImageIcon} from '@sanity/icons/Image'
import {TrashIcon} from '@sanity/icons/Trash'
import {UploadIcon} from '@sanity/icons/Upload'
import {createBuilderKey} from '../defaults'
import type {
  BuilderCard,
  BuilderLink,
  BuilderMedia,
  BuilderPage,
  BuilderSection,
  BuilderSiteSettings,
  BuilderStat,
  BuilderValidationIssue,
  LocalizedValue,
} from '../types'

type InspectorScope = 'page' | 'section' | 'site'

type BuilderInspectorProps = {
  scope: InspectorScope
  page: BuilderPage
  section?: BuilderSection
  settings?: BuilderSiteSettings
  issues: BuilderValidationIssue[]
  uploadState?: string
  onUpdatePage: (page: BuilderPage) => void
  onUpdateSection: (section: BuilderSection) => void
  onUpdateSettings: (settings: BuilderSiteSettings) => void
  onUploadSectionMedia: (file: File, kind: 'image' | 'video') => void
  onUploadGalleryMedia: (files: FileList) => void
}

export type BuilderSectionInspectorProps = Pick<
  BuilderInspectorProps,
  | 'section'
  | 'issues'
  | 'uploadState'
  | 'onUpdateSection'
  | 'onUploadSectionMedia'
  | 'onUploadGalleryMedia'
>

type FieldProps = {
  label: string
  help?: string
  children: React.ReactNode
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

function Field({label, help, children}: FieldProps) {
  return (
    <label className="df4y-builder-field">
      <span>{label}</span>
      {children}
      {help ? <small>{help}</small> : null}
    </label>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="df4y-builder-toggle">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <i aria-hidden="true">
        <CheckmarkIcon />
      </i>
    </label>
  )
}

const numberValue = (event: ChangeEvent<HTMLInputElement>, fallback: number) => {
  const next = Number(event.currentTarget.value)
  return Number.isFinite(next) ? next : fallback
}

function IssueList({issues}: {issues: BuilderValidationIssue[]}) {
  if (!issues.length) return null
  return (
    <div className="df4y-builder-issues">
      <strong>Antes de publicar</strong>
      {issues.map((issue, index) => (
        <p className={`is-${issue.level}`} key={`${issue.field}-${issue.sectionKey}-${index}`}>
          {issue.message}
        </p>
      ))}
    </div>
  )
}

function PageInspector({
  page,
  issues,
  onUpdate,
}: {
  page: BuilderPage
  issues: BuilderValidationIssue[]
  onUpdate: (page: BuilderPage) => void
}) {
  return (
    <>
      <div className="df4y-builder-inspector-title">
        <span className="df4y-builder-overline">Página</span>
        <h2>{page.title || 'Página sem nome'}</h2>
        <p>Defina o endereço, estado e apresentação nos motores de pesquisa.</p>
      </div>

      <div className="df4y-builder-inspector-group">
        <h3>Identificação</h3>
        <Field label="Nome da página" help="Só ajuda a reconhecer a página no editor.">
          <input
            value={page.title}
            onChange={(event) => onUpdate({...page, title: event.currentTarget.value})}
          />
        </Field>
        <Field label="Endereço" help="Use / para a página inicial ou /nome-da-pagina.">
          <input
            value={page.route}
            onChange={(event) => onUpdate({...page, route: event.currentTarget.value})}
          />
        </Field>
        <Field label="Tipo de página">
          <select
            value={page.pageKind}
            onChange={(event) =>
              onUpdate({...page, pageKind: event.currentTarget.value as BuilderPage['pageKind']})
            }
          >
            <option value="standard">Página normal</option>
            <option value="home">Página inicial</option>
            <option value="listing">Listagem</option>
            <option value="detail">Detalhe</option>
            <option value="contact">Contacto</option>
            <option value="legal">Legal</option>
          </select>
        </Field>
        <Toggle
          label="Página ativa"
          checked={page.active !== false}
          onChange={(active) => onUpdate({...page, active})}
        />
      </div>

      <div className="df4y-builder-inspector-group">
        <h3>Pesquisa e partilha</h3>
        <Field label="Título SEO" help="Idealmente entre 30 e 60 caracteres.">
          <input
            value={textValue(page.seo?.title)}
            onChange={(event) =>
              onUpdate({
                ...page,
                seo: {
                  ...page.seo,
                  _type: 'builderSeo',
                  title: localizedValue(
                    page.seo?.title,
                    event.currentTarget.value,
                    'localizedString',
                  ),
                },
              })
            }
          />
        </Field>
        <Field label="Descrição SEO" help="Idealmente entre 120 e 160 caracteres.">
          <textarea
            rows={4}
            value={textValue(page.seo?.description)}
            onChange={(event) =>
              onUpdate({
                ...page,
                seo: {
                  ...page.seo,
                  _type: 'builderSeo',
                  description: localizedValue(
                    page.seo?.description,
                    event.currentTarget.value,
                    'localizedText',
                  ),
                },
              })
            }
          />
        </Field>
        <Toggle
          label="Ocultar dos motores de pesquisa"
          checked={page.seo?.noIndex === true}
          onChange={(noIndex) =>
            onUpdate({...page, seo: {...page.seo, _type: 'builderSeo', noIndex}})
          }
        />
      </div>
      <IssueList issues={issues.filter((issue) => !issue.sectionKey)} />
    </>
  )
}

function TypographyInspector({
  label,
  value,
  onChange,
}: {
  label: string
  value: BuilderSection['titleStyle']
  onChange: (value: NonNullable<BuilderSection['titleStyle']>) => void
}) {
  const typography = value ?? {_type: 'builderTypography'}
  const sizes = typography.fontSize ?? {}

  return (
    <details className="df4y-builder-inspector-details">
      <summary>{label}</summary>
      <div className="df4y-builder-details-content">
        <Field label="Fonte">
          <select
            value={typography.fontFamily ?? 'inherit'}
            onChange={(event) => onChange({...typography, fontFamily: event.currentTarget.value})}
          >
            <option value="inherit">Tema da página</option>
            <option value="space-grotesk">Space Grotesk</option>
            <option value="inter">Inter</option>
            <option value="arial">Arial</option>
            <option value="georgia">Georgia</option>
            <option value="times-new-roman">Times New Roman</option>
          </select>
        </Field>
        <div className="df4y-builder-field-grid is-three">
          {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
            <Field
              key={device}
              label={
                device === 'desktop' ? 'Computador' : device === 'tablet' ? 'Tablet' : 'Telemóvel'
              }
            >
              <input
                type="number"
                min="10"
                max={device === 'mobile' ? '80' : '120'}
                value={sizes[device] ?? ''}
                onChange={(event) =>
                  onChange({...typography, fontSize: {...sizes, [device]: numberValue(event, 16)}})
                }
              />
            </Field>
          ))}
        </div>
        <div className="df4y-builder-field-grid">
          <Field label="Peso">
            <select
              value={typography.fontWeight ?? 'inherit'}
              onChange={(event) => onChange({...typography, fontWeight: event.currentTarget.value})}
            >
              <option value="inherit">Tema</option>
              <option value="400">Regular</option>
              <option value="500">Médio</option>
              <option value="600">Semibold</option>
              <option value="700">Negrito</option>
            </select>
          </Field>
          <Field label="Alinhar">
            <select
              value={typography.align ?? 'inherit'}
              onChange={(event) => onChange({...typography, align: event.currentTarget.value})}
            >
              <option value="inherit">Secção</option>
              <option value="left">Esquerda</option>
              <option value="center">Centro</option>
              <option value="right">Direita</option>
            </select>
          </Field>
        </div>
        <div className="df4y-builder-field-grid">
          <Field label="Altura de linha">
            <input
              type="number"
              min="0.9"
              max="2"
              step="0.05"
              value={typography.lineHeight ?? 1.2}
              onChange={(event) => onChange({...typography, lineHeight: numberValue(event, 1.2)})}
            />
          </Field>
          <Field label="Largura do texto">
            <input
              type="number"
              min="10"
              max="80"
              value={typography.maxWidth ?? 24}
              onChange={(event) => onChange({...typography, maxWidth: numberValue(event, 24)})}
            />
          </Field>
        </div>
      </div>
    </details>
  )
}

function ActionsInspector({
  actions,
  onChange,
}: {
  actions: BuilderLink[]
  onChange: (actions: BuilderLink[]) => void
}) {
  return (
    <details className="df4y-builder-inspector-details">
      <summary>
        Botões e ligações <b>{actions.length}</b>
      </summary>
      <div className="df4y-builder-details-content">
        {actions.map((action, index) => (
          <div className="df4y-builder-repeater" key={action._key}>
            <div className="df4y-builder-repeater-heading">
              <strong>Botão {index + 1}</strong>
              <button
                type="button"
                onClick={() => onChange(actions.filter((item) => item._key !== action._key))}
                title="Remover botão"
              >
                <TrashIcon />
              </button>
            </div>
            <Field label="Texto">
              <input
                value={action.label?.pt ?? ''}
                onChange={(event) =>
                  onChange(
                    actions.map((item) =>
                      item._key === action._key
                        ? {
                            ...item,
                            label: localizedValue(
                              item.label,
                              event.currentTarget.value,
                              'localizedString',
                            ),
                          }
                        : item,
                    ),
                  )
                }
              />
            </Field>
            <Field label="Destino">
              <input
                value={action.href ?? ''}
                placeholder="/contacto"
                onChange={(event) =>
                  onChange(
                    actions.map((item) =>
                      item._key === action._key ? {...item, href: event.currentTarget.value} : item,
                    ),
                  )
                }
              />
            </Field>
            <Field label="Aspeto">
              <select
                value={action.style ?? 'primary'}
                onChange={(event) =>
                  onChange(
                    actions.map((item) =>
                      item._key === action._key
                        ? {...item, style: event.currentTarget.value as BuilderLink['style']}
                        : item,
                    ),
                  )
                }
              >
                <option value="primary">Principal</option>
                <option value="secondary">Secundário</option>
                <option value="text">Só texto</option>
              </select>
            </Field>
          </div>
        ))}
        <button
          className="df4y-builder-secondary-button"
          type="button"
          onClick={() =>
            onChange([
              ...actions,
              {
                _type: 'builderLink',
                _key: createBuilderKey(),
                label: localizedValue(undefined, 'Novo botão', 'localizedString'),
                href: '/',
                style: 'primary',
              },
            ])
          }
          disabled={actions.length >= 4}
        >
          <AddIcon /> Adicionar botão
        </button>
      </div>
    </details>
  )
}

function MediaInspector({
  media,
  uploadState,
  onChange,
  onUpload,
}: {
  media?: BuilderMedia
  uploadState?: string
  onChange: (media: BuilderMedia | undefined) => void
  onUpload: (file: File, kind: 'image' | 'video') => void
}) {
  const value: BuilderMedia = media ?? {
    _type: 'builderMedia',
    kind: 'image',
    fit: 'cover',
    position: 'center',
  }
  const asset = value.kind === 'image' ? value.image?.asset?._ref : value.videoFile?.asset?._ref

  return (
    <details className="df4y-builder-inspector-details" open>
      <summary>Imagem ou vídeo</summary>
      <div className="df4y-builder-details-content">
        <Field label="Tipo">
          <select
            value={value.kind ?? 'image'}
            onChange={(event) =>
              onChange({...value, kind: event.currentTarget.value as BuilderMedia['kind']})
            }
          >
            <option value="image">Imagem</option>
            <option value="video">Vídeo carregado</option>
            <option value="youtube">YouTube</option>
          </select>
        </Field>
        {value.kind === 'youtube' ? (
          <Field label="Link do YouTube">
            <input
              type="url"
              value={value.youtubeUrl ?? ''}
              onChange={(event) => onChange({...value, youtubeUrl: event.currentTarget.value})}
            />
          </Field>
        ) : (
          <div className={`df4y-builder-upload${asset ? ' has-asset' : ''}`}>
            <ImageIcon />
            <span>
              {asset
                ? 'Ficheiro ligado'
                : value.kind === 'video'
                  ? 'Carregar vídeo'
                  : 'Carregar imagem'}
            </span>
            <input
              type="file"
              accept={value.kind === 'video' ? 'video/*' : 'image/*'}
              aria-label={value.kind === 'video' ? 'Carregar vídeo' : 'Carregar imagem'}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                if (file) onUpload(file, value.kind === 'video' ? 'video' : 'image')
              }}
            />
            <small>
              {uploadState || (asset ? 'Clique para substituir.' : 'PNG, JPG, WebP, MP4 ou WebM.')}
            </small>
          </div>
        )}
        <Field label="Descrição acessível">
          <textarea
            rows={3}
            value={value.alt?.pt ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                alt: localizedValue(value.alt, event.currentTarget.value, 'localizedString'),
              })
            }
          />
        </Field>
        <div className="df4y-builder-field-grid">
          <Field label="Enquadramento">
            <select
              value={value.fit ?? 'cover'}
              onChange={(event) =>
                onChange({...value, fit: event.currentTarget.value as BuilderMedia['fit']})
              }
            >
              <option value="cover">Preencher sem esticar</option>
              <option value="contain">Mostrar tudo</option>
            </select>
          </Field>
          <Field label="Foco">
            <select
              value={value.position ?? 'center'}
              onChange={(event) =>
                onChange({
                  ...value,
                  position: event.currentTarget.value as BuilderMedia['position'],
                })
              }
            >
              <option value="center">Centro</option>
              <option value="top">Topo</option>
              <option value="bottom">Base</option>
              <option value="left">Esquerda</option>
              <option value="right">Direita</option>
            </select>
          </Field>
        </div>
        {value.kind !== 'image' ? (
          <>
            <Toggle
              label="Reprodução automática"
              checked={value.autoplay === true}
              onChange={(autoplay) =>
                onChange({...value, autoplay, muted: autoplay ? true : value.muted})
              }
            />
            <Toggle
              label="Sem som"
              checked={value.muted !== false}
              onChange={(muted) => onChange({...value, muted})}
            />
            <Toggle
              label="Repetir"
              checked={value.loop === true}
              onChange={(loop) => onChange({...value, loop})}
            />
            <Toggle
              label="Mostrar controlos"
              checked={value.controls !== false}
              onChange={(controls) => onChange({...value, controls})}
            />
          </>
        ) : null}
      </div>
    </details>
  )
}

function RepeaterInspector({
  section,
  onUpdate,
}: {
  section: BuilderSection
  onUpdate: (section: BuilderSection) => void
}) {
  if (section._type === 'builderStatsSection') {
    const stats = (section.items ?? []) as BuilderStat[]
    return (
      <details className="df4y-builder-inspector-details">
        <summary>
          Números <b>{stats.length}</b>
        </summary>
        <div className="df4y-builder-details-content">
          {stats.map((stat, index) => (
            <div className="df4y-builder-repeater" key={stat._key}>
              <div className="df4y-builder-repeater-heading">
                <strong>Número {index + 1}</strong>
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({...section, items: stats.filter((item) => item._key !== stat._key)})
                  }
                >
                  <TrashIcon />
                </button>
              </div>
              <Field label="Valor">
                <input
                  value={stat.value?.pt ?? ''}
                  onChange={(event) =>
                    onUpdate({
                      ...section,
                      items: stats.map((item) =>
                        item._key === stat._key
                          ? {
                              ...item,
                              value: localizedValue(
                                item.value,
                                event.currentTarget.value,
                                'localizedString',
                              ),
                            }
                          : item,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="Explicação">
                <input
                  value={stat.label?.pt ?? ''}
                  onChange={(event) =>
                    onUpdate({
                      ...section,
                      items: stats.map((item) =>
                        item._key === stat._key
                          ? {
                              ...item,
                              label: localizedValue(
                                item.label,
                                event.currentTarget.value,
                                'localizedString',
                              ),
                            }
                          : item,
                      ),
                    })
                  }
                />
              </Field>
            </div>
          ))}
          <button
            className="df4y-builder-secondary-button"
            type="button"
            onClick={() =>
              onUpdate({
                ...section,
                items: [
                  ...stats,
                  {
                    _type: 'builderStat',
                    _key: createBuilderKey(),
                    value: localizedValue(undefined, '0', 'localizedString'),
                    label: localizedValue(undefined, 'Novo indicador', 'localizedString'),
                  },
                ],
              })
            }
          >
            <AddIcon /> Adicionar número
          </button>
        </div>
      </details>
    )
  }

  if (section._type === 'builderCardsSection') {
    const cards = (section.items ?? []) as BuilderCard[]
    return (
      <details className="df4y-builder-inspector-details">
        <summary>
          Cartões <b>{cards.length}</b>
        </summary>
        <div className="df4y-builder-details-content">
          {cards.map((card, index) => (
            <div className="df4y-builder-repeater" key={card._key}>
              <div className="df4y-builder-repeater-heading">
                <strong>Cartão {index + 1}</strong>
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({...section, items: cards.filter((item) => item._key !== card._key)})
                  }
                >
                  <TrashIcon />
                </button>
              </div>
              <Field label="Título">
                <input
                  value={card.title?.pt ?? ''}
                  onChange={(event) =>
                    onUpdate({
                      ...section,
                      items: cards.map((item) =>
                        item._key === card._key
                          ? {
                              ...item,
                              title: localizedValue(
                                item.title,
                                event.currentTarget.value,
                                'localizedString',
                              ),
                            }
                          : item,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="Texto">
                <textarea
                  rows={3}
                  value={card.body?.pt ?? ''}
                  onChange={(event) =>
                    onUpdate({
                      ...section,
                      items: cards.map((item) =>
                        item._key === card._key
                          ? {
                              ...item,
                              body: localizedValue(
                                item.body,
                                event.currentTarget.value,
                                'localizedText',
                              ),
                            }
                          : item,
                      ),
                    })
                  }
                />
              </Field>
            </div>
          ))}
          <button
            className="df4y-builder-secondary-button"
            type="button"
            onClick={() =>
              onUpdate({
                ...section,
                items: [
                  ...cards,
                  {
                    _type: 'builderCard',
                    _key: createBuilderKey(),
                    title: localizedValue(undefined, 'Novo cartão', 'localizedString'),
                    body: localizedValue(undefined, '', 'localizedText'),
                  },
                ],
              })
            }
          >
            <AddIcon /> Adicionar cartão
          </button>
        </div>
      </details>
    )
  }

  return null
}

function LayoutInspector({
  section,
  onUpdate,
}: {
  section: BuilderSection
  onUpdate: (section: BuilderSection) => void
}) {
  const layout = section.layout ?? {_type: 'builderLayout'}
  const spacing = layout.spacing ?? {_type: 'builderSpacing'}
  return (
    <div className="df4y-builder-inspector-group">
      <h3>Composição</h3>
      <Field label="Largura">
        <select
          value={layout.width ?? 'wide'}
          onChange={(event) =>
            onUpdate({
              ...section,
              layout: {
                ...layout,
                width: event.currentTarget.value as NonNullable<typeof layout.width>,
              },
            })
          }
        >
          <option value="narrow">Leitura</option>
          <option value="content">Conteúdo</option>
          <option value="wide">Larga</option>
          <option value="full">Ecrã completo</option>
        </select>
      </Field>
      <div className="df4y-builder-field-grid">
        <Field label="Colunas">
          <input
            type="number"
            min="1"
            max="4"
            value={layout.columns ?? 1}
            onChange={(event) =>
              onUpdate({...section, layout: {...layout, columns: numberValue(event, 1)}})
            }
          />
        </Field>
        <Field label="Colunas mobile">
          <input
            type="number"
            min="1"
            max="2"
            value={layout.mobileColumns ?? 1}
            onChange={(event) =>
              onUpdate({...section, layout: {...layout, mobileColumns: numberValue(event, 1)}})
            }
          />
        </Field>
      </div>
      <Field label="Fundo">
        <select
          value={layout.surface ?? 'fog'}
          onChange={(event) =>
            onUpdate({
              ...section,
              layout: {
                ...layout,
                surface: event.currentTarget.value as NonNullable<typeof layout.surface>,
              },
            })
          }
        >
          <option value="white">Branco</option>
          <option value="fog">Névoa</option>
          <option value="mint">Verde claro</option>
          <option value="deep">Verde profundo</option>
          <option value="blue">Azul mineral</option>
          <option value="transparent">Transparente</option>
        </select>
      </Field>
      <Field label="Espaço entre elementos">
        <input
          type="range"
          min="0"
          max="96"
          step="4"
          value={layout.gap ?? 24}
          onChange={(event) =>
            onUpdate({...section, layout: {...layout, gap: numberValue(event, 24)}})
          }
        />
        <output>{layout.gap ?? 24}px</output>
      </Field>
      <div className="df4y-builder-field-grid is-three">
        {(['top', 'bottom', 'sides'] as const).map((side) => (
          <Field
            key={side}
            label={side === 'top' ? 'Acima' : side === 'bottom' ? 'Abaixo' : 'Laterais'}
          >
            <input
              type="number"
              min="0"
              max="240"
              value={spacing[side] ?? (side === 'sides' ? 24 : 64)}
              onChange={(event) =>
                onUpdate({
                  ...section,
                  layout: {
                    ...layout,
                    spacing: {...spacing, [side]: numberValue(event, side === 'sides' ? 24 : 64)},
                  },
                })
              }
            />
          </Field>
        ))}
      </div>
      <Toggle
        label="Inverter ordem no telemóvel"
        checked={layout.reverseOnMobile === true}
        onChange={(reverseOnMobile) => onUpdate({...section, layout: {...layout, reverseOnMobile}})}
      />
      <TypographyInspector
        label="Título"
        value={section.titleStyle}
        onChange={(titleStyle) => onUpdate({...section, titleStyle})}
      />
      <TypographyInspector
        label="Texto"
        value={section.bodyStyle}
        onChange={(bodyStyle) => onUpdate({...section, bodyStyle})}
      />
    </div>
  )
}

function SectionInspector({
  section,
  issues,
  uploadState,
  onUpdate,
  onUploadSectionMedia,
  onUploadGalleryMedia,
}: {
  section: BuilderSection
  issues: BuilderValidationIssue[]
  uploadState?: string
  onUpdate: (section: BuilderSection) => void
  onUploadSectionMedia: (file: File, kind: 'image' | 'video') => void
  onUploadGalleryMedia: (files: FileList) => void
}) {
  const [tab, setTab] = useState<'content' | 'design'>('content')
  const canHaveMedia = ['builderHeroSection', 'builderMediaSection', 'builderCtaSection'].includes(
    section._type,
  )
  const canHaveActions = [
    'builderHeroSection',
    'builderRichTextSection',
    'builderMediaSection',
    'builderCollectionSection',
    'builderCtaSection',
  ].includes(section._type)

  return (
    <>
      <div className="df4y-builder-inspector-title">
        <span className="df4y-builder-overline">Secção</span>
        <h2>{section.internalLabel || 'Secção sem nome'}</h2>
        <div className="df4y-builder-inspector-tabs">
          <button
            className={tab === 'content' ? 'is-active' : ''}
            type="button"
            onClick={() => setTab('content')}
          >
            Conteúdo
          </button>
          <button
            className={tab === 'design' ? 'is-active' : ''}
            type="button"
            onClick={() => setTab('design')}
          >
            Design
          </button>
        </div>
      </div>

      {tab === 'content' ? (
        <>
          <div className="df4y-builder-inspector-group">
            <h3>Texto</h3>
            <Field label="Nome no editor" help="Não aparece no site.">
              <input
                value={section.internalLabel ?? ''}
                onChange={(event) =>
                  onUpdate({...section, internalLabel: event.currentTarget.value})
                }
              />
            </Field>
            <Field label="Âncora" help="Opcional. Exemplo: impacto">
              <input
                value={section.anchor ?? ''}
                onChange={(event) =>
                  onUpdate({
                    ...section,
                    anchor: event.currentTarget.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                  })
                }
              />
            </Field>
            {'eyebrow' in section ? (
              <Field label="Etiqueta">
                <input
                  value={textValue(section.eyebrow)}
                  onChange={(event) =>
                    onUpdate({
                      ...section,
                      eyebrow: localizedValue(
                        section.eyebrow,
                        event.currentTarget.value,
                        'localizedString',
                      ),
                    })
                  }
                />
              </Field>
            ) : null}
            {'title' in section ? (
              <Field label="Título">
                <textarea
                  rows={3}
                  value={textValue(section.title)}
                  onChange={(event) =>
                    onUpdate({
                      ...section,
                      title: localizedValue(
                        section.title,
                        event.currentTarget.value,
                        'localizedString',
                      ),
                    })
                  }
                />
              </Field>
            ) : null}
            {'body' in section && !Array.isArray(section.body) ? (
              <Field label="Texto">
                <textarea
                  rows={6}
                  value={textValue(section.body)}
                  onChange={(event) =>
                    onUpdate({
                      ...section,
                      body: localizedValue(
                        section.body,
                        event.currentTarget.value,
                        'localizedText',
                      ),
                    })
                  }
                />
              </Field>
            ) : null}
            {Array.isArray(section.body) ? (
              <p className="df4y-builder-note">
                O editor de artigo estruturado será aberto diretamente no canvas numa próxima fase.
                O conteúdo existente permanece seguro.
              </p>
            ) : null}
            <Toggle
              label="Mostrar no site"
              checked={section.enabled !== false}
              onChange={(enabled) => onUpdate({...section, enabled})}
            />
          </div>

          {section._type === 'builderCollectionSection' ? (
            <div className="df4y-builder-inspector-group">
              <h3>Lista automática</h3>
              <Field label="Conteúdo">
                <select
                  value={section.source ?? 'productCategory'}
                  onChange={(event) =>
                    onUpdate({
                      ...section,
                      source: event.currentTarget.value as NonNullable<typeof section.source>,
                    })
                  }
                >
                  <option value="productCategory">Soluções</option>
                  <option value="storeProduct">Produtos da loja</option>
                  <option value="caseStudy">Casos de estudo</option>
                  <option value="blogPost">Artigos do blog</option>
                </select>
              </Field>
              <Field label="Quantidade">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={section.limit ?? 6}
                  onChange={(event) => onUpdate({...section, limit: numberValue(event, 6)})}
                />
              </Field>
              <Toggle
                label="Mostrar pesquisa"
                checked={section.showSearch === true}
                onChange={(showSearch) => onUpdate({...section, showSearch})}
              />
              <Toggle
                label="Mostrar paginação"
                checked={section.showPagination === true}
                onChange={(showPagination) => onUpdate({...section, showPagination})}
              />
            </div>
          ) : null}
          {section._type === 'builderContactSection' ? (
            <div className="df4y-builder-inspector-group">
              <h3>Formulário</h3>
              <Field label="Tipo">
                <select
                  value={section.formKind ?? 'contact'}
                  onChange={(event) =>
                    onUpdate({
                      ...section,
                      formKind: event.currentTarget.value as NonNullable<typeof section.formKind>,
                    })
                  }
                >
                  <option value="contact">Contacto geral</option>
                  <option value="quote">Pedido de orçamento</option>
                  <option value="catalogue">Pedido de catálogo</option>
                </select>
              </Field>
              <Toggle
                label="Mostrar contactos"
                checked={section.showContactDetails !== false}
                onChange={(showContactDetails) => onUpdate({...section, showContactDetails})}
              />
            </div>
          ) : null}
          <RepeaterInspector section={section} onUpdate={onUpdate} />
          {canHaveActions ? (
            <ActionsInspector
              actions={section.actions ?? []}
              onChange={(actions) => onUpdate({...section, actions})}
            />
          ) : null}
          {canHaveMedia ? (
            <MediaInspector
              media={section.media}
              uploadState={uploadState}
              onChange={(media) => onUpdate({...section, media})}
              onUpload={onUploadSectionMedia}
            />
          ) : null}
          {section._type === 'builderGallerySection' ? (
            <details className="df4y-builder-inspector-details" open>
              <summary>
                Galeria <b>{section.items?.length ?? 0}</b>
              </summary>
              <div className="df4y-builder-details-content">
                <div className="df4y-builder-upload">
                  <UploadIcon />
                  <span>Adicionar imagens ou vídeos</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(event) => {
                      if (event.currentTarget.files?.length)
                        onUploadGalleryMedia(event.currentTarget.files)
                    }}
                  />
                  <small>{uploadState || 'Pode escolher vários ficheiros.'}</small>
                </div>
                {(section.items as BuilderMedia[] | undefined)?.map((item, index) => (
                  <div className="df4y-builder-gallery-file" key={item._key}>
                    <span>
                      {item.kind === 'video' ? 'Vídeo' : 'Imagem'} {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate({
                          ...section,
                          items: section.items?.filter((candidate) => candidate !== item),
                        })
                      }
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
          <IssueList issues={issues.filter((issue) => issue.sectionKey === section._key)} />
        </>
      ) : (
        <LayoutInspector section={section} onUpdate={onUpdate} />
      )}
    </>
  )
}

function SiteInspector({
  settings,
  issues,
  onUpdate,
}: {
  settings: BuilderSiteSettings
  issues: BuilderValidationIssue[]
  onUpdate: (settings: BuilderSiteSettings) => void
}) {
  const theme = settings.theme ?? {}
  const labels = useMemo(
    () =>
      [
        ['accountLabel', 'Conta'],
        ['cartLabel', 'Carrinho'],
        ['contactLabel', 'Contacto'],
      ] as const,
    [],
  )
  const colors = [
    ['textColor', 'Texto principal'],
    ['mutedColor', 'Texto secundário'],
    ['deepColor', 'Verde profundo'],
    ['greenColor', 'Verde de ação'],
    ['blueColor', 'Azul mineral'],
    ['yellowColor', 'Amarelo'],
    ['fogColor', 'Fundo névoa'],
    ['mintColor', 'Fundo verde claro'],
  ] as const
  return (
    <>
      <div className="df4y-builder-inspector-title">
        <span className="df4y-builder-overline">Todo o site</span>
        <h2>Tema e navegação</h2>
        <p>Altere regras globais sem editar cada página.</p>
      </div>
      <div className="df4y-builder-inspector-group">
        <h3>Textos do cabeçalho</h3>
        {labels.map(([key, label]) => (
          <Field key={key} label={label}>
            <input
              value={settings[key]?.pt ?? ''}
              onChange={(event) =>
                onUpdate({
                  ...settings,
                  [key]: localizedValue(
                    settings[key],
                    event.currentTarget.value,
                    'localizedString',
                  ),
                })
              }
            />
          </Field>
        ))}
      </div>
      <div className="df4y-builder-inspector-group">
        <h3>Tipografia global</h3>
        <Field label="Fonte dos títulos">
          <select
            value={theme.headingFont ?? 'space-grotesk'}
            onChange={(event) =>
              onUpdate({...settings, theme: {...theme, headingFont: event.currentTarget.value}})
            }
          >
            <option value="space-grotesk">Space Grotesk</option>
            <option value="inter">Inter</option>
            <option value="arial">Arial</option>
            <option value="georgia">Georgia</option>
            <option value="times-new-roman">Times New Roman</option>
          </select>
        </Field>
        <Field label="Fonte do texto">
          <select
            value={theme.bodyFont ?? 'space-grotesk'}
            onChange={(event) =>
              onUpdate({...settings, theme: {...theme, bodyFont: event.currentTarget.value}})
            }
          >
            <option value="space-grotesk">Space Grotesk</option>
            <option value="inter">Inter</option>
            <option value="arial">Arial</option>
            <option value="georgia">Georgia</option>
            <option value="times-new-roman">Times New Roman</option>
          </select>
        </Field>
      </div>
      <div className="df4y-builder-inspector-group">
        <h3>Cores</h3>
        <div className="df4y-builder-color-grid">
          {colors.map(([key, label]) => (
            <Field key={key} label={label}>
              <div className="df4y-builder-color-input">
                <input
                  type="color"
                  value={theme[key] ?? '#000000'}
                  onChange={(event) =>
                    onUpdate({...settings, theme: {...theme, [key]: event.currentTarget.value}})
                  }
                />
                <input
                  value={theme[key] ?? ''}
                  onChange={(event) =>
                    onUpdate({...settings, theme: {...theme, [key]: event.currentTarget.value}})
                  }
                />
              </div>
            </Field>
          ))}
        </div>
      </div>
      <div className="df4y-builder-inspector-group">
        <h3>Movimento</h3>
        <Field label="Intensidade">
          <select
            value={theme.motion ?? 'balanced'}
            onChange={(event) =>
              onUpdate({
                ...settings,
                theme: {
                  ...theme,
                  motion: event.currentTarget.value as NonNullable<typeof theme.motion>,
                },
              })
            }
          >
            <option value="reduced">Reduzido</option>
            <option value="balanced">Equilibrado</option>
            <option value="expressive">Expressivo</option>
          </select>
        </Field>
        <p className="df4y-builder-note">
          A preferência “reduzir movimento” do visitante terá sempre prioridade.
        </p>
      </div>
      <div className="df4y-builder-rollout-note">
        <strong>Site público protegido</strong>
        <p>
          O renderer atual continua ativo. A mudança para o construtor só será desbloqueada depois
          da migração e validação de todas as páginas.
        </p>
      </div>
      <IssueList issues={issues} />
    </>
  )
}

export function BuilderInspector(props: BuilderInspectorProps) {
  return (
    <aside className="df4y-builder-inspector" aria-label="Propriedades">
      {props.scope === 'site' && props.settings ? (
        <SiteInspector
          settings={props.settings}
          issues={props.issues}
          onUpdate={props.onUpdateSettings}
        />
      ) : props.scope === 'section' && props.section ? (
        <SectionInspector
          section={props.section}
          issues={props.issues}
          uploadState={props.uploadState}
          onUpdate={props.onUpdateSection}
          onUploadSectionMedia={props.onUploadSectionMedia}
          onUploadGalleryMedia={props.onUploadGalleryMedia}
        />
      ) : (
        <PageInspector page={props.page} issues={props.issues} onUpdate={props.onUpdatePage} />
      )}
    </aside>
  )
}

export function BuilderSectionInspector({
  section,
  issues,
  uploadState,
  onUpdateSection,
  onUploadSectionMedia,
  onUploadGalleryMedia,
}: BuilderSectionInspectorProps) {
  if (!section) return null
  return (
    <div className="df4y-builder-section-inspector">
      <SectionInspector
        section={section}
        issues={issues}
        uploadState={uploadState}
        onUpdate={onUpdateSection}
        onUploadSectionMedia={onUploadSectionMedia}
        onUploadGalleryMedia={onUploadGalleryMedia}
      />
    </div>
  )
}
