<script lang="ts">
  import {encodeSanityNodeData} from '@sanity/visual-editing-csm'
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
</script>

<svelte:head>
  <title>Pré-visualização do editor</title>
</svelte:head>

{#if data.fixture === 'product'}
  <main class="fixture-page fixture-product" data-testid="fixture-product-page">
    <section class="fixture-product-copy">
      <small>LOJA</small>
      <h1
        data-testid="fixture-product-title"
        data-sanity={sanity('storeProduct.editor-fixture', 'storeProduct', 'title.pt')}
      >Banco editorial</h1>
      <p
        data-testid="fixture-product-summary"
        data-sanity={sanity('storeProduct.editor-fixture', 'storeProduct', 'summary.pt')}
      >Produto de demonstração usado apenas pelos testes do editor.</p>
      <div class="fixture-product-facts">
        <span>Peso</span>
        <strong
          data-testid="fixture-product-weight"
          data-df4y-editor-field="true"
          data-sanity={sanity(
            'storeProduct.editor-fixture',
            'storeProduct',
            'variants[_key=="variant-standard"].weightKg',
          )}
        >52 kg</strong>
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
    </section>
  </main>
{:else}
  <main class="fixture-page fixture-home" data-testid="fixture-home-page">
    <nav class="fixture-navigation" aria-label="Navegação de demonstração">
      <a
        href="#editor"
        data-testid="fixture-nav-link"
        data-sanity={sanity('siteContent', 'siteLanding', 'navigation[_key=="nav-about"].label.pt')}
      >Sobre</a>
    </nav>

    <section class="fixture-hero" id="editor">
      <small>DA FÁBRICA PARA O FUTURO</small>
      <h1
        data-testid="fixture-hero-title"
        data-sanity={sanity('siteContent', 'siteLanding', 'home.hero.title.pt')}
      >Transformamos resíduos em soluções que duram</h1>
      <button
        type="button"
        data-testid="fixture-video-button"
        data-sanity={sanity('siteContent', 'siteLanding', 'home.heroVideoLabel.pt')}
      >Ver vídeo institucional</button>
    </section>

    <section class="fixture-impact">
      <h2
        data-testid="fixture-impact-title"
        data-sanity={sanity('siteContent', 'siteLanding', 'home.impact.title.pt')}
      >Menos desperdício, mais futuro</h2>
      <p>Esta área cria distância real para provar que a seleção acompanha o conteúdo ao fazer scroll.</p>
    </section>

    <section class="fixture-unknown">
      <p
        data-testid="fixture-unmatched-field"
        data-sanity={sanity('siteContent', 'siteLanding', 'home.experimentalCopy.pt')}
      >Campo ainda não incluído no editor simplificado.</p>
    </section>
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

  .fixture-hero,
  .fixture-impact,
  .fixture-unknown,
  .fixture-product-copy,
  .fixture-product-gallery {
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
