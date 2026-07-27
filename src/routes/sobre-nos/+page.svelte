<script lang="ts">
  import {lineReveal} from '$lib/actions/line-reveal'
  import Reveal from '$lib/components/Reveal.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {loadSanityDataAttributeFactory, type SanityDataAttributeFactory} from '$lib/sanity-edit-attributes'
  import {textAppearanceStyle} from '$lib/text-appearance'

  let {data} = $props()
  let dataAttributeFactory = $state<SanityDataAttributeFactory | null>(null)
  $effect(() => {
    if ((data.preview || data.builderPreview) && !dataAttributeFactory) {
      void loadSanityDataAttributeFactory().then((factory) => (dataAttributeFactory = factory))
    }
  })
  const content = $derived(data.site)
  const siteContentDataAttribute = $derived(
    (data.preview || data.builderPreview) && data.studioUrl
      ? dataAttributeFactory?.({baseUrl: data.studioUrl, id: 'siteContent', type: 'siteLanding'})
      : null,
  )
</script>

<SeoHead title={content.nav.about} description={content.about.hero.lead || content.about.hero.title} />

<main class="about-page">
  <section class="about-index-hero about-index-hero-solo">
    <Reveal class="about-index-copy" variant="hero" priority>
      <p
        class="kicker cms-styled-text"
        style={textAppearanceStyle(content.about.hero.textAppearance?.kicker)}
      >{content.about.hero.kicker}</p>
      <h1
        class="cms-styled-text"
        style={textAppearanceStyle(content.about.hero.textAppearance?.title)}
        use:lineReveal
      >{content.about.hero.title}</h1>
    </Reveal>
  </section>

  <section class="section about-narrative">
    <Reveal class="about-statement" variant="panel">
      <p
        class="kicker cms-styled-text"
        style={textAppearanceStyle(content.about.statement.textAppearance?.kicker)}
        data-sanity={siteContentDataAttribute?.('about.statement.kicker.pt')}
      >{content.about.statement.kicker}</p>
      <h2
        class="cms-styled-text"
        style={textAppearanceStyle(content.about.statement.textAppearance?.title)}
        data-sanity={siteContentDataAttribute?.('about.statement.title.pt')}
      >{content.about.statement.title}</h2>
    </Reveal>

    <div class="about-timeline">
      {#each content.about.timeline as item, index}
        <Reveal delay={index * 70} variant="list">
          <article class="about-timeline-item">
            <span
              class="about-timeline-year cms-styled-text"
              style={textAppearanceStyle(item.textAppearance?.title)}
            >{item.title}</span>
            <p
              class="cms-styled-text"
              style={textAppearanceStyle(item.textAppearance?.text)}
            >{item.text}</p>
          </article>
        </Reveal>
      {/each}
    </div>
  </section>
</main>
