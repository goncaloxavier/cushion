import type {BuilderLayout, BuilderSection, LocalizedValue} from './types'

type RawObject = Record<string, any>
type KeyFactory = () => string

const localized = (pt: string, en: string, es: string): LocalizedValue => ({
  _type: 'localizedString',
  pt,
  en,
  es,
})

const localizedText = (pt: string, en: string, es: string): LocalizedValue => ({
  _type: 'localizedText',
  pt,
  en,
  es,
})

const valueOr = (value: unknown, fallback: LocalizedValue): LocalizedValue =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as LocalizedValue) : fallback

const landingLayout = (
  surface: NonNullable<BuilderLayout['surface']>,
  columns: number,
  mobileColumns: number,
): BuilderLayout => ({
  _type: 'builderLayout',
  surface,
  width: 'wide',
  columns,
  mobileColumns,
  gap: 24,
  verticalAlign: 'start',
  reverseOnMobile: false,
  spacing: {_type: 'builderSpacing', top: 61, bottom: 61, sides: 24},
})

const action = (key: KeyFactory, label: LocalizedValue, href: string) => ({
  _type: 'builderLink' as const,
  _key: key(),
  label,
  href,
  style: 'text' as const,
  newTab: false,
})

/**
 * Converts the four designed landing blocks into builder sections without
 * changing their visitor-facing presentation. Kept pure so a migration test
 * can prove the exact data contract before anything touches Sanity.
 */
export const buildHomeSections = (document: RawObject, key: KeyFactory): BuilderSection[] => {
  const home = document.home && typeof document.home === 'object' ? document.home : {}
  const productsPage =
    document.productsPage && typeof document.productsPage === 'object' ? document.productsPage : {}
  const casesPage =
    document.casesPage && typeof document.casesPage === 'object' ? document.casesPage : {}
  const sections: BuilderSection[] = []

  sections.push({
    _type: 'builderCollectionSection',
    _key: key(),
    internalLabel: 'Produtos em destaque',
    enabled: true,
    variant: 'landing-solutions',
    eyebrow: valueOr(productsPage.hero?.kicker, localized('Produtos', 'Products', 'Productos')),
    title: valueOr(
      productsPage.hero?.title,
      localized(
        'Soluções para exterior que não querem manutenção constante',
        'Outdoor solutions without constant maintenance',
        'Soluciones de exterior sin mantenimiento constante',
      ),
    ),
    source: 'productCategory',
    limit: 4,
    actions: [
      action(
        key,
        localized('Ver todos os produtos', 'View all products', 'Ver todos los productos'),
        '/produtos',
      ),
    ],
    layout: landingLayout('fog', 4, 1),
  })

  const stats = Array.isArray(home.impact?.stats) ? home.impact.stats : []
  if (home.impact?.title || stats.length) {
    sections.push({
      _type: 'builderStatsSection',
      _key: key(),
      internalLabel: 'Impacto e prova',
      enabled: true,
      variant: 'landing-impact',
      title: valueOr(
        home.impact?.title,
        localized('Impacto em números', 'Impact in numbers', 'Impacto en cifras'),
      ),
      items: stats.map((stat: RawObject) => ({
        _type: 'builderStat',
        _key: typeof stat._key === 'string' ? stat._key : key(),
        value: valueOr(stat.title, localized('0', '0', '0')),
        label: valueOr(stat.text, localizedText('', '', '')),
      })),
      layout: landingLayout('deep', 4, 2),
    })
  }

  sections.push({
    _type: 'builderCollectionSection',
    _key: key(),
    internalLabel: 'Casos em uso real',
    enabled: true,
    variant: 'landing-work',
    eyebrow: localized('Casos em uso real', 'In the field', 'Casos reales'),
    title: valueOr(
      casesPage.hero?.title,
      localized(
        'Projetos que mostram o material em uso real',
        'Projects that show the material in real use',
        'Proyectos que muestran el material en uso real',
      ),
    ),
    source: 'caseStudy',
    limit: 3,
    actions: [
      action(
        key,
        localized('Ver todos os casos', 'View all case studies', 'Ver todos los casos'),
        '/casos-de-estudo',
      ),
    ],
    layout: landingLayout('white', 3, 1),
  })

  const partners = Array.isArray(home.partners?.items) ? home.partners.items : []
  if (partners.length) {
    sections.push({
      _type: 'builderPartnersSection',
      _key: key(),
      internalLabel: 'Parceiros e projetos',
      enabled: true,
      variant: 'landing-partners',
      eyebrow: valueOr(home.partners?.kicker, localized('Parceiros', 'Partners', 'Socios')),
      title: valueOr(
        home.partners?.title,
        localized('Parceiros e projetos', 'Partners and projects', 'Socios y proyectos'),
      ),
      body: valueOr(home.partners?.lead, localizedText('', '', '')),
      items: partners.map((partner: RawObject) => ({
        ...partner,
        _type: 'partnerItem',
        _key: typeof partner._key === 'string' ? partner._key : key(),
      })),
      layout: landingLayout('white', 4, 2),
    })
  }

  return sections
}

const localizedCurrentValue = (
  value: string,
  type: 'localizedString' | 'localizedText',
  appearance?: Record<string, unknown>,
): LocalizedValue => ({
  _type: type,
  pt: value,
  en: value,
  es: value,
  ...(appearance ?? {}),
})

/**
 * Older published landing documents do not yet contain section objects. The
 * localized site model still has every value needed to build the same four
 * designed bands, so expose deterministic virtual sections until the first
 * editor change persists them.
 */
export const buildLocalizedHomeSections = (content: RawObject): BuilderSection[] => {
  let index = 0
  const key = () => `legacy-home-${++index}`
  const localizedSource = {
    productsPage: {
      hero: {
        kicker: localizedCurrentValue(
          content.nav?.products ?? 'Produtos',
          'localizedString',
        ),
        title: localizedCurrentValue(
          content.productsPage?.hero?.title ?? '',
          'localizedString',
          content.productsPage?.hero?.textAppearance?.title,
        ),
      },
    },
    casesPage: {
      hero: {
        title: localizedCurrentValue(
          content.casesPage?.hero?.title ?? '',
          'localizedString',
          content.casesPage?.hero?.textAppearance?.title,
        ),
      },
    },
    home: {
      impact: {
        title: localizedCurrentValue(
          content.home?.impact?.title ?? '',
          'localizedString',
          content.home?.impact?.textAppearance?.title,
        ),
        stats: (content.home?.impact?.stats ?? []).map((stat: RawObject, statIndex: number) => ({
          _key: `legacy-home-stat-${statIndex + 1}`,
          title: localizedCurrentValue(
            stat.title ?? '',
            'localizedString',
            stat.textAppearance?.title,
          ),
          text: localizedCurrentValue(
            stat.text ?? '',
            'localizedText',
            stat.textAppearance?.text,
          ),
        })),
      },
      partners: {
        kicker: localizedCurrentValue(
          content.home?.partners?.kicker ?? '',
          'localizedString',
          content.home?.partners?.textAppearance?.kicker,
        ),
        title: localizedCurrentValue(
          content.home?.partners?.title ?? '',
          'localizedString',
          content.home?.partners?.textAppearance?.title,
        ),
        lead: localizedCurrentValue(
          content.home?.partners?.lead ?? '',
          'localizedText',
          content.home?.partners?.textAppearance?.lead,
        ),
        items: (content.home?.partners?.items ?? []).map(
          (partner: RawObject, partnerIndex: number) => ({
            ...partner,
            _key: partner._key || `legacy-home-partner-${partnerIndex + 1}`,
            text: localizedCurrentValue(partner.text ?? '', 'localizedText'),
          }),
        ),
      },
    },
  }

  return buildHomeSections(localizedSource, key)
}
