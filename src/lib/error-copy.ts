import type {LanguageCode} from '$lib/site-content'

export type ErrorCopy = {
  title: string
  lead: string
  home: string
  store: string
}

const copyByLanguage: Record<LanguageCode, {notFound: ErrorCopy; generic: ErrorCopy}> = {
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

export const errorCopy = (status: number, language: LanguageCode): ErrorCopy =>
  status === 404 ? copyByLanguage[language].notFound : copyByLanguage[language].generic
