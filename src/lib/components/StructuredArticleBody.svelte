<script lang="ts">
  import {
    parsePlainArticleBody,
    type PlainArticleBlock,
    type PortableTextBlock,
    type RichArticleBlock,
  } from '$lib/article-structure'
  import {youtubeEmbedUrl} from '$lib/media'

  type RichListBlock = {
    type: 'richList'
    listItem: 'bullet' | 'number'
    items: PortableTextBlock[]
  }

  type RenderBlock = PlainArticleBlock | RichArticleBlock | RichListBlock

  let {body, article = []} = $props<{body: string; article?: RichArticleBlock[]}>()

  const isRichListBlock = (block: RenderBlock): block is RichListBlock =>
    'type' in block && block.type === 'richList'

  const isPortableBlock = (block: RenderBlock): block is PortableTextBlock =>
    '_type' in block && block._type === 'block'

  const isPlainBlock = (block: RenderBlock): block is PlainArticleBlock =>
    'type' in block && block.type !== 'richList'

  const groupRichBlocks = (blocks: RichArticleBlock[]): RenderBlock[] => {
    const grouped: RenderBlock[] = []

    blocks.forEach((block) => {
      if (block._type === 'block' && block.listItem) {
        const previous = grouped[grouped.length - 1]
        if (isRichListBlock(previous) && previous.listItem === block.listItem) {
          previous.items.push(block)
          return
        }

        grouped.push({type: 'richList', listItem: block.listItem, items: [block]})
        return
      }

      grouped.push(block)
    })

    return grouped
  }

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const safeHref = (value: string | undefined) => {
    if (!value) return ''

    try {
      const url = new URL(value, 'https://www.dafabrica4you.pt')
      if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return value
    } catch {
      return ''
    }

    return ''
  }

  const renderPortableInline = (block: PortableTextBlock) =>
    (block.children ?? [])
      .map((child) => {
        const marks = child.marks ?? []
        const linkMark = (block.markDefs ?? []).find(
          (mark) => marks.includes(mark._key) && mark._type === 'link',
        )
        const href = safeHref(linkMark?.href)
        let html = escapeHtml(child.text ?? '')

        if (marks.includes('strong')) html = `<strong>${html}</strong>`
        if (marks.includes('em')) html = `<em>${html}</em>`
        if (href) {
          html = `<a href="${escapeHtml(href)}" rel="noreferrer noopener" target="_blank">${html}</a>`
        }

        return html
      })
      .join('')

  const imageStyle = (aspectRatio: number | undefined) =>
    aspectRatio && Number.isFinite(aspectRatio) ? `--media-aspect: ${aspectRatio}` : undefined

  const blocks = $derived(article.length ? groupRichBlocks(article) : parsePlainArticleBody(body))
</script>

{#each blocks as block}
  {#if isPlainBlock(block) && block.type === 'heading'}
    <h2>{block.text}</h2>
  {:else if isPlainBlock(block) && block.type === 'subheading'}
    <h3>{block.text}</h3>
  {:else if isPlainBlock(block) && block.type === 'list'}
    <ul>
      {#each block.items as item}
        <li>
          {#if item.label}
            <strong>{item.label}</strong>{item.text ? `: ${item.text}` : ''}
          {:else}
            {item.text}
          {/if}
        </li>
      {/each}
    </ul>
  {:else if isPlainBlock(block) && block.type === 'table'}
    <div class="article-table-wrap">
      <table>
        <thead>
          <tr>
            {#each block.headers as header}
              <th scope="col">{header}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each block.rows as row}
            <tr>
              {#each row as cell}
                <td>{cell}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else if isRichListBlock(block)}
    <svelte:element this={block.listItem === 'number' ? 'ol' : 'ul'}>
      {#each block.items as item}
        <li>{@html renderPortableInline(item)}</li>
      {/each}
    </svelte:element>
  {:else if isPortableBlock(block) && block.style === 'h2'}
    <h2>{@html renderPortableInline(block)}</h2>
  {:else if isPortableBlock(block) && block.style === 'h3'}
    <h3>{@html renderPortableInline(block)}</h3>
  {:else if isPortableBlock(block) && block.style === 'blockquote'}
    <blockquote>{@html renderPortableInline(block)}</blockquote>
  {:else if isPortableBlock(block)}
    <p>{@html renderPortableInline(block)}</p>
  {:else if '_type' in block && (block._type === 'image' || block._type === 'articleImage')}
    {#if block.asset?.url}
      <figure
        class="article-embedded-media article-embedded-image"
        style={imageStyle(block.asset.metadata?.dimensions?.aspectRatio)}
      >
        <img src={block.asset.url} alt={block.alt ?? ''} loading="lazy" decoding="async" />
        {#if block.caption}
          <figcaption>{block.caption}</figcaption>
        {/if}
      </figure>
    {/if}
  {:else if '_type' in block && block._type === 'youtubeEmbed'}
    {@const embedUrl = youtubeEmbedUrl(block.url)}
    {#if embedUrl}
      <figure class="article-embedded-media article-embedded-video">
        <iframe
          src={embedUrl}
          title={block.title || 'Vídeo YouTube'}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
        {#if block.caption}
          <figcaption>{block.caption}</figcaption>
        {/if}
      </figure>
    {/if}
  {:else if '_type' in block && block._type === 'articleTable' && block.columns?.length}
    <div class="article-table-wrap">
      <table>
        <thead>
          <tr>
            {#each block.columns as header}
              <th scope="col">{header}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each block.rows ?? [] as row}
            <tr>
              {#each block.columns as _, cellIndex}
                <td>{row.cells?.[cellIndex] ?? ''}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else if isPlainBlock(block)}
    <p>{block.text}</p>
  {/if}
{/each}
