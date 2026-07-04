<script lang="ts">
  import {page} from '$app/state'
  import {defaultLanguage, languages, type LanguageCode} from '$lib/site-content'

  const language = $derived(
    (languages.find((option) => option.code === page.url.searchParams.get('lang'))?.code ??
      defaultLanguage) as LanguageCode,
  )
  const status = $derived(page.status)
  const isNotFound = $derived(status === 404)

  type Copy = {title: string; lead: string; home: string; store: string}
  const copyByLanguage: Record<LanguageCode, {notFound: Copy; generic: Copy}> = {
    pt: {
      notFound: {
        title: 'Página não encontrada',
        lead: 'A página que procura não existe ou foi movida. Verifique o endereço ou volte ao início.',
        home: 'Voltar ao início',
        store: 'Ver a loja',
      },
      generic: {
        title: 'Algo correu mal',
        lead: 'Ocorreu um erro inesperado. Tente novamente dentro de instantes.',
        home: 'Voltar ao início',
        store: 'Ver a loja',
      },
    },
    en: {
      notFound: {
        title: 'Page not found',
        lead: "The page you're looking for doesn't exist or was moved. Check the address or head back home.",
        home: 'Back to home',
        store: 'Visit the store',
      },
      generic: {
        title: 'Something went wrong',
        lead: 'An unexpected error occurred. Please try again in a moment.',
        home: 'Back to home',
        store: 'Visit the store',
      },
    },
    es: {
      notFound: {
        title: 'Página no encontrada',
        lead: 'La página que buscas no existe o fue movida. Comprueba la dirección o vuelve al inicio.',
        home: 'Volver al inicio',
        store: 'Ver la tienda',
      },
      generic: {
        title: 'Algo salió mal',
        lead: 'Ocurrió un error inesperado. Inténtalo de nuevo en unos instantes.',
        home: 'Volver al inicio',
        store: 'Ver la tienda',
      },
    },
  }

  const t = $derived(isNotFound ? copyByLanguage[language].notFound : copyByLanguage[language].generic)
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
      <a class="button secondary" href={withLang('/loja')}>{t.store}</a>
    </div>
  </section>
</main>
