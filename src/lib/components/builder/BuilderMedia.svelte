<script lang="ts">
  import {builderLocalized} from '$lib/builder/content'
  import {builderAssetUrl, builderYoutubeEmbedUrl} from '$lib/builder/media'
  import type {BuilderMedia} from '$lib/builder/types'
  import type {LanguageCode} from '$lib/site-content'

  let {
    media,
    dataset,
    language,
    className = '',
  } = $props<{
    media?: BuilderMedia
    dataset: string
    language: LanguageCode
    className?: string
  }>()

  const alt = $derived(builderLocalized(media?.alt, language))
  const caption = $derived(builderLocalized(media?.caption, language))
  const fit = $derived(media?.fit === 'contain' ? 'contain' : 'cover')
  const position = $derived(
    ['center', 'top', 'bottom', 'left', 'right'].includes(media?.position || '')
      ? media?.position
      : 'center',
  )
  const imageUrl = $derived(builderAssetUrl(media?.image?.asset?._ref, dataset))
  const videoUrl = $derived(builderAssetUrl(media?.videoFile?.asset?._ref, dataset))
  const posterUrl = $derived(builderAssetUrl(media?.poster?.asset?._ref, dataset))
  const youtubeUrl = $derived(builderYoutubeEmbedUrl(media?.youtubeUrl))
</script>

<figure class={`builder-media ${className}`}>
  {#if media?.kind === 'video' && videoUrl}
    <video
      src={videoUrl}
      poster={posterUrl || undefined}
      aria-label={alt || undefined}
      autoplay={media.autoplay ?? false}
      muted={media.muted ?? true}
      loop={media.loop ?? false}
      controls={media.controls ?? true}
      playsinline
      style:object-fit={fit}
      style:object-position={position}
    ></video>
  {:else if media?.kind === 'youtube' && youtubeUrl}
    <iframe
      src={youtubeUrl}
      title={alt || 'Vídeo'}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  {:else if imageUrl}
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      decoding="async"
      style:object-fit={fit}
      style:object-position={position}
    />
  {:else}
    <div class="builder-media-empty">
      <span aria-hidden="true">+</span>
      <strong>Adicionar imagem ou vídeo</strong>
    </div>
  {/if}
  {#if caption}
    <figcaption>{caption}</figcaption>
  {/if}
</figure>
