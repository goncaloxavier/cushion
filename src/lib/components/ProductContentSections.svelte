<script lang="ts">
  import {youtubeEmbedUrl} from '$lib/media'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import type {ProductContentSection} from '$lib/site-content'

  let {
    sections,
    dataAttribute,
  }: {
    sections: ProductContentSection[]
    dataAttribute?: (path: string) => string
  } = $props()

  const sectionFieldPath = (section: ProductContentSection, field: string) =>
    section.editPath === 'contentSections' ? section.editPath : `${section.editPath}.${field}`

  const isExternalUrl = (url: string) => /^https?:\/\//i.test(url)
</script>

<div class="product-content-sections">
  {#each sections as section, index (section.key)}
    {@const embedUrl = section.video ? youtubeEmbedUrl(section.video.url, {quality: 'highres'}) : undefined}
    {@const hasCopy = Boolean(
      section.title ||
        section.text ||
        (section.buttonLabel && section.buttonUrl) ||
        (section.label && section.labelStyle === 'eyebrow'),
    )}
    {@const externalButton = isExternalUrl(section.buttonUrl)}
    <section
      class={`product-content-section is-${section.mediaSide} is-${section.surface}`}
      class:has-copy={hasCopy}
      data-df4y-editor-field="true"
      data-df4y-editor-label={`Conteúdo adicional ${index + 1}`}
      data-sanity={dataAttribute?.(section.editPath)}
      aria-label={section.title || section.video?.title || undefined}
    >
      <div class="product-content-inner">
        <div class="product-content-media-group" class:is-image={section.mediaKind === 'image'}>
          <div
            class="product-content-media"
            class:is-portrait={(section.image?.aspectRatio ?? 16 / 9) < 1}
            class:is-image={section.mediaKind === 'image'}
            style={`--product-content-ratio: ${section.image?.aspectRatio ?? 16 / 9}`}
            data-df4y-editor-field="true"
            data-df4y-editor-label={section.mediaKind === 'image' ? 'Imagem da secção' : 'Vídeo da secção'}
            data-sanity={dataAttribute?.(
              sectionFieldPath(section, section.mediaKind === 'image' ? 'image' : 'video'),
            )}
          >
            {#if section.mediaKind === 'image' && section.image}
              <img
                src={section.image.url}
                alt={section.image.alt}
                loading="lazy"
                decoding="async"
              />
            {:else if section.mediaKind === 'video' && section.video}
              {#if embedUrl}
                <iframe
                  src={embedUrl}
                  title={section.video.title}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                ></iframe>
              {:else}
                <!-- svelte-ignore a11y_media_has_caption: uploaded product videos do not yet collect caption tracks in the CMS. -->
                <video
                  src={section.video.url}
                  poster={section.video.poster?.url}
                  aria-label={section.video.title}
                  controls
                  playsinline
                  preload="metadata"
                ></video>
              {/if}
            {/if}
            {#if section.label && section.labelStyle === 'pill'}
              <span
                class="product-content-label is-pill"
                data-df4y-editor-field="true"
                data-df4y-editor-label="Rótulo da secção"
                data-sanity={dataAttribute?.(sectionFieldPath(section, 'label.pt'))}
              >{section.label}</span>
            {/if}
          </div>
          {#if section.label && section.labelStyle === 'caption'}
            <p
              class="product-content-label is-caption"
              data-df4y-editor-field="true"
              data-df4y-editor-label="Rótulo da secção"
              data-sanity={dataAttribute?.(sectionFieldPath(section, 'label.pt'))}
            >{section.label}</p>
          {/if}
        </div>

        {#if hasCopy}
          <div class="product-content-copy">
            <div class="product-content-copy-body">
              {#if section.label && section.labelStyle === 'eyebrow'}
                <p
                  class="product-content-label is-eyebrow"
                  data-df4y-editor-field="true"
                  data-df4y-editor-label="Rótulo da secção"
                  data-sanity={dataAttribute?.(sectionFieldPath(section, 'label.pt'))}
                >{section.label}</p>
              {/if}
              {#if section.title}
                <h2
                  class="cms-styled-text"
                  style={textAppearanceStyle(section.textAppearance?.title)}
                  data-df4y-editor-field="true"
                  data-df4y-editor-label="Título da secção"
                  data-sanity={dataAttribute?.(sectionFieldPath(section, 'title.pt'))}
                >{section.title}</h2>
              {/if}
              {#if section.text}
                <p
                  class="cms-styled-text"
                  style={textAppearanceStyle(section.textAppearance?.text)}
                  data-df4y-editor-field="true"
                  data-df4y-editor-label="Texto da secção"
                  data-sanity={dataAttribute?.(sectionFieldPath(section, 'text.pt'))}
                >{section.text}</p>
              {/if}
            </div>

            {#if section.buttonLabel && section.buttonUrl}
              <a
                class="product-content-link cms-styled-text"
                style={textAppearanceStyle(section.textAppearance?.buttonLabel)}
                href={section.buttonUrl}
                target={externalButton ? '_blank' : undefined}
                rel={externalButton ? 'noreferrer' : undefined}
                data-df4y-editor-field="true"
                data-df4y-editor-label="Botão da secção"
                data-sanity={dataAttribute?.(sectionFieldPath(section, 'buttonLabel.pt'))}
              >
                <span>{section.buttonLabel}</span>
                <span class="product-content-link-arrow" aria-hidden="true">→</span>
              </a>
            {/if}
          </div>
        {/if}
      </div>
    </section>
  {/each}
</div>
