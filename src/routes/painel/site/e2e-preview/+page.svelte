<script lang="ts">
  import {encodeSanityNodeData} from '@sanity/visual-editing-csm'
  import StructuredArticleBody from '$lib/components/StructuredArticleBody.svelte'
  import BuilderPageRenderer from '$lib/components/builder/BuilderPageRenderer.svelte'
  import type {SitePageDocument} from '$lib/site-editor/types'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import {onMount} from 'svelte'

  let {data} = $props()

  const sanity = (id: string, type: string, path: string) =>
    encodeSanityNodeData({
      baseUrl: 'http://localhost:3333',
      dataset: 'site-editor-e2e',
      id,
      path,
      projectId: 'u4uyfix8',
      type,
    })

  onMount(() => {
    document.documentElement.dataset.siteEditorFixtureBoot = crypto.randomUUID()
  })

  const emptySectionPreview = {
    _id: 'site-editor-section-preview',
    _type: 'sitePage',
    _createdAt: '',
    _updatedAt: '',
    _rev: '',
    editorVersion: 1,
    title: 'Conteúdo da página',
    route: '/',
    active: true,
    sections: [],
  } satisfies SitePageDocument
</script>

<svelte:head>
  <title>Pré-visualização do editor</title>
</svelte:head>

{#if data.fixture === 'created' && data.created?.type === 'sitePage' && data.created.page}
  <div data-testid="fixture-created-page">
    <BuilderPageRenderer
      page={data.created.page}
      settings={null}
      content={data.site}
      language={data.language}
      dataset="site-editor-e2e"
      dataAttribute={(path) => sanity(data.created.id, data.created.type, path)}
      preview
    />
  </div>
{:else if data.fixture === 'created' && data.created}
  <main class="fixture-page fixture-created" data-testid="fixture-created-page">
    <section class="fixture-created-copy">
      <small>{data.created.type}</small>
      <h1
        data-testid="fixture-created-title"
        data-sanity={sanity(
          data.created.id,
          data.created.type,
          data.created.type === 'sitePage' ? 'title' : 'title.pt',
        )}
      >{data.created.title}</h1>
      {#if data.created.location}
        <p data-sanity={sanity(data.created.id, data.created.type, 'location')}>
          {data.created.location}
        </p>
      {/if}
      {#if data.created.publishedAt}
        <time
          datetime={data.created.publishedAt}
          data-sanity={sanity(data.created.id, data.created.type, 'publishedAt')}
        >{data.created.publishedAt}</time>
      {/if}
      {#if data.created.summary}
        <p
          data-testid="fixture-created-summary"
          data-sanity={sanity(
            data.created.id,
            data.created.type,
            data.created.type === 'blogPost'
              ? 'excerpt.pt'
              : data.created.type === 'caseStudy' || data.created.type === 'productCategory'
                ? 'description.pt'
                : 'summary.pt',
          )}
        >{data.created.summary}</p>
      {/if}
      {#if data.created.type === 'blogPost' || data.created.article?.length || data.created.content}
        <div
          class="fixture-created-article"
          data-testid="fixture-created-article"
          data-sanity={sanity(data.created.id, data.created.type, 'article.pt')}
        >
          <StructuredArticleBody
            body=""
            article={data.created.article}
            previewDocumentId={data.created.id}
            previewFieldPath="article"
          />
        </div>
      {/if}
      {#if data.created.variantKey}
        <div class="fixture-product-facts">
          <span>Peso</span>
          <strong
            data-sanity={sanity(
              data.created.id,
              data.created.type,
              `variants[_key=="${data.created.variantKey}"].weightKg`,
            )}
          >{data.created.weightKg} kg</strong>
        </div>
        <div class="fixture-product-facts">
          <span>Produto s/ IVA</span>
          <strong
            data-sanity={sanity(
              data.created.id,
              data.created.type,
              `variants[_key=="${data.created.variantKey}"].priceNatural`,
            )}
          >{data.created.priceNatural} €</strong>
        </div>
      {/if}
    </section>
    <section
      class="fixture-created-media"
      data-testid="fixture-created-media"
      data-sanity={sanity(data.created.id, data.created.type, 'image')}
    >
      <span>Imagem principal</span>
      <strong>Adicionar imagem ou vídeo</strong>
    </section>
    <BuilderPageRenderer
      page={emptySectionPreview}
      settings={null}
      content={data.site}
      language={data.language}
      dataset="site-editor-e2e"
      preview
      embedded
    />
  </main>
{:else if data.fixture === 'product'}
  <main class="fixture-page fixture-product" data-testid="fixture-product-page">
    <section class="fixture-product-copy">
      <small>LOJA</small>
      <h1
        class="cms-styled-text"
        style={textAppearanceStyle(data.product?.titleAppearance)}
        data-testid="fixture-product-title"
        data-sanity={sanity('storeProduct.editor-fixture', 'storeProduct', 'title.pt')}
      >{data.product?.title || 'Banco editorial'}</h1>
      <p
        class="cms-styled-text"
        style={textAppearanceStyle(data.product?.summaryAppearance)}
        data-testid="fixture-product-summary"
        data-sanity={sanity('storeProduct.editor-fixture', 'storeProduct', 'summary.pt')}
      >{data.product?.summary || 'Produto de demonstração usado apenas pelos testes do editor.'}</p>
      <div class="fixture-product-facts">
        <span>Peso</span>
        <strong
          data-testid="fixture-product-weight"
          data-df4y-editor-field="true"
          data-df4y-editor-kind="number"
          data-df4y-editor-label="Peso"
          data-sanity={sanity(
            'storeProduct.editor-fixture',
            'storeProduct',
            'variants[_key=="variant-standard"].weightKg',
          )}
        >{data.product?.weightKg ?? 52} kg</strong>
      </div>
      <div class="fixture-product-facts">
        <span>Produto s/ IVA</span>
        <strong
          data-testid="fixture-product-price"
          data-df4y-editor-field="true"
          data-df4y-editor-kind="number"
          data-df4y-editor-label="Produto s/ IVA"
          data-sanity={sanity(
            'storeProduct.editor-fixture',
            'storeProduct',
            'variants[_key=="variant-standard"].priceNatural',
          )}
        >{Number(data.product?.priceNatural ?? 185).toFixed(2).replace('.', ',')} €</strong>
      </div>
    </section>

    <section
      class="fixture-product-gallery"
      data-testid="fixture-product-gallery"
      data-sanity={sanity('storeProduct.editor-fixture', 'storeProduct', 'gallery')}
    >
      <img src="/logo/brand_mark.png" alt="Banco editorial" />
      <div>
        <span>3 itens</span>
        <strong>Galeria do produto</strong>
      </div>
      <button
        class="fixture-product-video"
        type="button"
        data-testid="fixture-product-gallery-video"
        data-df4y-editor-kind="video"
        data-sanity={sanity(
          'storeProduct.editor-fixture',
          'storeProduct',
          'gallery[_key=="galleryvideo"]',
        )}
      >
        <video poster="/images/product-materials.png" muted playsinline aria-label="Vídeo do banco"></video>
        <span>Vídeo na galeria</span>
      </button>
    </section>
    <BuilderPageRenderer
      page={emptySectionPreview}
      settings={null}
      content={data.site}
      language={data.language}
      dataset="site-editor-e2e"
      preview
      embedded
    />
  </main>
{:else}
  <main class="fixture-page fixture-home" data-testid="fixture-home-page">
    <nav class="fixture-navigation" aria-label="Navegação de demonstração">
      <a
        class="fixture-hidden-duplicate"
        href="#editor"
        data-testid="fixture-nav-hidden-duplicate"
        data-sanity={sanity('siteContent', 'siteLanding', 'navigation[_key=="nav-about"].label.pt')}
      >Sobre oculto</a>
      <a
        href="#editor"
        data-testid="fixture-nav-link"
        data-sanity={sanity('siteContent', 'siteLanding', 'navigation[_key=="nav-about"].label.pt')}
      >Sobre</a>
      <a
        href="/painel/site/e2e-preview?fixture=product&lang=pt"
        data-testid="fixture-page-navigation"
      >Abrir produto</a>
    </nav>

    <section class="fixture-hero" id="editor">
      <small>DA FÁBRICA PARA O FUTURO</small>
      <h1
        class="cms-styled-text"
        style={textAppearanceStyle(data.home?.titleAppearance)}
        data-testid="fixture-hero-title"
        data-sanity={sanity('siteContent', 'siteLanding', 'home.hero.title.pt')}
      >{data.home?.title || 'Transformamos resíduos em soluções que duram'}</h1>
      <button
        type="button"
        data-testid="fixture-video-button"
        data-sanity={sanity('siteContent', 'siteLanding', 'home.heroVideoLabel.pt')}
      >Ver vídeo institucional</button>
    </section>

    <section class="fixture-impact">
      <h2
        class="cms-styled-text"
        style={textAppearanceStyle(data.home?.impactTitleAppearance)}
        data-testid="fixture-impact-title"
        data-sanity={sanity('siteContent', 'siteLanding', 'home.impact.title.pt')}
      >{data.home?.impactTitle || 'Menos desperdício, mais futuro'}</h2>
      <p>Esta área cria distância real para provar que a seleção acompanha o conteúdo ao fazer scroll.</p>
    </section>

    <section class="fixture-unknown">
      <p
        data-testid="fixture-unmatched-field"
        data-sanity={sanity('siteContent', 'siteLanding', 'home.experimentalCopy.pt')}
      >Campo ainda não incluído no editor simplificado.</p>
    </section>
    <BuilderPageRenderer
      page={emptySectionPreview}
      settings={null}
      content={data.site}
      language={data.language}
      dataset="site-editor-e2e"
      preview
      embedded
    />
  </main>
{/if}

<style>
  :global(html) {
    scroll-behavior: auto !important;
  }

  :global(body) {
    margin: 0;
    color: #10231f;
    background: #f4faf7;
    font-family: Inter, Arial, sans-serif;
  }

  .fixture-page {
    min-height: 1800px;
  }

  .fixture-navigation {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    justify-content: flex-end;
    padding: 20px clamp(24px, 8vw, 110px);
    background: rgb(255 255 255 / 94%);
    border-bottom: 1px solid #d7e3de;
  }

  .fixture-navigation a {
    color: #0a4b4e;
    font-weight: 800;
  }

  .fixture-hidden-duplicate {
    display: none;
  }

  .fixture-hero,
  .fixture-impact,
  .fixture-unknown,
  .fixture-product-copy,
  .fixture-product-gallery,
  .fixture-created-copy,
  .fixture-created-media {
    width: min(980px, calc(100% - 48px));
    margin-inline: auto;
  }

  .fixture-hero {
    display: grid;
    align-content: center;
    min-height: 700px;
    gap: 22px;
  }

  .fixture-hero small,
  .fixture-product-copy small {
    color: #166b62;
    font-size: 13px;
    font-weight: 850;
  }

  .fixture-hero h1,
  .fixture-product-copy h1 {
    max-width: 850px;
    margin: 0;
    font-size: clamp(38px, 7vw, 78px);
    line-height: 1.02;
  }

  .fixture-hero button {
    width: fit-content;
    min-height: 48px;
    padding: 0 20px;
    color: #fff;
    background: #126257;
    border: 0;
    border-radius: 5px;
    font-weight: 800;
  }

  .fixture-impact {
    display: grid;
    align-content: center;
    min-height: 700px;
    gap: 14px;
  }

  .fixture-impact h2 {
    max-width: 700px;
    margin: 0;
    font-size: clamp(32px, 5vw, 62px);
    line-height: 1.08;
  }

  .fixture-impact p,
  .fixture-unknown p,
  .fixture-product-copy p {
    max-width: 680px;
    font-size: 20px;
    line-height: 1.65;
  }

  .fixture-unknown {
    padding: 120px 0 240px;
  }

  .fixture-product {
    display: grid;
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
    align-content: start;
    gap: 44px;
    padding-top: 80px;
  }

  .fixture-created {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(320px, 1.05fr);
    align-content: start;
    gap: 48px;
    padding: 90px clamp(24px, 7vw, 110px);
  }

  .fixture-created-copy,
  .fixture-created-media {
    width: auto;
    margin: 0;
  }

  .fixture-created-copy {
    display: grid;
    align-content: start;
    gap: 20px;
  }

  .fixture-created-copy small {
    color: #166b62;
    font-size: 13px;
    font-weight: 850;
    text-transform: uppercase;
  }

  .fixture-created-copy h1 {
    margin: 0;
    font-size: clamp(40px, 6vw, 70px);
    line-height: 1.02;
  }

  .fixture-created-copy p,
  .fixture-created-article {
    margin: 0;
    font-size: 20px;
    line-height: 1.6;
  }

  .fixture-created-article {
    min-height: 72px;
  }

  .fixture-created-media {
    display: grid;
    place-content: center;
    min-height: 480px;
    gap: 8px;
    padding: 32px;
    text-align: center;
    background: #e4efea;
    border: 1px solid #cadbd4;
    border-radius: 6px;
  }

  .fixture-product-copy,
  .fixture-product-gallery {
    width: auto;
    margin: 0;
  }

  .fixture-product-copy {
    display: grid;
    align-content: start;
    gap: 20px;
    padding-left: clamp(24px, 7vw, 110px);
  }

  .fixture-product-copy h1 {
    font-size: clamp(40px, 6vw, 68px);
  }

  .fixture-product-facts {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 18px 0;
    border-top: 1px solid #cadbd4;
    border-bottom: 1px solid #cadbd4;
  }

  .fixture-product-gallery {
    display: grid;
    gap: 18px;
    margin-right: clamp(24px, 7vw, 110px);
    padding: 28px;
    background: #fff;
    border: 1px solid #d4e2dc;
    border-radius: 7px;
  }

  .fixture-product-gallery img {
    width: 100%;
    height: 480px;
    object-fit: contain;
    background: #eaf2ee;
  }

  .fixture-product-gallery div {
    display: flex;
    justify-content: space-between;
  }

  .fixture-product-video {
    position: relative;
    display: grid;
    grid-template-columns: 88px 1fr;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 8px;
    color: #10231f;
    text-align: left;
    background: #f1f7f4;
    border: 1px solid #cadbd4;
    border-radius: 5px;
  }

  .fixture-product-video video {
    width: 88px;
    height: 58px;
    object-fit: cover;
    background: #dce9e4;
  }

  .fixture-product-video span {
    font-weight: 800;
  }

  @media (max-width: 700px) {
    .fixture-page {
      min-height: 1500px;
    }

    .fixture-hero,
    .fixture-impact {
      min-height: 600px;
    }

    .fixture-product {
      grid-template-columns: 1fr;
      gap: 30px;
      padding-top: 42px;
    }

    .fixture-created {
      grid-template-columns: 1fr;
      gap: 30px;
      padding: 42px 24px;
    }

    .fixture-created-media {
      min-height: 320px;
    }

    .fixture-product-copy {
      padding: 0 24px;
    }

    .fixture-product-gallery {
      margin: 0 24px;
    }

    .fixture-product-gallery img {
      height: 320px;
    }
  }
</style>
