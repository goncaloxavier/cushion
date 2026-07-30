<script lang="ts">
  import {page} from '$app/state'
  import {errorCopy} from '$lib/error-copy'
  import {defaultLanguage, languages, type LanguageCode} from '$lib/site-content'

  const language = $derived(
    (languages.find((option) => option.code === page.url.searchParams.get('lang'))?.code ??
      defaultLanguage) as LanguageCode,
  )
  const status = $derived(page.status)
  const t = $derived(errorCopy(status, language))
  const withLang = (href: string) =>
    language === defaultLanguage ? href : `${href}?lang=${language}`
</script>

<svelte:head>
  <title>{t.title} | DaFábrica4You</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="error-page">
  <section class="error-shell">
    <p class="kicker">Erro {status}</p>
    <h1>{t.title}</h1>
    <p class="error-lead">{t.lead}</p>
    <div class="error-actions">
      <a class="button primary" href={withLang('/')}>{t.home}</a>
      <a class="button subtle" href={withLang('/loja')}>{t.store}</a>
    </div>
  </section>
</main>
