<script lang="ts">
  import DownloadList from '$lib/components/DownloadList.svelte'
  import {page} from '$app/state'
  import {loadSanityDataAttributeFactory, type SanityDataAttributeFactory} from '$lib/sanity-edit-attributes'
  import ManagedPageComposition from '$lib/components/builder/ManagedPageComposition.svelte'
  import StoreMediaGallery from '$lib/components/StoreMediaGallery.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {collectionListHref} from '$lib/collection-page'
  import {absoluteUrl, breadcrumbListSchema, productSchema} from '$lib/seo'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import {
    cleanProductMaterialCopy,
    productImageFallback,
    productImagesFor,
    productMediaFor,
    withLanguage,
    type LanguageCode,
  } from '$lib/site-content'
  import {managedCoreSectionForDocumentType} from '$lib/builder/managed-page-sections'

  const specsLabels: Record<
    LanguageCode,
    {
      heading: string
      dimensions: string
      materials: string
      specifications: string
      advantages: string
    }
  > = {
    pt: {
      heading: 'Informação técnica',
      dimensions: 'Dimensões',
      materials: 'Materiais',
      specifications: 'Especificações',
      advantages: 'Vantagens',
    },
    en: {
      heading: 'Technical information',
      dimensions: 'Dimensions',
      materials: 'Materials',
      specifications: 'Specifications',
      advantages: 'Advantages',
    },
    es: {
      heading: 'Información técnica',
      dimensions: 'Dimensiones',
      materials: 'Materiales',
      specifications: 'Especificaciones',
      advantages: 'Ventajas',
    },
  }

  let {data} = $props()
  let dataAttributeFactory = $state<SanityDataAttributeFactory | null>(null)
  $effect(() => {
    if ((data.preview || data.builderPreview) && !dataAttributeFactory) {
      void loadSanityDataAttributeFactory().then((factory) => (dataAttributeFactory = factory))
    }
  })
  const content = $derived(data.site)
  const langQuery = $derived(`?lang=${data.language}`)
  const backHref = $derived(collectionListHref('/produtos', data.language, data.returnPage))
  const images = $derived(productImagesFor(data.product, productImageFallback))
  const media = $derived(productMediaFor(data.product, productImageFallback))
  const productDataAttribute = $derived(
    (data.preview || data.builderPreview) && data.studioUrl && data.product.studioDocumentId
      ? dataAttributeFactory?.({
          baseUrl: data.studioUrl,
          id: data.product.studioDocumentId,
          type: 'productCategory',
        })
      : null,
  )
  const imageDataAttribute = $derived(
    productDataAttribute ? (path: string) => productDataAttribute(path) : undefined,
  )
  const leadCopy = $derived(cleanProductMaterialCopy(data.product.description))
  const specsCopy = $derived(specsLabels[data.language] ?? specsLabels.pt)
  const specs = $derived(
    data.product.specs ?? {dimensions: [], materials: [], specifications: [], advantages: []},
  )
  const specGroups = $derived(
    [
      {key: 'dimensions', label: specsCopy.dimensions, items: specs.dimensions},
      {key: 'materials', label: specsCopy.materials, items: specs.materials},
      {key: 'specifications', label: specsCopy.specifications, items: specs.specifications},
      {key: 'advantages', label: specsCopy.advantages, items: specs.advantages},
    ].filter((group) => group.items.length > 0),
  )
  const hasSpecs = $derived(specGroups.length > 0)
  const builderSections = $derived(data.product.sections ?? [])
  const freeBuilderSections = $derived(
    builderSections.filter((section) => section._type !== 'builderManagedSection'),
  )
  const pageCore = managedCoreSectionForDocumentType('productCategory')!
  const hasFollowingContent = $derived(
    freeBuilderSections.some((section) => section.enabled !== false),
  )
  const productJsonLd = $derived([
    productSchema({
      name: data.product.title,
      description: leadCopy,
      imageUrl: absoluteUrl(page.url.origin, images[0]?.url),
    }),
    breadcrumbListSchema([
      {name: content.nav.home, url: absoluteUrl(page.url.origin, withLanguage('/', data.language))!},
      {name: content.nav.products, url: absoluteUrl(page.url.origin, withLanguage('/produtos', data.language))!},
      {name: data.product.title, url: absoluteUrl(page.url.origin, withLanguage(page.url.pathname, data.language))!},
    ]),
  ])
</script>

<SeoHead
  title={data.product.title}
  description={leadCopy}
  image={images[0]}
  jsonLd={productJsonLd}
/>

<main class="product-detail-page">
  <article class="detail-page product-detail product-editorial">
    <ManagedPageComposition
      sections={builderSections}
      core={pageCore}
      settings={data.settings}
      {content}
      language={data.language}
      dataset={data.sanityDataset}
      preview={data.preview || data.builderPreview}
    >
      <div class="product-editorial-head">
      <a class="detail-back-link" href={backHref}>
        <span aria-hidden="true">←</span>
        {content.common.backToProducts}
      </a>
      <p class="kicker">{content.nav.products}</p>
      </div>

      <section class="product-editorial-intro">
      <div class="product-editorial-title">
        <h1
          class="cms-styled-text"
          style={textAppearanceStyle(data.product.textAppearance?.title)}
          data-sanity={productDataAttribute?.('title.pt')}
        >{data.product.title}</h1>
      </div>
      <div class="product-editorial-copy">
        {#if leadCopy}
          <p
            class="article-lead cms-styled-text"
            style={textAppearanceStyle(data.product.textAppearance?.description)}
            data-df4y-editor-field="true"
            data-df4y-editor-label="Descrição do produto"
            data-sanity={productDataAttribute?.('description.pt')}
          >{leadCopy}</p>
        {/if}
      </div>
      </section>

    {#snippet quoteButton()}
      <a class="button primary" href={`/contacto${langQuery}`}>{content.common.requestQuote}</a>
    {/snippet}

      <section class="product-editorial-stage">
      <StoreMediaGallery
        {media}
        label={content.common.zoomImage}
        closeLabel={content.common.close}
        className="product-stage-gallery"
        transitionName={`vt-${data.product.slug}`}
        dataAttribute={imageDataAttribute}
        fallbackEditPath="image"
      />
      {#if !hasFollowingContent}
        <div class="product-stage-cta">
          {@render quoteButton()}
        </div>
      {/if}
      </section>

      {#if hasSpecs}
        <section
          class="product-editorial-specs"
          class:has-following-support={hasFollowingContent}
          aria-labelledby="product-specs-heading"
        >
        <header class="product-specs-header">
          <h2 id="product-specs-heading">{specsCopy.heading}</h2>
        </header>

        <div class="product-specs-grid">
          {#each specGroups as group (group.key)}
            <section
              class="product-spec-block"
              data-df4y-editor-field="true"
              data-df4y-editor-label={group.label}
              data-sanity={productDataAttribute?.(group.key)}
            >
              <h3>{group.label}</h3>
              <ul class="product-spec-list">
                {#each group.items as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </section>
          {/each}
        </div>
        </section>
      {/if}
    </ManagedPageComposition>

    <DownloadList
      documents={data.product.documents}
      title={data.product.documentsTitle}
      fallbackTitle={content.common.downloadsTitle}
    />

    {#if hasFollowingContent}
      <section class="product-editorial-cta">
        {@render quoteButton()}
      </section>
    {/if}
  </article>
</main>
