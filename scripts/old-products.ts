// Reviewable, trilingual product data migrated from the old Webnode site.
// One entry per old "PRODUTOS" menu category (each = one productCategory document).
// Copy is lightly enriched but claim-faithful: it only states the brand's real
// material properties (100% recycled plastic, rot-proof, maintenance-free, weather
// resistant). No invented specifications, dimensions or prices. Gallery image URLs
// live in scripts/product-images.json (keyed by slug) and are merged at import time.

export type LocalizedValue = {pt: string; en: string; es: string}

export type OldProduct = {
  slug: string
  sourceUrl: string
  orderRank: number
  title: LocalizedValue
  summary: LocalizedValue
  description: LocalizedValue
  features: LocalizedValue[]
  applications: LocalizedValue[]
}

const f = {
  recycled: {pt: '100% plástico reciclado', en: '100% recycled plastic', es: '100% plástico reciclado'},
  noRot: {pt: 'Não apodrece', en: 'Rot-proof', es: 'No se pudre'},
  noMaintenance: {pt: 'Sem manutenção', en: 'Maintenance-free', es: 'Sin mantenimiento'},
  water: {pt: 'Resistente à água', en: 'Water-resistant', es: 'Resistente al agua'},
  uv: {pt: 'Resistente aos UV', en: 'UV-resistant', es: 'Resistente a los UV'},
  noPaint: {pt: 'Não precisa de pintura', en: 'No painting needed', es: 'Sin pintura'},
  durable: {pt: 'Longa duração', en: 'Long-lasting', es: 'Larga duración'},
} satisfies Record<string, LocalizedValue>

export const oldProducts: OldProduct[] = [
  {
    slug: 'paineis-para-entrada-de-localidades',
    sourceUrl: 'https://www.dafabrica4you.pt/paineis-para-entrada-de-localidades/',
    orderRank: 10,
    title: {
      pt: 'Painéis para entrada de localidades',
      en: 'Town entrance panels',
      es: 'Paneles para entrada de localidades',
    },
    summary: {
      pt: 'Painéis de boas-vindas em plástico reciclado para a entrada de vilas, aldeias e localidades.',
      en: 'Recycled-plastic welcome panels for the entrance of towns and villages.',
      es: 'Paneles de bienvenida en plástico reciclado para la entrada de pueblos y localidades.',
    },
    description: {
      pt: 'Painéis de identificação e boas-vindas feitos em plástico 100% reciclado, pensados para assinalar a entrada de localidades. Resistem ao sol e à chuva sem apodrecer nem precisar de pintura, mantendo o aspeto durante anos ao ar livre.',
      en: 'Identification and welcome panels made from 100% recycled plastic, designed to mark the entrance to towns and villages. They withstand sun and rain without rotting or needing paint, keeping their look outdoors for years.',
      es: 'Paneles de identificación y bienvenida hechos en plástico 100% reciclado, pensados para señalar la entrada de localidades. Resisten el sol y la lluvia sin pudrirse ni necesitar pintura, manteniendo su aspecto durante años a la intemperie.',
    },
    features: [f.recycled, f.noRot, f.noMaintenance, f.uv],
    applications: [
      {pt: 'Autarquias', en: 'Municipalities', es: 'Ayuntamientos'},
      {pt: 'Juntas de freguesia', en: 'Parish councils', es: 'Juntas vecinales'},
      {pt: 'Aldeias e vilas', en: 'Villages and towns', es: 'Pueblos y villas'},
    ],
  },
  {
    slug: 'grelha-de-enrelvamento',
    sourceUrl: 'https://www.dafabrica4you.pt/grelha-de-enrelvamento/',
    orderRank: 20,
    title: {pt: 'Grelha de enrelvamento', en: 'Grass-reinforcement grid', es: 'Rejilla de enraizamiento'},
    summary: {
      pt: 'Grelhas em plástico reciclado que estabilizam o solo e permitem relva pisável e estacionamento verde.',
      en: 'Recycled-plastic grids that stabilise the ground for walkable lawns and green parking.',
      es: 'Rejillas en plástico reciclado que estabilizan el suelo para césped transitable y aparcamiento verde.',
    },
    description: {
      pt: 'Grelha de enrelvamento em plástico 100% reciclado que reforça o terreno e distribui a carga, permitindo que a relva cresça em zonas de passagem ou estacionamento. Resistente à água e à compressão, dispensa manutenção e não apodrece.',
      en: 'Grass-reinforcement grid in 100% recycled plastic that strengthens the ground and spreads load, letting grass grow across walkways or parking areas. Water-resistant and able to take compression, it needs no maintenance and never rots.',
      es: 'Rejilla de enraizamiento en plástico 100% reciclado que refuerza el terreno y reparte la carga, permitiendo que el césped crezca en zonas de paso o aparcamiento. Resistente al agua y a la compresión, no necesita mantenimiento y no se pudre.',
    },
    features: [f.recycled, f.water, f.noMaintenance, f.durable],
    applications: [
      {pt: 'Estacionamentos verdes', en: 'Green car parks', es: 'Aparcamientos verdes'},
      {pt: 'Acessos e caminhos', en: 'Accesses and paths', es: 'Accesos y caminos'},
      {pt: 'Jardins', en: 'Gardens', es: 'Jardines'},
    ],
  },
  {
    slug: 'sinaletica-e-paineis-informativos',
    sourceUrl: 'https://www.dafabrica4you.pt/sinaletica-e-paineis-informativos/',
    orderRank: 30,
    title: {
      pt: 'Sinalética e painéis informativos',
      en: 'Signage and information panels',
      es: 'Señalética y paneles informativos',
    },
    summary: {
      pt: 'Sinalética e suportes informativos em plástico reciclado para espaços exteriores e percursos.',
      en: 'Signage and information boards in recycled plastic for outdoor spaces and trails.',
      es: 'Señalética y soportes informativos en plástico reciclado para espacios exteriores y recorridos.',
    },
    description: {
      pt: 'Sinalética e painéis informativos em plástico 100% reciclado para parques, percursos e equipamentos públicos. Aguentam a exposição solar e a humidade sem empenar nem apodrecer, mantendo a leitura clara ao longo do tempo.',
      en: 'Signage and information panels in 100% recycled plastic for parks, trails and public facilities. They cope with sun exposure and damp without warping or rotting, keeping the message legible over time.',
      es: 'Señalética y paneles informativos en plástico 100% reciclado para parques, recorridos y equipamientos públicos. Soportan la exposición solar y la humedad sin combarse ni pudrirse, manteniendo la lectura clara con el tiempo.',
    },
    features: [f.recycled, f.uv, f.noRot, f.noMaintenance],
    applications: [
      {pt: 'Parques e percursos', en: 'Parks and trails', es: 'Parques y recorridos'},
      {pt: 'Autarquias', en: 'Municipalities', es: 'Ayuntamientos'},
      {pt: 'Espaços naturais', en: 'Natural areas', es: 'Espacios naturales'},
    ],
  },
  {
    slug: 'abrigos-e-telheiros',
    sourceUrl: 'https://www.dafabrica4you.pt/abrigos-e-telheiros/',
    orderRank: 40,
    title: {pt: 'Abrigos e telheiros', en: 'Shelters and canopies', es: 'Refugios y cobertizos'},
    summary: {
      pt: 'Abrigos e telheiros em plástico reciclado, resistentes ao tempo e sem manutenção.',
      en: 'Recycled-plastic shelters and canopies, weatherproof and maintenance-free.',
      es: 'Refugios y cobertizos en plástico reciclado, resistentes a la intemperie y sin mantenimiento.',
    },
    description: {
      pt: 'Abrigos e telheiros construídos em plástico 100% reciclado, ideais para proteger pessoas, equipamentos ou arrumos no exterior. Não apodrecem nem precisam de pintura e resistem à chuva e ao sol durante muitos anos.',
      en: 'Shelters and canopies built from 100% recycled plastic, ideal for protecting people, equipment or storage outdoors. They do not rot or need paint and stand up to rain and sun for many years.',
      es: 'Refugios y cobertizos construidos en plástico 100% reciclado, ideales para proteger a personas, equipos o almacenaje en el exterior. No se pudren ni necesitan pintura y resisten la lluvia y el sol durante muchos años.',
    },
    features: [f.recycled, f.noRot, f.water, f.noMaintenance],
    applications: [
      {pt: 'Jardins e quintais', en: 'Gardens and yards', es: 'Jardines y patios'},
      {pt: 'Espaços públicos', en: 'Public spaces', es: 'Espacios públicos'},
      {pt: 'Quintas', en: 'Farms', es: 'Fincas'},
    ],
  },
  {
    slug: 'vedacoes',
    sourceUrl: 'https://www.dafabrica4you.pt/vedacoes/',
    orderRank: 50,
    title: {pt: 'Vedações', en: 'Fencing', es: 'Vallados'},
    summary: {
      pt: 'Grande variedade de vedações em plástico 100% reciclado para delimitar e proteger espaços exteriores.',
      en: 'A wide range of 100% recycled-plastic fences to bound and protect outdoor spaces.',
      es: 'Gran variedad de vallados en plástico 100% reciclado para delimitar y proteger espacios exteriores.',
    },
    description: {
      pt: 'Temos uma grande variedade de vedações em plástico 100% reciclado para delimitar terrenos, jardins e piscinas. Resistentes à água e aos raios solares, não apodrecem nem precisam de manutenção, sendo uma alternativa duradoura à madeira.',
      en: 'We offer a wide variety of fences in 100% recycled plastic to enclose plots, gardens and pools. Water- and UV-resistant, they do not rot or need maintenance, making a long-lasting alternative to timber.',
      es: 'Tenemos una gran variedad de vallados en plástico 100% reciclado para delimitar terrenos, jardines y piscinas. Resistentes al agua y a los rayos solares, no se pudren ni necesitan mantenimiento, siendo una alternativa duradera a la madera.',
    },
    features: [f.recycled, f.noRot, f.noMaintenance, f.water],
    applications: [
      {pt: 'Piscinas', en: 'Pools', es: 'Piscinas'},
      {pt: 'Condomínios', en: 'Condominiums', es: 'Comunidades'},
      {pt: 'Jardins', en: 'Gardens', es: 'Jardines'},
      {pt: 'Quintas', en: 'Farms', es: 'Fincas'},
    ],
  },
  {
    slug: 'divisorias-de-terrenos',
    sourceUrl: 'https://www.dafabrica4you.pt/divisorias-de-terrenos/',
    orderRank: 60,
    title: {pt: 'Divisórias de terrenos', en: 'Land dividers', es: 'Divisorias de terrenos'},
    summary: {
      pt: 'Divisórias em plástico reciclado para separar e organizar terrenos e propriedades.',
      en: 'Recycled-plastic dividers to separate and organise plots and properties.',
      es: 'Divisorias en plástico reciclado para separar y organizar terrenos y propiedades.',
    },
    description: {
      pt: 'Divisórias de terrenos em plástico 100% reciclado para marcar limites entre propriedades, parcelas ou zonas de cultivo. Robustas e resistentes ao tempo, não apodrecem nem exigem manutenção regular.',
      en: 'Land dividers in 100% recycled plastic to mark boundaries between properties, plots or growing areas. Sturdy and weatherproof, they do not rot or require regular maintenance.',
      es: 'Divisorias de terrenos en plástico 100% reciclado para marcar límites entre propiedades, parcelas o zonas de cultivo. Robustas y resistentes a la intemperie, no se pudren ni exigen mantenimiento regular.',
    },
    features: [f.recycled, f.noRot, f.durable, f.noMaintenance],
    applications: [
      {pt: 'Quintas e parcelas', en: 'Farms and plots', es: 'Fincas y parcelas'},
      {pt: 'Hortas', en: 'Vegetable gardens', es: 'Huertos'},
      {pt: 'Propriedades rurais', en: 'Rural properties', es: 'Propiedades rurales'},
    ],
  },
  {
    slug: 'resguardos-de-ecopontos',
    sourceUrl: 'https://www.dafabrica4you.pt/resguardos-de-ecopontos/',
    orderRank: 70,
    title: {pt: 'Resguardos de ecopontos', en: 'Recycling-point enclosures', es: 'Resguardos de ecopuntos'},
    summary: {
      pt: 'Resguardos em plástico reciclado que escondem e organizam ecopontos e contentores.',
      en: 'Recycled-plastic enclosures that conceal and tidy recycling points and bins.',
      es: 'Resguardos en plástico reciclado que ocultan y ordenan ecopuntos y contenedores.',
    },
    description: {
      pt: 'Resguardos para ecopontos e contentores em plástico 100% reciclado, que melhoram a imagem dos espaços e protegem os equipamentos. Resistem ao exterior sem apodrecer nem necessitar de pintura.',
      en: 'Enclosures for recycling points and bins in 100% recycled plastic that improve how spaces look and protect the equipment. They withstand the outdoors without rotting or needing paint.',
      es: 'Resguardos para ecopuntos y contenedores en plástico 100% reciclado, que mejoran la imagen de los espacios y protegen los equipos. Resisten el exterior sin pudrirse ni necesitar pintura.',
    },
    features: [f.recycled, f.noRot, f.noPaint, f.noMaintenance],
    applications: [
      {pt: 'Condomínios', en: 'Condominiums', es: 'Comunidades'},
      {pt: 'Autarquias', en: 'Municipalities', es: 'Ayuntamientos'},
      {pt: 'Empresas', en: 'Companies', es: 'Empresas'},
    ],
  },
  {
    slug: 'hipismo',
    sourceUrl: 'https://www.dafabrica4you.pt/hipismo/',
    orderRank: 80,
    title: {pt: 'Hipismo', en: 'Equestrian', es: 'Hípica'},
    summary: {
      pt: 'Vedações e equipamentos de hipismo em plástico reciclado, seguros e sem manutenção.',
      en: 'Recycled-plastic equestrian fencing and equipment — safe and maintenance-free.',
      es: 'Vallados y equipamientos de hípica en plástico reciclado, seguros y sin mantenimiento.',
    },
    description: {
      pt: 'Vedações, obstáculos e equipamentos para hipismo em plástico 100% reciclado, pensados para picadeiros e instalações equestres. Não apodrecem nem lascam, resistem ao uso e ao tempo e dispensam manutenção.',
      en: 'Fencing, obstacles and equipment for equestrian use in 100% recycled plastic, designed for arenas and stables. They do not rot or splinter, resist wear and weather, and need no maintenance.',
      es: 'Vallados, obstáculos y equipamientos para hípica en plástico 100% reciclado, pensados para picaderos e instalaciones ecuestres. No se pudren ni se astillan, resisten el uso y el tiempo y no necesitan mantenimiento.',
    },
    features: [f.recycled, f.noRot, f.durable, f.noMaintenance],
    applications: [
      {pt: 'Picadeiros', en: 'Riding arenas', es: 'Picaderos'},
      {pt: 'Coudelarias', en: 'Stud farms', es: 'Yeguadas'},
      {pt: 'Centros equestres', en: 'Equestrian centres', es: 'Centros ecuestres'},
    ],
  },
  {
    slug: 'revestimento',
    sourceUrl: 'https://www.dafabrica4you.pt/revestimento/',
    orderRank: 90,
    title: {pt: 'Revestimento', en: 'Cladding', es: 'Revestimiento'},
    summary: {
      pt: 'Revestimentos em plástico reciclado para paredes e superfícies exteriores.',
      en: 'Recycled-plastic cladding for outdoor walls and surfaces.',
      es: 'Revestimientos en plástico reciclado para paredes y superficies exteriores.',
    },
    description: {
      pt: 'Revestimentos em plástico 100% reciclado para proteger e dar acabamento a paredes e superfícies no exterior. Resistentes à água e aos UV, não apodrecem e mantêm-se bem sem pintura nem manutenção.',
      en: 'Cladding in 100% recycled plastic to protect and finish outdoor walls and surfaces. Water- and UV-resistant, it does not rot and stays looking good without paint or maintenance.',
      es: 'Revestimientos en plástico 100% reciclado para proteger y dar acabado a paredes y superficies en el exterior. Resistentes al agua y a los UV, no se pudren y se mantienen bien sin pintura ni mantenimiento.',
    },
    features: [f.recycled, f.water, f.uv, f.noPaint],
    applications: [
      {pt: 'Fachadas', en: 'Façades', es: 'Fachadas'},
      {pt: 'Muros', en: 'Walls', es: 'Muros'},
      {pt: 'Anexos', en: 'Outbuildings', es: 'Anexos'},
    ],
  },
  {
    slug: 'decking',
    sourceUrl: 'https://www.dafabrica4you.pt/pavimento-decking/',
    orderRank: 100,
    title: {pt: 'Decking e pavimento', en: 'Decking & flooring', es: 'Decking y pavimento'},
    summary: {
      pt: 'Decking e pavimento em plástico reciclado, antiderrapante e resistente à água, sem apodrecer.',
      en: 'Recycled-plastic decking and flooring — slip-aware, water-resistant and rot-proof.',
      es: 'Decking y pavimento en plástico reciclado, resistente al agua y que no se pudre.',
    },
    description: {
      pt: 'Decking e pavimento em plástico 100% reciclado para zonas exteriores, incluindo as próximas de piscinas e da água. Não apodrece, não precisa de envernizar nem pintar e mantém-se estável sob o sol e a chuva ao longo dos anos.',
      en: 'Decking and flooring in 100% recycled plastic for outdoor areas, including those near pools and water. It does not rot, needs no varnishing or painting and stays stable under sun and rain for years.',
      es: 'Decking y pavimento en plástico 100% reciclado para zonas exteriores, incluso cerca de piscinas y del agua. No se pudre, no necesita barniz ni pintura y se mantiene estable bajo el sol y la lluvia durante años.',
    },
    features: [f.recycled, f.noRot, f.water, f.noMaintenance],
    applications: [
      {pt: 'Piscinas', en: 'Pools', es: 'Piscinas'},
      {pt: 'Terraços', en: 'Terraces', es: 'Terrazas'},
      {pt: 'Jardins', en: 'Gardens', es: 'Jardines'},
      {pt: 'Espaços públicos', en: 'Public spaces', es: 'Espacios públicos'},
    ],
  },
  {
    slug: 'mobiliario',
    sourceUrl: 'https://www.dafabrica4you.pt/mobiliario/',
    orderRank: 110,
    title: {pt: 'Mobiliário', en: 'Furniture', es: 'Mobiliario'},
    summary: {
      pt: 'Mobiliário urbano e de jardim em plástico reciclado: bancos, mesas e conjuntos sem manutenção.',
      en: 'Urban and garden furniture in recycled plastic: benches, tables and sets, maintenance-free.',
      es: 'Mobiliario urbano y de jardín en plástico reciclado: bancos, mesas y conjuntos sin mantenimiento.',
    },
    description: {
      pt: 'Mobiliário urbano e de jardim em plástico 100% reciclado — bancos, mesas e conjuntos para espaços públicos e privados. Resiste à chuva e ao sol sem apodrecer nem lascar e não precisa de pintura nem verniz.',
      en: 'Urban and garden furniture in 100% recycled plastic — benches, tables and sets for public and private spaces. It resists rain and sun without rotting or splintering and needs no paint or varnish.',
      es: 'Mobiliario urbano y de jardín en plástico 100% reciclado — bancos, mesas y conjuntos para espacios públicos y privados. Resiste la lluvia y el sol sin pudrirse ni astillarse y no necesita pintura ni barniz.',
    },
    features: [f.recycled, f.noRot, f.noPaint, f.noMaintenance],
    applications: [
      {pt: 'Jardins', en: 'Gardens', es: 'Jardines'},
      {pt: 'Parques', en: 'Parks', es: 'Parques'},
      {pt: 'Autarquias', en: 'Municipalities', es: 'Ayuntamientos'},
      {pt: 'Esplanadas', en: 'Terraces', es: 'Terrazas'},
    ],
  },
  {
    slug: 'floreiras-e-vasos',
    sourceUrl: 'https://www.dafabrica4you.pt/floreiras-e-vasos/',
    orderRank: 120,
    title: {pt: 'Floreiras e vasos', en: 'Planters and pots', es: 'Jardineras y macetas'},
    summary: {
      pt: 'Floreiras e vasos em plástico reciclado para jardins, esplanadas e espaços urbanos.',
      en: 'Recycled-plastic planters and pots for gardens, terraces and urban spaces.',
      es: 'Jardineras y macetas en plástico reciclado para jardines, terrazas y espacios urbanos.',
    },
    description: {
      pt: 'Floreiras e vasos em plástico 100% reciclado para interior e exterior. Resistentes à água e à exposição solar, não apodrecem nem desbotam com facilidade e mantêm-se sem manutenção.',
      en: 'Planters and pots in 100% recycled plastic for indoors and out. Water- and sun-resistant, they do not rot or fade easily and stay maintenance-free.',
      es: 'Jardineras y macetas en plástico 100% reciclado para interior y exterior. Resistentes al agua y a la exposición solar, no se pudren ni se decoloran con facilidad y se mantienen sin mantenimiento.',
    },
    features: [f.recycled, f.water, f.noRot, f.noMaintenance],
    applications: [
      {pt: 'Jardins', en: 'Gardens', es: 'Jardines'},
      {pt: 'Esplanadas', en: 'Terraces', es: 'Terrazas'},
      {pt: 'Espaços urbanos', en: 'Urban spaces', es: 'Espacios urbanos'},
    ],
  },
  {
    slug: 'compostores',
    sourceUrl: 'https://www.dafabrica4you.pt/compostores/',
    orderRank: 130,
    title: {pt: 'Compostores', en: 'Composters', es: 'Compostadores'},
    summary: {
      pt: 'Compostores em plástico reciclado para transformar resíduos orgânicos em composto.',
      en: 'Recycled-plastic composters to turn organic waste into compost.',
      es: 'Compostadores en plástico reciclado para transformar residuos orgánicos en compost.',
    },
    description: {
      pt: 'Compostores em plástico 100% reciclado para hortas, jardins e escolas. Resistentes à humidade e ao tempo, não apodrecem e dispensam manutenção, ajudando a fechar o ciclo dos resíduos orgânicos.',
      en: 'Composters in 100% recycled plastic for vegetable gardens, gardens and schools. Resistant to damp and weather, they do not rot and need no maintenance, helping close the loop on organic waste.',
      es: 'Compostadores en plástico 100% reciclado para huertos, jardines y escuelas. Resistentes a la humedad y a la intemperie, no se pudren y no necesitan mantenimiento, ayudando a cerrar el ciclo de los residuos orgánicos.',
    },
    features: [f.recycled, f.water, f.noRot, f.noMaintenance],
    applications: [
      {pt: 'Hortas', en: 'Vegetable gardens', es: 'Huertos'},
      {pt: 'Jardins', en: 'Gardens', es: 'Jardines'},
      {pt: 'Escolas', en: 'Schools', es: 'Escuelas'},
    ],
  },
  {
    slug: 'passadicos',
    sourceUrl: 'https://www.dafabrica4you.pt/passadicos/',
    orderRank: 140,
    title: {pt: 'Passadiços e rampas', en: 'Walkways and ramps', es: 'Pasarelas y rampas'},
    summary: {
      pt: 'Passadiços e rampas em plástico reciclado para percursos pedonais e acessos.',
      en: 'Recycled-plastic walkways and ramps for pedestrian routes and accesses.',
      es: 'Pasarelas y rampas en plástico reciclado para recorridos peatonales y accesos.',
    },
    description: {
      pt: 'Passadiços e rampas em plástico 100% reciclado para percursos pedonais, zonas húmidas e acessos. Resistem à água sem apodrecer e mantêm-se seguros e estáveis ao longo dos anos, sem necessidade de manutenção.',
      en: 'Walkways and ramps in 100% recycled plastic for pedestrian routes, wetlands and accesses. They resist water without rotting and stay safe and stable over the years, with no maintenance required.',
      es: 'Pasarelas y rampas en plástico 100% reciclado para recorridos peatonales, zonas húmedas y accesos. Resisten el agua sin pudrirse y se mantienen seguras y estables a lo largo de los años, sin necesidad de mantenimiento.',
    },
    features: [f.recycled, f.water, f.noRot, f.durable],
    applications: [
      {pt: 'Zonas húmidas', en: 'Wetlands', es: 'Zonas húmedas'},
      {pt: 'Praias e dunas', en: 'Beaches and dunes', es: 'Playas y dunas'},
      {pt: 'Percursos naturais', en: 'Nature trails', es: 'Recorridos naturales'},
    ],
  },
  {
    slug: 'agricultura',
    sourceUrl: 'https://www.dafabrica4you.pt/estacas-para-vedacao/',
    orderRank: 150,
    title: {pt: 'Agricultura', en: 'Agriculture', es: 'Agricultura'},
    summary: {
      pt: 'Estacas, postes e soluções em plástico reciclado para a agricultura e vedações rurais.',
      en: 'Recycled-plastic stakes, posts and solutions for agriculture and rural fencing.',
      es: 'Estacas, postes y soluciones en plástico reciclado para la agricultura y vallados rurales.',
    },
    description: {
      pt: 'Estacas, postes e apoios em plástico 100% reciclado para a agricultura e vedações rurais. Não apodrecem em contacto com o solo e a humidade, durando muito mais do que a madeira e sem necessitar de tratamento.',
      en: 'Stakes, posts and supports in 100% recycled plastic for agriculture and rural fencing. They do not rot in contact with soil and moisture, lasting far longer than timber and needing no treatment.',
      es: 'Estacas, postes y apoyos en plástico 100% reciclado para la agricultura y vallados rurales. No se pudren en contacto con el suelo y la humedad, durando mucho más que la madera y sin necesitar tratamiento.',
    },
    features: [f.recycled, f.noRot, f.durable, f.noMaintenance],
    applications: [
      {pt: 'Vinhas e pomares', en: 'Vineyards and orchards', es: 'Viñas y huertos'},
      {pt: 'Vedações rurais', en: 'Rural fencing', es: 'Vallados rurales'},
      {pt: 'Explorações agrícolas', en: 'Farms', es: 'Explotaciones agrícolas'},
    ],
  },
  {
    slug: 'caixas-de-cultivo',
    sourceUrl: 'https://www.dafabrica4you.pt/caixas-de-cultivo/',
    orderRank: 160,
    title: {pt: 'Caixas de cultivo', en: 'Grow boxes', es: 'Cajas de cultivo'},
    summary: {
      pt: 'Caixas e canteiros elevados em plástico reciclado para hortas e cultivo.',
      en: 'Recycled-plastic grow boxes and raised beds for vegetable gardens.',
      es: 'Cajas y bancales elevados en plástico reciclado para huertos y cultivo.',
    },
    description: {
      pt: 'Caixas de cultivo e canteiros elevados em plástico 100% reciclado para hortas domésticas, escolas e municípios. Resistem à rega e à humidade sem apodrecer e duram muitas temporadas sem manutenção.',
      en: 'Grow boxes and raised beds in 100% recycled plastic for home gardens, schools and municipalities. They withstand watering and damp without rotting and last many seasons with no maintenance.',
      es: 'Cajas de cultivo y bancales elevados en plástico 100% reciclado para huertos domésticos, escuelas y municipios. Resisten el riego y la humedad sin pudrirse y duran muchas temporadas sin mantenimiento.',
    },
    features: [f.recycled, f.water, f.noRot, f.noMaintenance],
    applications: [
      {pt: 'Hortas urbanas', en: 'Urban gardens', es: 'Huertos urbanos'},
      {pt: 'Escolas', en: 'Schools', es: 'Escuelas'},
      {pt: 'Jardins domésticos', en: 'Home gardens', es: 'Jardines domésticos'},
    ],
  },
  {
    slug: 'bordaduras-de-canteiros',
    sourceUrl: 'https://www.dafabrica4you.pt/bordaduras-de-canteiros/',
    orderRank: 170,
    title: {pt: 'Bordaduras de canteiros', en: 'Garden bed edging', es: 'Bordillos de arriates'},
    summary: {
      pt: 'Bordaduras em plástico reciclado para delimitar canteiros, caminhos e zonas ajardinadas.',
      en: 'Recycled-plastic edging to outline beds, paths and planted areas.',
      es: 'Bordillos en plástico reciclado para delimitar arriates, caminos y zonas ajardinadas.',
    },
    description: {
      pt: 'Bordaduras de canteiros em plástico 100% reciclado para delimitar e arrumar canteiros, caminhos e zonas verdes. Resistentes à humidade, não apodrecem e mantêm a definição dos espaços sem manutenção.',
      en: 'Garden-bed edging in 100% recycled plastic to outline and tidy beds, paths and green areas. Resistant to damp, it does not rot and keeps spaces defined with no maintenance.',
      es: 'Bordillos de arriates en plástico 100% reciclado para delimitar y ordenar arriates, caminos y zonas verdes. Resistentes a la humedad, no se pudren y mantienen la definición de los espacios sin mantenimiento.',
    },
    features: [f.recycled, f.water, f.noRot, f.noMaintenance],
    applications: [
      {pt: 'Jardins', en: 'Gardens', es: 'Jardines'},
      {pt: 'Hortas', en: 'Vegetable gardens', es: 'Huertos'},
      {pt: 'Espaços verdes públicos', en: 'Public green spaces', es: 'Zonas verdes públicas'},
    ],
  },
  {
    slug: 'pergolas',
    sourceUrl: 'https://www.dafabrica4you.pt/pergolas/',
    orderRank: 180,
    title: {pt: 'Pérgolas', en: 'Pergolas', es: 'Pérgolas'},
    summary: {
      pt: 'Pérgolas em plástico reciclado para criar sombra e estrutura em espaços exteriores.',
      en: 'Recycled-plastic pergolas to create shade and structure in outdoor spaces.',
      es: 'Pérgolas en plástico reciclado para crear sombra y estructura en espacios exteriores.',
    },
    description: {
      pt: 'Pérgolas em plástico 100% reciclado para jardins, esplanadas e zonas de estar ao ar livre. Resistem ao sol e à chuva sem apodrecer nem precisar de pintura, mantendo a estrutura bonita durante muitos anos.',
      en: 'Pergolas in 100% recycled plastic for gardens, terraces and outdoor seating areas. They withstand sun and rain without rotting or needing paint, keeping the structure looking good for many years.',
      es: 'Pérgolas en plástico 100% reciclado para jardines, terrazas y zonas de estar al aire libre. Resisten el sol y la lluvia sin pudrirse ni necesitar pintura, manteniendo la estructura bonita durante muchos años.',
    },
    features: [f.recycled, f.noRot, f.uv, f.noPaint],
    applications: [
      {pt: 'Jardins', en: 'Gardens', es: 'Jardines'},
      {pt: 'Esplanadas', en: 'Terraces', es: 'Terrazas'},
      {pt: 'Zonas de lazer', en: 'Leisure areas', es: 'Zonas de ocio'},
    ],
  },
]
