export type LanguageCode = 'pt' | 'en' | 'es'

export type LocalizedValue = Partial<Record<LanguageCode, string>>

export type LanguageOption = {
  code: LanguageCode
  label: string
  name: string
}

export type LinkItem = {
  href: string
  label: string
}

export type CopyBlock = {
  kicker: string
  title: string
  lead: string
}

export type ContentCard = {
  title: string
  text: string
}

export type ContentImage = {
  url: string
  alt: string
}

export type ProductItem = {
  title: string
  slug: string
  summary: string
  description: string
  image?: ContentImage
  images?: ContentImage[]
  features: string[]
  applications: string[]
}

export type CaseStudy = {
  title: string
  slug: string
  location: string
  summary: string
  image?: ContentImage
  images?: ContentImage[]
  challenge: string
  solution: string
  result: string
  productArea: string
}

export type BlogPost = {
  title: string
  slug: string
  excerpt: string
  publishedAt: string
  category: string
  image?: ContentImage
  body: string
}

export type SiteContent = {
  nav: {
    home: string
    about: string
    products: string
    catalogue: string
    cases: string
    blog: string
    contact: string
  }
  common: {
    scroll: string
    readMore: string
    requestQuote: string
    exploreProducts: string
    viewCases: string
    allProducts: string
    latestPosts: string
    challenge: string
    solution: string
    result: string
    emailLabel: string
    phoneLabel: string
    featuresLabel: string
    applicationsLabel: string
    backToProducts: string
    backToCases: string
    searchProducts: string
    searchCases: string
    searchPosts: string
    searchPlaceholder: string
    noResults: string
    pageLabel: string
    previous: string
    next: string
    zoomImage: string
    close: string
    contactEmail: string
    contactPhone: string
  }
  home: {
    hero: CopyBlock
    intro: CopyBlock
    impact: {
      title: string
      lead: string
      stats: ContentCard[]
    }
    manifesto: {
      quote: string
      attribution: string
    }
  }
  about: {
    hero: CopyBlock
    timeline: ContentCard[]
    principles: ContentCard[]
  }
  productsPage: {
    hero: CopyBlock
    lead: string
  }
  catalogue: {
    hero: CopyBlock
    quoteFlow: ContentCard[]
    estimate: {
      kicker: string
      title: string
      lead: string
      cards: ContentCard[]
      checklistTitle: string
      checklist: string[]
    }
    note: string
  }
  casesPage: {
    hero: CopyBlock
  }
  blogPage: {
    hero: CopyBlock
    newsletter: CopyBlock
  }
  contactPage: {
    hero: CopyBlock
    fields: string[]
  }
  footer: {
    line: string
    note: string
  }
  products: ProductItem[]
  caseStudies: CaseStudy[]
  blogPosts: BlogPost[]
}

type SanityProduct = {
  title?: LocalizedValue
  slug?: {current?: string}
  image?: SanityImage
  gallery?: SanityImage[]
  summary?: LocalizedValue
  description?: LocalizedValue
  features?: LocalizedValue[]
  applications?: LocalizedValue[]
}

type SanityCaseStudy = {
  title?: LocalizedValue
  slug?: {current?: string}
  image?: SanityImage
  gallery?: SanityImage[]
  location?: string
  summary?: LocalizedValue
  challenge?: LocalizedValue
  solution?: LocalizedValue
  result?: LocalizedValue
  productArea?: LocalizedValue
}

type SanityBlogPost = {
  title?: LocalizedValue
  slug?: {current?: string}
  image?: SanityImage
  excerpt?: LocalizedValue
  publishedAt?: string
  category?: LocalizedValue
  body?: LocalizedValue
}

type SanityImage = {
  asset?: {
    url?: string
  }
  alt?: LocalizedValue
}

export type SanityCollections = {
  products?: SanityProduct[]
  caseStudies?: SanityCaseStudy[]
  blogPosts?: SanityBlogPost[]
}

export const defaultLanguage: LanguageCode = 'pt'

export const languages: LanguageOption[] = [
  {code: 'pt', label: 'PT', name: 'Português'},
  {code: 'en', label: 'EN', name: 'English'},
  {code: 'es', label: 'ES', name: 'Español'},
]

export const supportedLanguages = new Set<LanguageCode>(languages.map((language) => language.code))

export const getLanguage = (value: string | null): LanguageCode => {
  if (value && supportedLanguages.has(value as LanguageCode)) return value as LanguageCode
  return defaultLanguage
}

const contact = {
  email: 'informacoes@dafabrica4you.pt',
  phone: '+351 914 746 637',
}

const fallbackImages = {
  product: {
    url: '/images/product-materials.png',
    alt: 'Perfis e superfícies em plástico reciclado num espaço exterior premium.',
  },
  caseStudy: {
    url: '/images/case-installation.png',
    alt: 'Instalação exterior com decking, mobiliário e floreiras em plástico reciclado.',
  },
  blog: {
    url: '/images/blog-editorial.png',
    alt: 'Materiais reciclados, amostras e notas editoriais sobre sustentabilidade.',
  },
} satisfies Record<string, ContentImage>

const productCategories = {
  pt: [
    {
      title: 'Decking, pavimentos e passadiços',
      slug: 'decking-pavimentos-passadicos',
      summary: 'Superfícies exteriores em plástico reciclado para circulação, zonas húmidas e espaços de lazer.',
      description:
        'Uma alternativa à madeira para decks, passadiços, rampas e zonas de permanência onde a resistência à humidade e a baixa manutenção contam.',
      features: ['Resistente à humidade', 'Sem farpas', 'Baixa manutenção'],
      applications: ['Jardins privados', 'Piscinas', 'Parques', 'Frentes ribeirinhas'],
    },
    {
      title: 'Vedações, divisórias e resguardos',
      slug: 'vedacoes-divisorias-resguardos',
      summary: 'Perfis para delimitar, proteger e organizar espaços exteriores com um material durável.',
      description:
        'Soluções para vedações, divisórias de terreno, resguardos de ecopontos e proteção de zonas técnicas.',
      features: ['Não apodrece', 'Não exige pintura recorrente', 'Adequado a uso exterior'],
      applications: ['Condomínios', 'Autarquias', 'Quintas', 'Zonas técnicas'],
    },
    {
      title: 'Mobiliário urbano e jardim',
      slug: 'mobiliario-urbano-jardim',
      summary: 'Bancos, mesas, floreiras e peças para utilização intensiva em espaços públicos ou privados.',
      description:
        'Equipamentos robustos para locais onde a durabilidade, a limpeza simples e a presença discreta são decisivas.',
      features: ['Uso intensivo', 'Limpeza simples', 'Aspeto cuidado'],
      applications: ['Escolas', 'Jardins', 'Municípios', 'Empresas'],
    },
    {
      title: 'Abrigos, telheiros e pérgolas',
      slug: 'abrigos-telheiros-pergolas',
      summary: 'Estruturas exteriores para sombra, proteção e organização com perfis em plástico reciclado.',
      description:
        'Produtos para criar zonas de apoio e permanência sem depender da manutenção típica da madeira tradicional.',
      features: ['Estrutura personalizável', 'Boa resposta ao clima', 'Aplicação à medida'],
      applications: ['Pátios', 'Entradas', 'Parques', 'Equipamentos públicos'],
    },
    {
      title: 'Compostores, caixas de cultivo e bordaduras',
      slug: 'compostores-cultivo-bordaduras',
      summary: 'Soluções para agricultura, compostagem e organização de canteiros em material reciclado.',
      description:
        'Peças pensadas para hortas, compostagem urbana, caixas de cultivo e separação limpa de zonas verdes.',
      features: ['Contacto exterior prolongado', 'Fácil lavagem', 'Material reciclado'],
      applications: ['Hortas urbanas', 'Escolas', 'Municípios', 'Jardins domésticos'],
    },
  ],
  en: [
    {
      title: 'Decking, flooring and walkways',
      slug: 'decking-pavimentos-passadicos',
      summary: 'Outdoor recycled-plastic surfaces for circulation, wet areas and leisure spaces.',
      description:
        'An alternative to timber for decks, walkways, ramps and outdoor areas where moisture resistance and low maintenance matter.',
      features: ['Moisture resistant', 'No splinters', 'Low maintenance'],
      applications: ['Private gardens', 'Pools', 'Parks', 'Riverfront areas'],
    },
    {
      title: 'Fencing, dividers and screens',
      slug: 'vedacoes-divisorias-resguardos',
      summary: 'Profiles to define, protect and organize outdoor spaces with a durable material.',
      description:
        'Solutions for fences, land dividers, recycling-point screens and technical-area protection.',
      features: ['Does not rot', 'No recurring painting', 'Suitable for outdoor use'],
      applications: ['Condominiums', 'Municipalities', 'Farms', 'Technical zones'],
    },
    {
      title: 'Urban and garden furniture',
      slug: 'mobiliario-urbano-jardim',
      summary: 'Benches, tables, planters and pieces for intensive use in public or private spaces.',
      description:
        'Robust equipment for places where durability, simple cleaning and a quiet visual presence matter.',
      features: ['Intensive use', 'Simple cleaning', 'Considered appearance'],
      applications: ['Schools', 'Gardens', 'Municipalities', 'Companies'],
    },
    {
      title: 'Shelters, canopies and pergolas',
      slug: 'abrigos-telheiros-pergolas',
      summary: 'Outdoor structures for shade, protection and organization using recycled-plastic profiles.',
      description:
        'Products that create support and stay areas without the maintenance routine of traditional timber.',
      features: ['Customizable structure', 'Weather responsive', 'Made-to-measure application'],
      applications: ['Patios', 'Entrances', 'Parks', 'Public facilities'],
    },
    {
      title: 'Composters, grow boxes and borders',
      slug: 'compostores-cultivo-bordaduras',
      summary: 'Solutions for agriculture, composting and garden organization in recycled material.',
      description:
        'Pieces designed for vegetable gardens, urban composting, grow boxes and clean separation of green areas.',
      features: ['Long outdoor contact', 'Easy washing', 'Recycled material'],
      applications: ['Urban gardens', 'Schools', 'Municipalities', 'Home gardens'],
    },
  ],
  es: [
    {
      title: 'Tarimas, pavimentos y pasarelas',
      slug: 'decking-pavimentos-passadicos',
      summary: 'Superficies exteriores de plástico reciclado para circulación, zonas húmedas y ocio.',
      description:
        'Una alternativa a la madera para tarimas, pasarelas, rampas y zonas exteriores donde importan la humedad y el bajo mantenimiento.',
      features: ['Resistente a la humedad', 'Sin astillas', 'Bajo mantenimiento'],
      applications: ['Jardines privados', 'Piscinas', 'Parques', 'Frentes fluviales'],
    },
    {
      title: 'Vallas, divisorias y resguardos',
      slug: 'vedacoes-divisorias-resguardos',
      summary: 'Perfiles para delimitar, proteger y organizar espacios exteriores con material duradero.',
      description:
        'Soluciones para vallas, divisorias de terreno, resguardos de ecopuntos y protección de zonas técnicas.',
      features: ['No se pudre', 'Sin pintura recurrente', 'Adecuado para exterior'],
      applications: ['Condominios', 'Municipios', 'Fincas', 'Zonas técnicas'],
    },
    {
      title: 'Mobiliario urbano y jardín',
      slug: 'mobiliario-urbano-jardim',
      summary: 'Bancos, mesas, jardineras y piezas para uso intensivo en espacios públicos o privados.',
      description:
        'Equipamientos robustos para lugares donde la durabilidad, la limpieza sencilla y una presencia discreta son decisivas.',
      features: ['Uso intensivo', 'Limpieza sencilla', 'Aspecto cuidado'],
      applications: ['Escuelas', 'Jardines', 'Municipios', 'Empresas'],
    },
    {
      title: 'Refugios, cubiertas y pérgolas',
      slug: 'abrigos-telheiros-pergolas',
      summary: 'Estructuras exteriores para sombra, protección y organización con perfiles de plástico reciclado.',
      description:
        'Productos para crear zonas de apoyo y estancia sin depender del mantenimiento típico de la madera tradicional.',
      features: ['Estructura personalizable', 'Buena respuesta al clima', 'Aplicación a medida'],
      applications: ['Patios', 'Entradas', 'Parques', 'Equipamientos públicos'],
    },
    {
      title: 'Compostadores, cajas de cultivo y borduras',
      slug: 'compostores-cultivo-bordaduras',
      summary: 'Soluciones para agricultura, compostaje y organización de canteros en material reciclado.',
      description:
        'Piezas pensadas para huertos, compostaje urbano, cajas de cultivo y separación limpia de zonas verdes.',
      features: ['Contacto exterior prolongado', 'Lavado fácil', 'Material reciclado'],
      applications: ['Huertos urbanos', 'Escuelas', 'Municipios', 'Jardines domésticos'],
    },
  ],
} satisfies Record<LanguageCode, ProductItem[]>

const caseStudies = {
  pt: [
    {
      title: 'Vedação de piscina sem manutenção recorrente',
      slug: 'vedacao-piscina-moita',
      location: 'Moita',
      summary:
        'Uma vedação de madeira com problemas de conservação deu lugar a uma solução em plástico reciclado.',
      challenge: 'A vedação original exigia conservação frequente e já não respondia bem ao uso diário.',
      solution: 'Construção de uma vedação em perfis reciclados para proteger a zona da piscina.',
      result: 'Menos manutenção, mais segurança e uma solução exterior preparada para uso prolongado.',
      productArea: 'Vedações',
    },
    {
      title: 'Decking e mobiliário junto ao rio',
      slug: 'decking-mobiliario-torres-mondego',
      location: 'Torres do Mondego',
      summary:
        'Instalação de decking e mobiliário urbano em zona de areia junto ao rio para uma Junta de Freguesia.',
      challenge: 'Criar uma zona de estadia resistente numa envolvente húmida e exigente.',
      solution: 'Aplicação de decking e mobiliário urbano em plástico reciclado.',
      result: 'Espaço público mais utilizável, com material pensado para exterior e manutenção reduzida.',
      productArea: 'Decking e mobiliário urbano',
    },
    {
      title: 'Floreiras no último piso',
      slug: 'floreiras-moscavide',
      location: 'Moscavide',
      summary:
        'Oitenta metros de floreiras instaladas no último piso de uma habitação com trabalho de detalhe.',
      challenge: 'Executar uma solução à medida com muitos recortes e integração cuidada no edifício.',
      solution: 'Produção e instalação de floreiras em perfis de plástico reciclado.',
      result: 'Uma intervenção precisa, durável e com presença discreta no espaço exterior.',
      productArea: 'Floreiras',
    },
  ],
  en: [
    {
      title: 'Pool fence without recurring maintenance',
      slug: 'vedacao-piscina-moita',
      location: 'Moita',
      summary: 'A timber fence with conservation issues was replaced by a recycled-plastic solution.',
      challenge: 'The original fence required frequent care and no longer responded well to daily use.',
      solution: 'Construction of a recycled-profile fence to protect the pool area.',
      result: 'Less maintenance, more safety and an outdoor solution prepared for long-term use.',
      productArea: 'Fencing',
    },
    {
      title: 'Decking and furniture by the river',
      slug: 'decking-mobiliario-torres-mondego',
      location: 'Torres do Mondego',
      summary: 'Decking and urban furniture installed on sand by the river for a local council.',
      challenge: 'Create a resistant stay area in a humid and demanding setting.',
      solution: 'Application of recycled-plastic decking and urban furniture.',
      result: 'A more usable public space with material designed for outdoor use and reduced maintenance.',
      productArea: 'Decking and urban furniture',
    },
    {
      title: 'Planters on a top floor',
      slug: 'floreiras-moscavide',
      location: 'Moscavide',
      summary: 'Eighty meters of planters installed on a residential top floor with detailed custom work.',
      challenge: 'Execute a made-to-measure solution with many cuts and careful building integration.',
      solution: 'Production and installation of planters using recycled-plastic profiles.',
      result: 'A precise, durable intervention with a quiet outdoor presence.',
      productArea: 'Planters',
    },
  ],
  es: [
    {
      title: 'Valla de piscina sin mantenimiento recurrente',
      slug: 'vedacao-piscina-moita',
      location: 'Moita',
      summary: 'Una valla de madera con problemas de conservación fue sustituida por plástico reciclado.',
      challenge: 'La valla original exigía cuidados frecuentes y ya no respondía bien al uso diario.',
      solution: 'Construcción de una valla con perfiles reciclados para proteger la zona de piscina.',
      result: 'Menos mantenimiento, más seguridad y una solución exterior preparada para uso prolongado.',
      productArea: 'Vallas',
    },
    {
      title: 'Tarima y mobiliario junto al río',
      slug: 'decking-mobiliario-torres-mondego',
      location: 'Torres do Mondego',
      summary: 'Instalación de tarima y mobiliario urbano sobre arena junto al río para una junta local.',
      challenge: 'Crear una zona de estancia resistente en un entorno húmedo y exigente.',
      solution: 'Aplicación de tarima y mobiliario urbano de plástico reciclado.',
      result: 'Un espacio público más utilizable con material pensado para exterior y menor mantenimiento.',
      productArea: 'Tarima y mobiliario urbano',
    },
    {
      title: 'Jardineras en una última planta',
      slug: 'floreiras-moscavide',
      location: 'Moscavide',
      summary: 'Ochenta metros de jardineras instaladas en la última planta de una vivienda.',
      challenge: 'Ejecutar una solución a medida con muchos recortes e integración cuidada.',
      solution: 'Producción e instalación de jardineras con perfiles de plástico reciclado.',
      result: 'Una intervención precisa, duradera y discreta en el espacio exterior.',
      productArea: 'Jardineras',
    },
  ],
} satisfies Record<LanguageCode, CaseStudy[]>

const blogPosts = {
  pt: [
    {
      title: 'Porque a madeira e o metal nem sempre são a melhor resposta para mobiliário urbano',
      slug: 'mobiliario-urbano-madeira-metal',
      excerpt:
        'A decisão de material num espaço público deve equilibrar manutenção, durabilidade, limpeza e impacto ambiental.',
      publishedAt: '2026-01-12',
      category: 'Materiais',
      body:
        'Em espaços públicos, a escolha do material não termina no dia da instalação. Madeira e metal podem funcionar em muitos contextos, mas exigem manutenção, tratamentos e substituições que aumentam o custo real ao longo do tempo. O plástico reciclado entra como uma alternativa pragmática: retira resíduos do circuito de desperdício e cria peças preparadas para humidade, uso repetido e limpeza simples.',
    },
    {
      title: 'O que pedir antes de orçamentar um projeto em plástico reciclado',
      slug: 'pedido-orcamento-plastico-reciclado',
      excerpt:
        'Quantidade, aplicação, código postal e contexto de instalação aceleram uma resposta séria de orçamento.',
      publishedAt: '2025-11-20',
      category: 'Projetos',
      body:
        'Um bom orçamento começa com informação prática. Indique a aplicação pretendida, as quantidades aproximadas, o código postal de descarga, fotografias do local e qualquer constrangimento de instalação. Isto permite separar material, transporte e montagem, evitando respostas genéricas e melhorando a decisão do cliente.',
    },
    {
      title: 'Compostagem urbana: do resíduo orgânico ao equipamento certo',
      slug: 'compostagem-urbana-equipamento',
      excerpt:
        'Compostores e caixas de cultivo podem transformar educação ambiental em infraestrutura diária.',
      publishedAt: '2025-10-25',
      category: 'Ambiente',
      body:
        'A compostagem urbana precisa de equipamento resistente, lavável e simples de compreender. Quando escolas, municípios ou condomínios integram compostores e caixas de cultivo no espaço exterior, a sustentabilidade deixa de ser apenas mensagem e passa a ser uma rotina visível.',
    },
  ],
  en: [
    {
      title: 'Why timber and metal are not always the best answer for urban furniture',
      slug: 'mobiliario-urbano-madeira-metal',
      excerpt:
        'A public-space material decision should balance maintenance, durability, cleaning and environmental impact.',
      publishedAt: '2026-01-12',
      category: 'Materials',
      body:
        'In public spaces, the material decision does not end on installation day. Timber and metal can work in many settings, but they often require treatments, maintenance and replacement. Recycled plastic is a pragmatic alternative: it removes waste from circulation and creates pieces prepared for moisture, repeated use and simple cleaning.',
    },
    {
      title: 'What to prepare before requesting a recycled-plastic quote',
      slug: 'pedido-orcamento-plastico-reciclado',
      excerpt:
        'Quantities, intended use, postcode and installation context speed up a serious quote response.',
      publishedAt: '2025-11-20',
      category: 'Projects',
      body:
        'A useful quote starts with practical information. Share the intended use, approximate quantities, unloading postcode, photos of the place and any installation constraints. This helps separate material, transport and installation instead of producing a generic reply.',
    },
    {
      title: 'Urban composting: from organic waste to the right equipment',
      slug: 'compostagem-urbana-equipamento',
      excerpt:
        'Composters and grow boxes can turn environmental education into daily infrastructure.',
      publishedAt: '2025-10-25',
      category: 'Environment',
      body:
        'Urban composting needs equipment that is resistant, washable and easy to understand. When schools, municipalities or condominiums integrate composters and grow boxes outdoors, sustainability stops being only a message and becomes a visible routine.',
    },
  ],
  es: [
    {
      title: 'Por qué madera y metal no siempre son la mejor respuesta para mobiliario urbano',
      slug: 'mobiliario-urbano-madeira-metal',
      excerpt:
        'La decisión de material en espacio público debe equilibrar mantenimiento, durabilidad, limpieza e impacto ambiental.',
      publishedAt: '2026-01-12',
      category: 'Materiales',
      body:
        'En espacios públicos, la decisión de material no termina el día de la instalación. La madera y el metal pueden funcionar en muchos contextos, pero suelen exigir tratamientos, mantenimiento y sustituciones. El plástico reciclado entra como alternativa pragmática: retira residuos del circuito y crea piezas preparadas para humedad, uso repetido y limpieza sencilla.',
    },
    {
      title: 'Qué preparar antes de pedir presupuesto en plástico reciclado',
      slug: 'pedido-orcamento-plastico-reciclado',
      excerpt:
        'Cantidades, aplicación, código postal y contexto de instalación aceleran una respuesta seria.',
      publishedAt: '2025-11-20',
      category: 'Proyectos',
      body:
        'Un buen presupuesto empieza con información práctica. Indica la aplicación prevista, cantidades aproximadas, código postal de descarga, fotos del lugar y restricciones de instalación. Así se separan material, transporte y montaje con más claridad.',
    },
    {
      title: 'Compostaje urbano: del residuo orgánico al equipo adecuado',
      slug: 'compostagem-urbana-equipamento',
      excerpt:
        'Compostadores y cajas de cultivo convierten educación ambiental en infraestructura diaria.',
      publishedAt: '2025-10-25',
      category: 'Ambiente',
      body:
        'El compostaje urbano necesita equipos resistentes, lavables y fáciles de entender. Cuando escuelas, municipios o condominios integran compostadores y cajas de cultivo al exterior, la sostenibilidad deja de ser solo mensaje y se convierte en rutina visible.',
    },
  ],
} satisfies Record<LanguageCode, BlogPost[]>

export const fallbackContent: Record<LanguageCode, SiteContent> = {
  pt: {
    nav: {
      home: 'Início',
      about: 'Sobre',
      products: 'Produtos',
      catalogue: 'Catálogo',
      cases: 'Casos',
      blog: 'Blog',
      contact: 'Contacto',
    },
    common: {
      scroll: 'Scroll para explorar',
      readMore: 'Ler mais',
      requestQuote: 'Pedir orçamento',
      exploreProducts: 'Explorar produtos',
      viewCases: 'Ver casos',
      allProducts: 'Todos os produtos',
      latestPosts: 'Artigos recentes',
      challenge: 'Desafio',
      solution: 'Solução',
      result: 'Resultado',
      emailLabel: 'Email',
      phoneLabel: 'Telefone',
      featuresLabel: 'Características',
      applicationsLabel: 'Aplicações',
      backToProducts: 'Voltar aos produtos',
      backToCases: 'Voltar aos casos',
      searchProducts: 'Pesquisar produtos',
      searchCases: 'Pesquisar casos',
      searchPosts: 'Pesquisar artigos',
      searchPlaceholder: 'Escreva para filtrar',
      noResults: 'Sem resultados para esta pesquisa.',
      pageLabel: 'Página',
      previous: 'Anterior',
      next: 'Seguinte',
      zoomImage: 'Ampliar imagem',
      close: 'Fechar',
      contactEmail: contact.email,
      contactPhone: contact.phone,
    },
    home: {
      hero: {
        kicker: 'Madeira plástica com origem clara',
        title: 'Plástico reciclado para exteriores vivos',
        lead:
          'A DaFábrica4You transforma resíduos plásticos em soluções exteriores duráveis, laváveis e pensadas para pouca manutenção.',
      },
      intro: {
        kicker: 'Da preocupação à peça instalada',
        title: 'O material certo quando a madeira pede manutenção',
        lead:
          'Decks, vedações, floreiras, mobiliário urbano e peças à medida partem de uma ideia simples: usar melhor o plástico que já existe.',
      },
      impact: {
        title: 'Menos resíduo, menos manutenção',
        lead:
          'A empresa comunica impacto ambiental por tonelada transformada, mas o valor comercial também está no tempo que deixa de ser gasto em conservação.',
        stats: [
          {title: '25.000+', text: 'embalagens de uso único reaproveitadas por tonelada'},
          {title: '700 kg', text: 'de CO2 evitado por tonelada de material transformado'},
          {title: '2,5', text: 'árvores preservadas por comparação com alternativas tradicionais'},
        ],
      },
      manifesto: {
        quote:
          'Um primeiro contacto deve explicar depressa, inspirar com calma e deixar claro qual é o próximo passo.',
        attribution: 'Direção de experiência para este projeto',
      },
    },
    about: {
      hero: {
        kicker: 'O despertar para o problema',
        title: 'Do drama dos plásticos a produtos que duram',
        lead:
          'A marca nasce da vontade de reduzir plástico em aterros e no mar, substituindo parte do uso de madeira por produtos em plástico reciclado.',
      },
      timeline: [
        {
          title: '2011',
          text: 'A consciência do problema nasce após contacto com dados sobre abate de árvores, crescimento do consumo de plástico e impacto nos ecossistemas marinhos.',
        },
        {
          title: '2018',
          text: 'O sonho torna-se empresa com uma equipa multidisciplinar focada em produtos ambientalmente responsáveis.',
        },
        {
          title: 'Hoje',
          text: 'A empresa produz soluções para espaços privados, municípios, agricultura, mobiliário urbano e projetos à medida.',
        },
      ],
      principles: [
        {title: 'Sem excesso', text: 'Informação direta, útil e organizada para quem precisa decidir.'},
        {title: 'Com presença', text: 'Design premium sem transformar a navegação numa demonstração de efeitos.'},
        {title: 'Com prova', text: 'Produtos, casos e blog funcionam como evidência viva da capacidade da empresa.'},
      ],
    },
    productsPage: {
      hero: {
        kicker: 'Produtos',
        title: 'Soluções para exterior que não querem manutenção constante',
        lead:
          'Da sinalética aos decks, das floreiras aos resguardos, os produtos partem da mesma lógica: plástico reciclado aplicado com sentido prático.',
      },
      lead:
        'Escolha a aplicação que mais se aproxima do seu projeto e avance para uma página com usos, vantagens e pedido de orçamento.',
    },
    catalogue: {
      hero: {
        kicker: 'Catálogo e orçamento',
        title: 'Preço sério começa com contexto',
        lead:
          'Em vez de uma tabela quebrada, o site deve transformar o pedido de catálogo numa conversa objetiva sobre quantidades, transporte e aplicação.',
      },
      quoteFlow: [
        {title: 'Aplicação', text: 'Produto pretendido, local de uso e objetivo da solução.'},
        {title: 'Quantidades', text: 'Metros lineares, área, número de peças ou uma estimativa inicial.'},
        {title: 'Descarga', text: 'Código postal e condições de acesso para calcular transporte.'},
        {title: 'Resposta', text: 'Catálogo, alternativa recomendada e orçamento por material, transporte e montagem.'},
      ],
      estimate: {
        kicker: 'Como o orçamento é formado',
        title: 'O preço muda quando muda o projeto',
        lead:
          'A página deve ajudar o visitante a pedir um valor sério sem fingir que uma tabela genérica resolve transporte, corte, montagem e contexto de instalação.',
        cards: [
          {title: 'Material', text: 'Tipo de produto, perfil, cor, acabamento e quantidade aproximada.'},
          {title: 'Logística', text: 'Código postal, descarga, acessos e volume a transportar.'},
          {title: 'Montagem', text: 'Instalação simples, obra à medida, recortes, fixações ou preparação do local.'},
        ],
        checklistTitle: 'Enviar logo no primeiro contacto',
        checklist: ['Produto ou aplicação', 'Medidas ou quantidades', 'Código postal', 'Fotografias do local'],
      },
      note:
        'A empresa comunica que tem mais de 2000 produtos; quando o cliente não encontra o que precisa, o caminho certo é pedir orçamento.',
    },
    casesPage: {
      hero: {
        kicker: 'Casos de estudo',
        title: 'Projetos que mostram o material em uso real',
        lead:
          'Casos curtos e objetivos para perceber o problema, a solução aplicada e o resultado no espaço.',
      },
    },
    blogPage: {
      hero: {
        kicker: 'Blog ambiental',
        title: 'Conteúdo que vende ensinando',
        lead:
          'O blog deve responder a dúvidas reais sobre resíduos, madeira plástica, compostagem, manutenção e decisão de materiais.',
      },
      newsletter: {
        kicker: 'Newsletter',
        title: 'Temas de ambiente, projetos e manutenção',
        lead:
          'Um convite simples para continuar a relação depois da primeira visita.',
      },
    },
    contactPage: {
      hero: {
        kicker: 'Contacto',
        title: 'Conte-nos o espaço, nós ajudamos a escolher o caminho',
        lead:
          'Para acelerar resposta, envie objetivo, quantidades aproximadas, código postal e fotografias do local.',
      },
      fields: ['Nome', 'Email', 'Telefone', 'Código postal', 'Localidade', 'Mensagem'],
    },
    footer: {
      line: 'Ambientalmente responsável. Feito para durar.',
      note: 'Website em preparação.',
    },
    products: productCategories.pt,
    caseStudies: caseStudies.pt,
    blogPosts: blogPosts.pt,
  },
  en: {
    nav: {
      home: 'Home',
      about: 'About',
      products: 'Products',
      catalogue: 'Catalogue',
      cases: 'Cases',
      blog: 'Blog',
      contact: 'Contact',
    },
    common: {
      scroll: 'Scroll to explore',
      readMore: 'Read more',
      requestQuote: 'Request a quote',
      exploreProducts: 'Explore products',
      viewCases: 'View cases',
      allProducts: 'All products',
      latestPosts: 'Latest posts',
      challenge: 'Challenge',
      solution: 'Solution',
      result: 'Result',
      emailLabel: 'Email',
      phoneLabel: 'Phone',
      featuresLabel: 'Features',
      applicationsLabel: 'Applications',
      backToProducts: 'Back to products',
      backToCases: 'Back to cases',
      searchProducts: 'Search products',
      searchCases: 'Search cases',
      searchPosts: 'Search posts',
      searchPlaceholder: 'Type to filter',
      noResults: 'No results for this search.',
      pageLabel: 'Page',
      previous: 'Previous',
      next: 'Next',
      zoomImage: 'Zoom image',
      close: 'Close',
      contactEmail: contact.email,
      contactPhone: contact.phone,
    },
    home: {
      hero: {
        kicker: 'Recycled plastic with a clear origin',
        title: 'Recycled plastic for living outdoor spaces',
        lead:
          'DaFábrica4You turns plastic waste into durable, washable outdoor solutions designed for low maintenance.',
      },
      intro: {
        kicker: 'From concern to installed product',
        title: 'The right material when timber asks for maintenance',
        lead:
          'Decking, fencing, planters, urban furniture and custom pieces start from one practical idea: use existing plastic better.',
      },
      impact: {
        title: 'Less waste, less maintenance',
        lead:
          'The company communicates environmental impact per transformed tonne, but the commercial value also lives in the time no longer spent on upkeep.',
        stats: [
          {title: '25,000+', text: 'single-use packages reused per tonne'},
          {title: '700 kg', text: 'of CO2 avoided per tonne of transformed material'},
          {title: '2.5', text: 'trees preserved compared with traditional alternatives'},
        ],
      },
      manifesto: {
        quote:
          'A first contact should explain quickly, inspire calmly and make the next step obvious.',
        attribution: 'Experience direction for this project',
      },
    },
    about: {
      hero: {
        kicker: 'Awakening to the problem',
        title: 'From plastic concern to durable products',
        lead:
          'The brand begins with the wish to reduce plastic in landfills and the sea, replacing part of timber use with recycled-plastic products.',
      },
      timeline: [
        {title: '2011', text: 'Awareness grows through data on tree felling, plastic consumption and marine impact.'},
        {title: '2018', text: 'The idea becomes a company with a multidisciplinary team focused on responsible products.'},
        {title: 'Today', text: 'The company produces solutions for private spaces, municipalities, agriculture, urban furniture and custom projects.'},
      ],
      principles: [
        {title: 'No excess', text: 'Direct, useful and organized information for people who need to decide.'},
        {title: 'With presence', text: 'Premium design without turning navigation into an effects demo.'},
        {title: 'With proof', text: 'Products, cases and blog posts become living evidence of capability.'},
      ],
    },
    productsPage: {
      hero: {
        kicker: 'Products',
        title: 'Outdoor solutions that avoid constant maintenance',
        lead:
          'From signage to decking, from planters to screens, the product logic is the same: recycled plastic applied with practical sense.',
      },
      lead:
        'Choose the application closest to your project and move into a page with uses, advantages and quote context.',
    },
    catalogue: {
      hero: {
        kicker: 'Catalogue and quote',
        title: 'A serious price starts with context',
        lead:
          'Instead of a broken price table, the website turns the catalogue request into a clear conversation about quantity, transport and application.',
      },
      quoteFlow: [
        {title: 'Application', text: 'Desired product, use location and goal.'},
        {title: 'Quantities', text: 'Linear meters, area, piece count or an initial estimate.'},
        {title: 'Delivery', text: 'Postcode and access conditions to estimate transport.'},
        {title: 'Response', text: 'Catalogue, recommended alternative and quote split by material, transport and installation.'},
      ],
      estimate: {
        kicker: 'How quotes are shaped',
        title: 'The price changes when the project changes',
        lead:
          'This page should help visitors request a serious number without pretending a generic table can solve transport, cutting, installation and site context.',
        cards: [
          {title: 'Material', text: 'Product type, profile, colour, finish and approximate quantity.'},
          {title: 'Logistics', text: 'Postcode, unloading conditions, access and transport volume.'},
          {title: 'Installation', text: 'Simple placement, custom work, cuts, fixing systems or site preparation.'},
        ],
        checklistTitle: 'Send this in the first contact',
        checklist: ['Product or application', 'Measurements or quantities', 'Postcode', 'Photos of the site'],
      },
      note:
        'The company communicates more than 2000 products; when visitors cannot find what they need, the right next step is requesting a quote.',
    },
    casesPage: {
      hero: {
        kicker: 'Case studies',
        title: 'Projects that show the material in real use',
        lead: 'Short, useful cases showing the problem, the applied solution and the result in place.',
      },
    },
    blogPage: {
      hero: {
        kicker: 'Environmental blog',
        title: 'Content that sells by teaching',
        lead:
          'The blog should answer real questions about waste, recycled-plastic timber, composting, maintenance and material choice.',
      },
      newsletter: {
        kicker: 'Newsletter',
        title: 'Environment, projects and maintenance',
        lead: 'A simple invitation to continue the relationship after the first visit.',
      },
    },
    contactPage: {
      hero: {
        kicker: 'Contact',
        title: 'Tell us about the space; we help choose the path',
        lead:
          'To speed up the answer, send the goal, approximate quantities, postcode and photos of the place.',
      },
      fields: ['Name', 'Email', 'Phone', 'Postcode', 'Location', 'Message'],
    },
    footer: {
      line: 'Environmentally responsible. Made to last.',
      note: 'Website in preparation.',
    },
    products: productCategories.en,
    caseStudies: caseStudies.en,
    blogPosts: blogPosts.en,
  },
  es: {
    nav: {
      home: 'Inicio',
      about: 'Sobre',
      products: 'Productos',
      catalogue: 'Catálogo',
      cases: 'Casos',
      blog: 'Blog',
      contact: 'Contacto',
    },
    common: {
      scroll: 'Scroll para explorar',
      readMore: 'Leer más',
      requestQuote: 'Pedir presupuesto',
      exploreProducts: 'Explorar productos',
      viewCases: 'Ver casos',
      allProducts: 'Todos los productos',
      latestPosts: 'Artículos recientes',
      challenge: 'Desafío',
      solution: 'Solución',
      result: 'Resultado',
      emailLabel: 'Email',
      phoneLabel: 'Teléfono',
      featuresLabel: 'Características',
      applicationsLabel: 'Aplicaciones',
      backToProducts: 'Volver a productos',
      backToCases: 'Volver a casos',
      searchProducts: 'Buscar productos',
      searchCases: 'Buscar casos',
      searchPosts: 'Buscar artículos',
      searchPlaceholder: 'Escribe para filtrar',
      noResults: 'Sin resultados para esta búsqueda.',
      pageLabel: 'Página',
      previous: 'Anterior',
      next: 'Siguiente',
      zoomImage: 'Ampliar imagen',
      close: 'Cerrar',
      contactEmail: contact.email,
      contactPhone: contact.phone,
    },
    home: {
      hero: {
        kicker: 'Plástico reciclado con origen claro',
        title: 'Plástico reciclado para exteriores vivos',
        lead:
          'DaFábrica4You transforma residuos plásticos en soluciones exteriores duraderas, lavables y pensadas para bajo mantenimiento.',
      },
      intro: {
        kicker: 'De la preocupación a la pieza instalada',
        title: 'El material correcto cuando la madera pide mantenimiento',
        lead:
          'Tarimas, vallas, jardineras, mobiliario urbano y piezas a medida parten de una idea práctica: usar mejor el plástico que ya existe.',
      },
      impact: {
        title: 'Menos residuo, menos mantenimiento',
        lead:
          'La empresa comunica impacto ambiental por tonelada transformada, pero el valor comercial también está en el tiempo que deja de gastarse en conservación.',
        stats: [
          {title: '25.000+', text: 'envases de un solo uso reutilizados por tonelada'},
          {title: '700 kg', text: 'de CO2 evitado por tonelada de material transformado'},
          {title: '2,5', text: 'árboles preservados frente a alternativas tradicionales'},
        ],
      },
      manifesto: {
        quote:
          'Un primer contacto debe explicar rápido, inspirar con calma y dejar claro el siguiente paso.',
        attribution: 'Dirección de experiencia para este proyecto',
      },
    },
    about: {
      hero: {
        kicker: 'Despertar ante el problema',
        title: 'Del problema del plástico a productos duraderos',
        lead:
          'La marca nace del deseo de reducir plástico en vertederos y en el mar, sustituyendo parte del uso de madera por plástico reciclado.',
      },
      timeline: [
        {title: '2011', text: 'La conciencia del problema crece con datos sobre tala de árboles, consumo de plástico e impacto marino.'},
        {title: '2018', text: 'La idea se convierte en empresa con un equipo multidisciplinar centrado en productos responsables.'},
        {title: 'Hoy', text: 'La empresa produce soluciones para espacios privados, municipios, agricultura, mobiliario urbano y proyectos a medida.'},
      ],
      principles: [
        {title: 'Sin exceso', text: 'Información directa, útil y organizada para quien necesita decidir.'},
        {title: 'Con presencia', text: 'Diseño premium sin convertir la navegación en una demo de efectos.'},
        {title: 'Con prueba', text: 'Productos, casos y blog actúan como evidencia viva de capacidad.'},
      ],
    },
    productsPage: {
      hero: {
        kicker: 'Productos',
        title: 'Soluciones exteriores sin mantenimiento constante',
        lead:
          'Desde señalética hasta tarimas, jardineras o resguardos, la lógica es la misma: plástico reciclado aplicado con sentido práctico.',
      },
      lead:
        'Elige la aplicación más cercana a tu proyecto y entra en una página con usos, ventajas y contexto de presupuesto.',
    },
    catalogue: {
      hero: {
        kicker: 'Catálogo y presupuesto',
        title: 'Un precio serio empieza con contexto',
        lead:
          'En lugar de una tabla rota, el sitio convierte la solicitud de catálogo en una conversación clara sobre cantidades, transporte y aplicación.',
      },
      quoteFlow: [
        {title: 'Aplicación', text: 'Producto deseado, lugar de uso y objetivo.'},
        {title: 'Cantidades', text: 'Metros lineales, área, número de piezas o estimación inicial.'},
        {title: 'Descarga', text: 'Código postal y condiciones de acceso para estimar transporte.'},
        {title: 'Respuesta', text: 'Catálogo, alternativa recomendada y presupuesto por material, transporte y montaje.'},
      ],
      estimate: {
        kicker: 'Cómo se forma el presupuesto',
        title: 'El precio cambia cuando cambia el proyecto',
        lead:
          'La página debe ayudar a pedir un valor serio sin fingir que una tabla genérica resuelve transporte, cortes, montaje y contexto de instalación.',
        cards: [
          {title: 'Material', text: 'Tipo de producto, perfil, color, acabado y cantidad aproximada.'},
          {title: 'Logística', text: 'Código postal, descarga, accesos y volumen a transportar.'},
          {title: 'Montaje', text: 'Instalación simple, obra a medida, cortes, fijaciones o preparación del lugar.'},
        ],
        checklistTitle: 'Enviar en el primer contacto',
        checklist: ['Producto o aplicación', 'Medidas o cantidades', 'Código postal', 'Fotos del lugar'],
      },
      note:
        'La empresa comunica más de 2000 productos; cuando el visitante no encuentra lo que necesita, el camino correcto es pedir presupuesto.',
    },
    casesPage: {
      hero: {
        kicker: 'Casos de estudio',
        title: 'Proyectos que muestran el material en uso real',
        lead: 'Casos cortos y útiles que muestran el problema, la solución aplicada y el resultado en el espacio.',
      },
    },
    blogPage: {
      hero: {
        kicker: 'Blog ambiental',
        title: 'Contenido que vende enseñando',
        lead:
          'El blog debe responder dudas reales sobre residuos, madera plástica, compostaje, mantenimiento y elección de materiales.',
      },
      newsletter: {
        kicker: 'Newsletter',
        title: 'Ambiente, proyectos y mantenimiento',
        lead: 'Una invitación sencilla para continuar la relación después de la primera visita.',
      },
    },
    contactPage: {
      hero: {
        kicker: 'Contacto',
        title: 'Cuéntanos el espacio; ayudamos a elegir el camino',
        lead:
          'Para acelerar la respuesta, envía objetivo, cantidades aproximadas, código postal y fotos del lugar.',
      },
      fields: ['Nombre', 'Email', 'Teléfono', 'Código postal', 'Localidad', 'Mensaje'],
    },
    footer: {
      line: 'Ambientalmente responsable. Hecho para durar.',
      note: 'Sitio web en preparación.',
    },
    products: productCategories.es,
    caseStudies: caseStudies.es,
    blogPosts: blogPosts.es,
  },
}

const localized = (value: LocalizedValue | undefined, language: LanguageCode, fallback: string) =>
  value?.[language]?.trim() || fallback

export const imageFor = (item: {image?: ContentImage}, fallback: ContentImage) => item.image ?? fallback

export const productImagesFor = (item: ProductItem, fallback: ContentImage) => {
  if (item.images?.length) return item.images
  if (item.image) return [item.image]
  return [fallback]
}

export const caseStudyImagesFor = (item: CaseStudy, fallback: ContentImage) => {
  if (item.images?.length) return item.images
  if (item.image) return [item.image]
  return [fallback]
}

export const productImageFallback = fallbackImages.product
export const caseStudyImageFallback = fallbackImages.caseStudy
export const blogImageFallback = fallbackImages.blog

const imageFromSanity = (
  image: SanityImage | undefined,
  language: LanguageCode,
  fallback: ContentImage,
): ContentImage => ({
  url: image?.asset?.url || fallback.url,
  alt: localized(image?.alt, language, fallback.alt),
})

const imagesFromSanity = (
  mainImage: SanityImage | undefined,
  gallery: SanityImage[] | undefined,
  language: LanguageCode,
  fallback: ContentImage,
) => {
  const images = [mainImage, ...(gallery ?? [])]
    .filter((image): image is SanityImage => Boolean(image?.asset?.url))
    .map((image) => imageFromSanity(image, language, fallback))

  return images.length ? images : [fallback]
}

const localizedList = (
  items: LocalizedValue[] | undefined,
  language: LanguageCode,
  fallback: string[],
) => {
  if (!items?.length) return fallback
  return items.map((item, index) => localized(item, language, fallback[index] ?? '')).filter(Boolean)
}

const productsFromSanity = (
  products: SanityProduct[] | undefined,
  language: LanguageCode,
  fallback: ProductItem[],
) => {
  if (!products?.length) return fallback

  return products
    .filter((product) => product.slug?.current)
    .map((product, index) => ({
      title: localized(product.title, language, fallback[index]?.title ?? 'Product'),
      slug: product.slug?.current ?? fallback[index]?.slug ?? `product-${index + 1}`,
      image: imageFromSanity(product.image, language, fallback[index]?.image ?? fallbackImages.product),
      images: imagesFromSanity(
        product.image,
        product.gallery,
        language,
        fallback[index]?.image ?? fallbackImages.product,
      ),
      summary: localized(product.summary, language, fallback[index]?.summary ?? ''),
      description: localized(product.description, language, fallback[index]?.description ?? ''),
      features: localizedList(product.features, language, fallback[index]?.features ?? []),
      applications: localizedList(product.applications, language, fallback[index]?.applications ?? []),
    }))
}

const casesFromSanity = (
  cases: SanityCaseStudy[] | undefined,
  language: LanguageCode,
  fallback: CaseStudy[],
) => {
  if (!cases?.length) return fallback

  return cases
    .filter((item) => item.slug?.current)
    .map((item, index) => ({
      title: localized(item.title, language, fallback[index]?.title ?? 'Case study'),
      slug: item.slug?.current ?? fallback[index]?.slug ?? `case-${index + 1}`,
      image: imageFromSanity(item.image, language, fallback[index]?.image ?? fallbackImages.caseStudy),
      images: imagesFromSanity(
        item.image,
        item.gallery,
        language,
        fallback[index]?.image ?? fallbackImages.caseStudy,
      ),
      location: item.location?.trim() || fallback[index]?.location || '',
      summary: localized(item.summary, language, fallback[index]?.summary ?? ''),
      challenge: localized(item.challenge, language, fallback[index]?.challenge ?? ''),
      solution: localized(item.solution, language, fallback[index]?.solution ?? ''),
      result: localized(item.result, language, fallback[index]?.result ?? ''),
      productArea: localized(item.productArea, language, fallback[index]?.productArea ?? ''),
    }))
}

const postsFromSanity = (
  posts: SanityBlogPost[] | undefined,
  language: LanguageCode,
  fallback: BlogPost[],
) => {
  if (!posts?.length) return fallback

  return posts
    .filter((post) => post.slug?.current)
    .map((post, index) => ({
      title: localized(post.title, language, fallback[index]?.title ?? 'Blog post'),
      slug: post.slug?.current ?? fallback[index]?.slug ?? `post-${index + 1}`,
      image: imageFromSanity(post.image, language, fallback[index]?.image ?? fallbackImages.blog),
      excerpt: localized(post.excerpt, language, fallback[index]?.excerpt ?? ''),
      publishedAt: post.publishedAt?.trim() || fallback[index]?.publishedAt || '',
      category: localized(post.category, language, fallback[index]?.category ?? ''),
      body: localized(post.body, language, fallback[index]?.body ?? ''),
    }))
}

export const contentFromSanity = (collections: SanityCollections | null): Record<LanguageCode, SiteContent> => {
  if (!collections) return fallbackContent

  const next = structuredClone(fallbackContent)

  for (const language of Object.keys(next) as LanguageCode[]) {
    next[language].products = productsFromSanity(collections.products, language, fallbackContent[language].products)
    next[language].caseStudies = casesFromSanity(
      collections.caseStudies,
      language,
      fallbackContent[language].caseStudies,
    )
    next[language].blogPosts = postsFromSanity(collections.blogPosts, language, fallbackContent[language].blogPosts)
  }

  return next
}
