import type {ContentImage, LanguageCode, StoreProduct, StoreProductVariant} from './site-content'

type Localized = Record<LanguageCode, string>
type LocalizedStoreImage = Omit<ContentImage, 'alt'> & {alt: Localized}

type StoreProductBase = Omit<StoreProduct, 'summary' | 'variants' | 'image' | 'images'> & {
  summary: Localized
  image?: LocalizedStoreImage
  images?: LocalizedStoreImage[]
  variants: Array<
    Omit<StoreProductVariant, 'label' | 'dimensions' | 'note'> & {
      label: Localized
      dimensions: Record<LanguageCode, string[]>
      note?: Localized
    }
  >
}

const same = (value: string): Localized => ({pt: value, en: value, es: value})
const storeImage = (
  file: string,
  alt: Localized,
  aspectRatio = 4 / 3,
): LocalizedStoreImage => ({
  url: `/images/store/${file}`,
  alt,
  aspectRatio,
})

const storeProductBase: StoreProductBase[] = [
  {
    title: 'Banco Gavião',
    slug: 'banco-gaviao',
    category: 'bancos',
    cataloguePage: 10,
    summary: {
      pt: 'Banco de exterior simples e robusto, indicado para jardins, parques e zonas de descanso.',
      en: 'Simple, robust outdoor bench for gardens, parks and resting areas.',
      es: 'Banco exterior sencillo y robusto para jardines, parques y zonas de descanso.',
    },
    image: storeImage('banco-gaviao-01.jpeg', {
      pt: 'Banco Gavião em acabamento escuro sobre relva artificial.',
      en: 'Banco Gavião bench in dark finish on artificial grass.',
      es: 'Banco Gavião en acabado oscuro sobre césped artificial.',
    }),
    images: [
      storeImage('banco-gaviao-01.jpeg', {
        pt: 'Banco Gavião em acabamento escuro sobre relva artificial.',
        en: 'Banco Gavião bench in dark finish on artificial grass.',
        es: 'Banco Gavião en acabado oscuro sobre césped artificial.',
      }),
      storeImage('banco-gaviao-02.jpeg', {
        pt: 'Vista frontal aproximada do Banco Gavião.',
        en: 'Closer front view of the Banco Gavião bench.',
        es: 'Vista frontal aproximada del Banco Gavião.',
      }),
      storeImage('banco-gaviao-03.jpeg', {
        pt: 'Banco Gavião visto de frente com os apoios laterais visíveis.',
        en: 'Front view of the Banco Gavião with side supports visible.',
        es: 'Banco Gavião visto de frente con los soportes laterales visibles.',
      }),
    ],
    variants: [
      {
        label: same('2000 mm'),
        dimensions: {
          pt: ['Comprimento 2000 mm', 'Largura 460 mm', 'Altura 450 mm'],
          en: ['Length 2000 mm', 'Width 460 mm', 'Height 450 mm'],
          es: ['Longitud 2000 mm', 'Anchura 460 mm', 'Altura 450 mm'],
        },
        weightKg: 52,
        prices: {natural: 185, dark: 210},
      },
    ],
  },
  {
    title: 'Banco Foros Domingão',
    slug: 'banco-foros-domingao',
    category: 'bancos',
    cataloguePage: 10,
    summary: {
      pt: 'Banco comprido para zonas exteriores de permanência e espera.',
      en: 'Long bench for outdoor waiting and resting areas.',
      es: 'Banco largo para zonas exteriores de espera y descanso.',
    },
    variants: [
      {
        label: same('1600 mm'),
        dimensions: {
          pt: ['Comprimento 1600 mm', 'Largura 380 mm', 'Altura 450 mm'],
          en: ['Length 1600 mm', 'Width 380 mm', 'Height 450 mm'],
          es: ['Longitud 1600 mm', 'Anchura 380 mm', 'Altura 450 mm'],
        },
        // Catalogue lists no weight for this bench; estimated at 45 kg from the
        // comparable Banco Gavião (2000 mm slat bench = 52 kg). Sits inside the
        // carrier's 11–50 kg bracket, so the transport price is firm.
        weightKg: 45,
        prices: {natural: 225, dark: 260},
      },
    ],
  },
  {
    title: 'Banco Fazenda',
    slug: 'banco-fazenda',
    category: 'bancos',
    cataloguePage: 11,
    summary: {
      pt: 'Banco de grande formato para espaços públicos, quintas e zonas exteriores amplas.',
      en: 'Large-format bench for public spaces, farms and open outdoor areas.',
      es: 'Banco de gran formato para espacios públicos, fincas y zonas exteriores amplias.',
    },
    variants: [
      {
        label: same('2450 mm'),
        dimensions: {
          pt: ['Comprimento 2450 mm', 'Largura 500 mm', 'Altura 500 mm'],
          en: ['Length 2450 mm', 'Width 500 mm', 'Height 500 mm'],
          es: ['Longitud 2450 mm', 'Anchura 500 mm', 'Altura 500 mm'],
        },
        weightKg: 172,
        prices: {natural: 320, dark: 405},
      },
    ],
  },
  {
    title: 'Banco Montargil',
    slug: 'banco-montargil',
    category: 'bancos',
    cataloguePage: 11,
    summary: {
      pt: 'Banco com costas para estadia confortável em jardim, parque ou equipamento coletivo.',
      en: 'Bench with backrest for comfortable use in gardens, parks or shared facilities.',
      es: 'Banco con respaldo para uso cómodo en jardines, parques o equipamientos colectivos.',
    },
    variants: [
      {
        label: same('1500 mm'),
        dimensions: {
          pt: [
            'Comprimento 1500 mm',
            'Largura do assento 370 mm',
            'Largura total 780 mm',
            'Altura 450 mm',
          ],
          en: [
            'Length 1500 mm',
            'Seat width 370 mm',
            'Total width 780 mm',
            'Height 450 mm',
          ],
          es: [
            'Longitud 1500 mm',
            'Anchura del asiento 370 mm',
            'Anchura total 780 mm',
            'Altura 450 mm',
          ],
        },
        weightKg: 66,
        prices: {natural: 240, dark: 270},
        note: {
          pt: 'Opção 3 tábuas nas costas.',
          en: 'Three-board backrest option.',
          es: 'Opción con tres tablas en el respaldo.',
        },
      },
    ],
  },
  {
    title: 'Mesa Vale do Arco',
    slug: 'mesa-vale-do-arco',
    category: 'mesas',
    cataloguePage: 13,
    summary: {
      pt: 'Mesa com bancos integrados para merendas, parques, escolas e espaços coletivos.',
      en: 'Table with integrated benches for picnic areas, parks, schools and shared spaces.',
      es: 'Mesa con bancos integrados para merenderos, parques, escuelas y espacios colectivos.',
    },
    variants: [
      {
        label: same('1500 mm'),
        dimensions: {
          pt: [
            'Comprimento 1500 mm',
            'Largura da mesa 880 mm',
            'Altura 850 mm',
            'Largura total 1670 mm',
          ],
          en: ['Length 1500 mm', 'Table width 880 mm', 'Height 850 mm', 'Total width 1670 mm'],
          es: [
            'Longitud 1500 mm',
            'Anchura de mesa 880 mm',
            'Altura 850 mm',
            'Anchura total 1670 mm',
          ],
        },
        weightKg: 178,
        prices: {natural: 322, dark: 410},
      },
      {
        label: same('2450 mm'),
        dimensions: {
          pt: [
            'Comprimento 2450 mm',
            'Largura da mesa 880 mm',
            'Altura 850 mm',
            'Largura total 1670 mm',
          ],
          en: ['Length 2450 mm', 'Table width 880 mm', 'Height 850 mm', 'Total width 1670 mm'],
          es: [
            'Longitud 2450 mm',
            'Anchura de mesa 880 mm',
            'Altura 850 mm',
            'Anchura total 1670 mm',
          ],
        },
        weightKg: 270,
        prices: {natural: 445, dark: 565},
        note: {pt: '3 pés.', en: 'Three legs.', es: 'Tres apoyos.'},
      },
    ],
  },
  {
    title: 'Mesa Octogonal',
    slug: 'mesa-octogonal',
    category: 'mesas',
    cataloguePage: 13,
    summary: {
      pt: 'Mesa octogonal com bancos para zonas de convívio e refeição ao ar livre.',
      en: 'Octagonal table with benches for outdoor social and dining areas.',
      es: 'Mesa octogonal con bancos para zonas de convivencia y comida al aire libre.',
    },
    variants: [
      {
        label: same('1400 mm'),
        dimensions: {
          pt: [
            'Largura da mesa 1400 mm',
            'Largura dos bancos 320 mm',
            'Altura 850 mm',
            'Largura total 2200 mm',
          ],
          en: ['Table width 1400 mm', 'Bench width 320 mm', 'Height 850 mm', 'Total width 2200 mm'],
          es: [
            'Anchura de mesa 1400 mm',
            'Anchura de bancos 320 mm',
            'Altura 850 mm',
            'Anchura total 2200 mm',
          ],
        },
        weightKg: 472,
        prices: {natural: 683.5, dark: 798},
      },
    ],
  },
  {
    title: 'Conjunto Atalia',
    slug: 'conjunto-atalia',
    category: 'mesas',
    cataloguePage: 15,
    summary: {
      pt: 'Conjunto de mesa e bancos para refeições e zonas exteriores de convívio.',
      en: 'Table and bench set for outdoor dining and social spaces.',
      es: 'Conjunto de mesa y bancos para comidas y zonas exteriores de convivencia.',
    },
    variants: [
      {
        label: {pt: 'Conjunto', en: 'Set', es: 'Conjunto'},
        dimensions: {
          pt: ['Comprimento 214 cm', 'Largura 99 cm', 'Altura 80 cm'],
          en: ['Length 214 cm', 'Width 99 cm', 'Height 80 cm'],
          es: ['Longitud 214 cm', 'Anchura 99 cm', 'Altura 80 cm'],
        },
        weightKg: 160,
        prices: {natural: 595, dark: 690},
      },
    ],
  },
  {
    title: 'Cadeira Atalaia',
    slug: 'cadeira-atalaia',
    category: 'cadeiras',
    cataloguePage: 15,
    summary: {
      pt: 'Cadeira exterior larga para jardins, esplanadas e zonas de descanso.',
      en: 'Wide outdoor chair for gardens, terraces and resting areas.',
      es: 'Silla exterior amplia para jardines, terrazas y zonas de descanso.',
    },
    image: storeImage(
      'cadeira-atalaia-01.jpeg',
      {
        pt: 'Duas cadeiras Atalaia com uma mesa pequena sobre relva artificial.',
        en: 'Two Cadeira Atalaia chairs with a small table on artificial grass.',
        es: 'Dos sillas Atalaia con una mesa pequeña sobre césped artificial.',
      },
      1,
    ),
    images: [
      storeImage(
        'cadeira-atalaia-01.jpeg',
        {
          pt: 'Duas cadeiras Atalaia com uma mesa pequena sobre relva artificial.',
          en: 'Two Cadeira Atalaia chairs with a small table on artificial grass.',
          es: 'Dos sillas Atalaia con una mesa pequeña sobre césped artificial.',
        },
        1,
      ),
      storeImage(
        'cadeira-atalaia-02.jpeg',
        {
          pt: 'Vista lateral da Cadeira Atalaia em acabamento natural.',
          en: 'Side view of the Cadeira Atalaia in natural finish.',
          es: 'Vista lateral de la silla Atalaia en acabado natural.',
        },
        1,
      ),
      storeImage(
        'cadeira-atalaia-03.jpeg',
        {
          pt: 'Duas pessoas em pé sobre a Cadeira Atalaia.',
          en: 'Two people standing on the Cadeira Atalaia chair.',
          es: 'Dos personas de pie sobre la silla Atalaia.',
        },
        3 / 4,
      ),
    ],
    variants: [
      {
        label: {pt: 'Cadeira', en: 'Chair', es: 'Silla'},
        dimensions: {
          pt: ['Profundidade 80 cm', 'Largura 70 cm', 'Altura 95 cm'],
          en: ['Depth 80 cm', 'Width 70 cm', 'Height 95 cm'],
          es: ['Profundidad 80 cm', 'Anchura 70 cm', 'Altura 95 cm'],
        },
        weightKg: 38,
        prices: {natural: 222, dark: 240},
      },
    ],
  },
  {
    title: 'Cadeira de Bar',
    slug: 'cadeira-de-bar',
    category: 'cadeiras',
    cataloguePage: 16,
    summary: {
      pt: 'Cadeira alta para balcões, bares, esplanadas e zonas de apoio exterior.',
      en: 'High chair for counters, bars, terraces and outdoor support areas.',
      es: 'Silla alta para mostradores, bares, terrazas y zonas exteriores de apoyo.',
    },
    variants: [
      {
        label: {pt: 'Altura 96,5 cm', en: 'Height 96.5 cm', es: 'Altura 96,5 cm'},
        dimensions: {
          pt: ['Largura 45 cm', 'Profundidade 45 cm', 'Altura 96,5 cm', 'Assento 69,5 cm'],
          en: ['Width 45 cm', 'Depth 45 cm', 'Height 96.5 cm', 'Seat 69.5 cm'],
          es: ['Anchura 45 cm', 'Profundidad 45 cm', 'Altura 96,5 cm', 'Asiento 69,5 cm'],
        },
        weightKg: 37,
        prices: {natural: 155, dark: 190},
      },
    ],
  },
  {
    title: 'Mesa Ervideira',
    slug: 'mesa-ervideira',
    category: 'mesas',
    cataloguePage: 19,
    summary: {
      pt: 'Mesa retangular para exterior, adequada a zonas de refeição, trabalho ou apoio.',
      en: 'Rectangular outdoor table for dining, work or support areas.',
      es: 'Mesa rectangular exterior para zonas de comida, trabajo o apoyo.',
    },
    variants: [
      {
        label: same('2000 mm'),
        dimensions: {
          pt: ['Comprimento 2000 mm', 'Largura 900 mm', 'Altura 800 mm'],
          en: ['Length 2000 mm', 'Width 900 mm', 'Height 800 mm'],
          es: ['Longitud 2000 mm', 'Anchura 900 mm', 'Altura 800 mm'],
        },
        weightKg: 151,
        prices: {natural: 335, dark: 410},
      },
    ],
  },
  {
    title: 'Papeleira Reta',
    slug: 'papeleira-reta',
    category: 'residuos',
    cataloguePage: 22,
    summary: {
      pt: 'Papeleira vertical para espaços exteriores, disponível com ou sem tampa.',
      en: 'Vertical bin for outdoor spaces, available with or without lid.',
      es: 'Papelera vertical para espacios exteriores, disponible con o sin tapa.',
    },
    variants: [
      {
        label: {pt: 'Sem tampa', en: 'Without lid', es: 'Sin tapa'},
        dimensions: {
          pt: ['Comprimento 400 mm', 'Largura 400 mm', 'Altura 700 mm'],
          en: ['Length 400 mm', 'Width 400 mm', 'Height 700 mm'],
          es: ['Longitud 400 mm', 'Anchura 400 mm', 'Altura 700 mm'],
        },
        weightKg: 32,
        prices: {natural: 130.5, dark: 145.5},
      },
      {
        label: {pt: 'Com tampa', en: 'With lid', es: 'Con tapa'},
        dimensions: {
          pt: ['Comprimento 400 mm', 'Largura 400 mm', 'Altura 700 mm'],
          en: ['Length 400 mm', 'Width 400 mm', 'Height 700 mm'],
          es: ['Longitud 400 mm', 'Anchura 400 mm', 'Altura 700 mm'],
        },
        weightKg: 39,
        prices: {natural: 150.5, dark: 170.5},
      },
    ],
  },
  {
    title: 'Ecoponto Triplo com Portas',
    slug: 'ecoponto-triplo-com-portas',
    category: 'residuos',
    cataloguePage: 23,
    summary: {
      pt: 'Ecoponto triplo com portas para separação de resíduos em espaços coletivos.',
      en: 'Triple recycling station with doors for waste separation in shared spaces.',
      es: 'Ecopunto triple con puertas para separación de residuos en espacios colectivos.',
    },
    variants: [
      {
        label: {pt: 'Triplo', en: 'Triple', es: 'Triple'},
        dimensions: {
          pt: ['Comprimento 1800 mm', 'Largura 555 mm', 'Altura 1000 mm'],
          en: ['Length 1800 mm', 'Width 555 mm', 'Height 1000 mm'],
          es: ['Longitud 1800 mm', 'Anchura 555 mm', 'Altura 1000 mm'],
        },
        weightKg: 177,
        prices: {natural: 298, dark: 373},
        note: {
          pt: 'Sem gravação e pintura.',
          en: 'Without engraving and painting.',
          es: 'Sin grabado ni pintura.',
        },
      },
    ],
  },
  {
    title: 'Ecoponto 4 Resíduos',
    slug: 'ecoponto-4-residuos',
    category: 'residuos',
    cataloguePage: 24,
    summary: {
      pt: 'Ecoponto para quatro resíduos, indicado para zonas públicas, escolas e empresas.',
      en: 'Four-stream recycling station for public areas, schools and companies.',
      es: 'Ecopunto para cuatro residuos, indicado para zonas públicas, escuelas y empresas.',
    },
    variants: [
      {
        label: {pt: 'Sem tampa', en: 'Without lid', es: 'Sin tapa'},
        dimensions: {
          pt: ['Comprimento 1400 mm', 'Largura 500 mm', 'Altura 850 mm'],
          en: ['Length 1400 mm', 'Width 500 mm', 'Height 850 mm'],
          es: ['Longitud 1400 mm', 'Anchura 500 mm', 'Altura 850 mm'],
        },
        weightKg: 94,
        prices: {natural: 240, dark: 275.5},
        note: {
          pt: 'Sem gravação e pintura.',
          en: 'Without engraving and painting.',
          es: 'Sin grabado ni pintura.',
        },
      },
      {
        label: {pt: 'Com tampa', en: 'With lid', es: 'Con tapa'},
        dimensions: {
          pt: ['Comprimento 1400 mm', 'Largura 500 mm', 'Altura 850 mm'],
          en: ['Length 1400 mm', 'Width 500 mm', 'Height 850 mm'],
          es: ['Longitud 1400 mm', 'Anchura 500 mm', 'Altura 850 mm'],
        },
        weightKg: 107,
        prices: {natural: 260.5, dark: 295},
        note: {
          pt: 'Sem gravação e pintura.',
          en: 'Without engraving and painting.',
          es: 'Sin grabado ni pintura.',
        },
      },
    ],
  },
  {
    title: 'Mesa de Cultivo',
    slug: 'mesa-de-cultivo',
    category: 'cultivo',
    cataloguePage: 29,
    summary: {
      pt: 'Mesa elevada para cultivo em jardins, escolas, hortas urbanas e espaços acessíveis.',
      en: 'Raised growing table for gardens, schools, urban gardens and accessible spaces.',
      es: 'Mesa elevada de cultivo para jardines, escuelas, huertos urbanos y espacios accesibles.',
    },
    variants: [
      {
        label: {pt: '1000 x 1000 mm', en: '1000 x 1000 mm', es: '1000 x 1000 mm'},
        dimensions: {
          pt: ['Comprimento 1000 mm', 'Largura 1000 mm', 'Altura total 900 mm'],
          en: ['Length 1000 mm', 'Width 1000 mm', 'Total height 900 mm'],
          es: ['Longitud 1000 mm', 'Anchura 1000 mm', 'Altura total 900 mm'],
        },
        weightKg: 84,
        prices: {natural: 200, dark: 240.5},
        note: {
          pt: 'Altura para terra 280 mm.',
          en: 'Soil depth 280 mm.',
          es: 'Altura para tierra 280 mm.',
        },
      },
      {
        label: {pt: '950 x 600 mm', en: '950 x 600 mm', es: '950 x 600 mm'},
        dimensions: {
          pt: ['Comprimento 950 mm', 'Largura 600 mm', 'Altura 800 mm'],
          en: ['Length 950 mm', 'Width 600 mm', 'Height 800 mm'],
          es: ['Longitud 950 mm', 'Anchura 600 mm', 'Altura 800 mm'],
        },
        weightKg: 42,
        prices: {natural: 133.5, dark: 152},
        note: {
          pt: 'Altura para terra 175 mm.',
          en: 'Soil depth 175 mm.',
          es: 'Altura para tierra 175 mm.',
        },
      },
    ],
  },
  {
    title: 'Canteiro com Treliça',
    slug: 'canteiro-com-trelica',
    category: 'cultivo',
    cataloguePage: 30,
    summary: {
      pt: 'Canteiro com treliça para plantas trepadeiras, hortas decorativas e separação verde.',
      en: 'Planter with trellis for climbing plants, decorative gardens and green separation.',
      es: 'Jardinera con celosía para trepadoras, huertos decorativos y separación verde.',
    },
    variants: [
      {
        label: same('1030 mm'),
        dimensions: {
          pt: ['Comprimento 1030 mm', 'Largura 350 mm', 'Altura total 1400 mm'],
          en: ['Length 1030 mm', 'Width 350 mm', 'Total height 1400 mm'],
          es: ['Longitud 1030 mm', 'Anchura 350 mm', 'Altura total 1400 mm'],
        },
        weightKg: 52,
        prices: {natural: 174.5, dark: 197.5},
        note: {
          pt: 'Altura do vaso 440 mm.',
          en: 'Planter height 440 mm.',
          es: 'Altura del vaso 440 mm.',
        },
      },
    ],
  },
  {
    title: 'Conjunto Domingão',
    slug: 'conjunto-domingao',
    category: 'mesas',
    cataloguePage: 13,
    summary: {
      pt: 'Conjunto de mesa com bancos integrados para merendas, parques e espaços coletivos.',
      en: 'Table set with integrated benches for picnics, parks and shared spaces.',
      es: 'Conjunto de mesa con bancos integrados para meriendas, parques y espacios colectivos.',
    },
    variants: [
      {
        label: same('1500 mm'),
        dimensions: {
          pt: [
            'Comprimento 1500 mm',
            'Largura da mesa 685 mm',
            'Altura 800 mm',
            'Largura do banco 310 mm',
            'Largura total 1760 mm',
          ],
          en: [
            'Length 1500 mm',
            'Table width 685 mm',
            'Height 800 mm',
            'Bench width 310 mm',
            'Total width 1760 mm',
          ],
          es: [
            'Longitud 1500 mm',
            'Anchura de la mesa 685 mm',
            'Altura 800 mm',
            'Anchura del banco 310 mm',
            'Anchura total 1760 mm',
          ],
        },
        weightKg: 189,
        prices: {natural: 349.5, dark: 450},
      },
    ],
  },
  {
    title: 'Cadeira Páteo',
    slug: 'cadeira-pateo',
    category: 'cadeiras',
    cataloguePage: 16,
    summary: {
      pt: 'Cadeira de pátio em plástico reciclado, confortável para esplanadas, jardins e zonas de descanso.',
      en: 'Patio chair in recycled plastic, comfortable for terraces, gardens and resting areas.',
      es: 'Silla de patio en plástico reciclado, cómoda para terrazas, jardines y zonas de descanso.',
    },
    variants: [
      {
        label: same('Cadeira Páteo'),
        dimensions: {
          pt: ['Profundidade 630 mm', 'Altura 950 mm', 'Altura do assento 400 mm'],
          en: ['Depth 630 mm', 'Height 950 mm', 'Seat height 400 mm'],
          es: ['Profundidad 630 mm', 'Altura 950 mm', 'Altura del asiento 400 mm'],
        },
        weightKg: 38,
        prices: {natural: 140, dark: 170},
      },
    ],
  },
  {
    title: 'Mesa de Apoio',
    slug: 'mesa-de-apoio',
    category: 'mesas',
    cataloguePage: 16,
    summary: {
      pt: 'Mesa de apoio compacta em plástico reciclado, ideal para acompanhar cadeiras de pátio e esplanadas.',
      en: 'Compact side table in recycled plastic, ideal alongside patio chairs and terraces.',
      es: 'Mesa auxiliar compacta en plástico reciclado, ideal para acompañar sillas de patio y terrazas.',
    },
    variants: [
      {
        label: same('Mesa de Apoio'),
        dimensions: {
          pt: ['Comprimento 550 mm', 'Largura 550 mm', 'Altura 480 mm'],
          en: ['Length 550 mm', 'Width 550 mm', 'Height 480 mm'],
          es: ['Longitud 550 mm', 'Anchura 550 mm', 'Altura 480 mm'],
        },
        weightKg: 22,
        prices: {natural: 75, dark: 87},
      },
    ],
  },
]

export const storeProductsForLanguage = (language: LanguageCode): StoreProduct[] =>
  storeProductBase.map((product) => ({
    title: product.title,
    slug: product.slug,
    category: product.category,
    summary: product.summary[language],
    cataloguePage: product.cataloguePage,
    image: product.image ? {...product.image, alt: product.image.alt[language]} : undefined,
    images: product.images?.map((image) => ({...image, alt: image.alt[language]})),
    variants: product.variants.map((variant) => ({
      label: variant.label[language],
      dimensions: variant.dimensions[language],
      weightKg: variant.weightKg,
      prices: variant.prices,
      note: variant.note?.[language],
    })),
  }))
