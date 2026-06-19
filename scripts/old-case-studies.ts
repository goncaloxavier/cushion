type LocalizedCaseText = {
  pt: string
  en: string
  es: string
}

export type OldCaseStudy = {
  slug: string
  title: LocalizedCaseText
  location: string
  productArea: LocalizedCaseText
  summary: LocalizedCaseText
  description: LocalizedCaseText
  images: string[]
}

export const oldCaseStudies: OldCaseStudy[] = [
  {
    slug: 'vedacao-piscina-moita',
    title: {
      pt: 'Vedação de piscina na Moita',
      en: 'Pool fence in Moita',
      es: 'Vallado de piscina en Moita',
    },
    location: 'Moita',
    productArea: {
      pt: 'Vedações',
      en: 'Fencing',
      es: 'Vallados',
    },
    summary: {
      pt: 'Uma vedação nova substituiu a madeira existente e ajudou a proteger a piscina dos cães da família.',
      en: 'A new fence replaced the existing timber solution and helped keep the family dogs away from the pool.',
      es: 'Un nuevo vallado sustituyó la madera existente y ayudó a proteger la piscina de los perros de la familia.',
    },
    description: {
      pt: 'A cliente Carla, da Moita, precisava de impedir que os cães usassem a piscina. A vedação anterior em madeira tinha problemas de conservação, por isso foi construída uma nova vedação com perfis DaFábrica4you.',
      en: 'Carla, in Moita, needed to stop the dogs from using the pool. The previous timber fence had maintenance problems, so a new fence was built with DaFábrica4you profiles.',
      es: 'Carla, en Moita, necesitaba impedir que los perros usaran la piscina. El vallado anterior de madera tenía problemas de conservación, por eso se construyó un nuevo vallado con perfiles DaFábrica4you.',
    },
    images: [
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000544-27f7827f7a/Veda%C3%A7%C3%A3o%20Moita%201-5.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000545-55f4755f49/Veda%C3%A7%C3%A3o%20Moita%202-1.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000546-91a3891a39/Veda%C3%A7%C3%A3o%20Moita%203-6.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000547-d4d3fd4d41/Veda%C3%A7%C3%A3o%20Moita%204-0.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000548-0eac60eac7/Veda%C3%A7%C3%A3o%20Moita%205-1.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000553-5c1975c199/Veda%C3%A7%C3%A3o%20Moita-3.jpeg?ph=828f6b5e7d',
    ],
  },
  {
    slug: 'protecao-piscina-trofa',
    title: {
      pt: 'Proteção de piscina na Trofa',
      en: 'Pool protection in Trofa',
      es: 'Protección de piscina en Trofa',
    },
    location: 'Trofa',
    productArea: {
      pt: 'Revestimento e proteção',
      en: 'Cladding and protection',
      es: 'Revestimiento y protección',
    },
    summary: {
      pt: 'O cliente comprou perfis DaFábrica4you e construiu a proteção da piscina e as portas da casa das máquinas.',
      en: 'The customer bought DaFábrica4you profiles and built the pool protection and the pool equipment room doors.',
      es: 'El cliente compró perfiles DaFábrica4you y construyó la protección de la piscina y las puertas de la sala de máquinas.',
    },
    description: {
      pt: 'O cliente Nelson, da Trofa, comprou perfis DaFábrica4you e construiu uma proteção de piscina, juntamente com portas para a casa das máquinas da piscina.',
      en: 'Nelson, in Trofa, bought DaFábrica4you profiles and built pool protection together with doors for the pool equipment room.',
      es: 'Nelson, en Trofa, compró perfiles DaFábrica4you y construyó una protección de piscina junto con puertas para la sala de máquinas.',
    },
    images: [
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000557-050ca050cc/Piscina%20Elevada-Revestimento%20%281%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000558-ac104ac106/Piscina%20Elevada-Revestimento%20%282%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000559-10e6210e63/Piscina%20Elevada-Revestimento%20%286%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000556-ade61ade63/Piscina%20Elevada-Revestimento%20%289%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000561-65a6365a65/WhatsApp%20Image%202022-07-05%20at%2021.19.14.jpeg?ph=828f6b5e7d',
    ],
  },
  {
    slug: 'decking-espreguicadeiras-ribamar',
    title: {
      pt: 'Decking e espreguiçadeiras em Ribamar',
      en: 'Decking and loungers in Ribamar',
      es: 'Decking y tumbonas en Ribamar',
    },
    location: 'Ribamar',
    productArea: {
      pt: 'Decking e mobiliário',
      en: 'Decking and furniture',
      es: 'Decking y mobiliario',
    },
    summary: {
      pt: 'Foram construídos vários níveis de decking e espreguiçadeiras para criar uma zona exterior mais confortável.',
      en: 'Several decking levels and loungers were built to create a more comfortable outdoor area.',
      es: 'Se construyeron varios niveles de decking y tumbonas para crear una zona exterior más cómoda.',
    },
    description: {
      pt: 'Para a cliente Rita, em Ribamar, foram construídos vários níveis de decking e espreguiçadeiras com material DaFábrica4you.',
      en: 'For Rita, in Ribamar, several decking levels and loungers were built with DaFábrica4you material.',
      es: 'Para Rita, en Ribamar, se construyeron varios niveles de decking y tumbonas con material DaFábrica4you.',
    },
    images: [
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000567-5fe225fe24/Decking%20e%20espreguicadeira%20%281%29-7.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000566-2205b2205d/Decking%20e%20espreguicadeira%20%282%29-0.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000568-a7d3ba7d3c/Decking%20e%20espreguicadeira%20%283%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000569-3bc873bc89/Decking%20e%20espreguicadeira%20%284%29-3.jpeg?ph=828f6b5e7d',
    ],
  },
  {
    slug: 'vedacoes-quinta-do-sol-alenquer',
    title: {
      pt: 'Vedações na Quinta do Sol, Alenquer',
      en: 'Fencing at Quinta do Sol, Alenquer',
      es: 'Vallados en Quinta do Sol, Alenquer',
    },
    location: 'Alenquer',
    productArea: {
      pt: 'Vedações',
      en: 'Fencing',
      es: 'Vallados',
    },
    summary: {
      pt: 'Numa zona com 108 vivendas, as vedações em madeira foram substituídas por uma solução com menos manutenção.',
      en: 'In an area with 108 homes, timber fences were replaced by a lower-maintenance solution.',
      es: 'En una zona con 108 viviendas, los vallados de madera fueron sustituidos por una solución con menos mantenimiento.',
    },
    description: {
      pt: 'Na Quinta do Sol, em Alenquer, uma zona com 108 vivendas tinha vedações em madeira que exigiam manutenção e já se encontravam degradadas. Foram aplicadas vedações com perfis DaFábrica4you.',
      en: 'At Quinta do Sol, in Alenquer, an area with 108 homes had timber fences that required maintenance and were already degraded. Fencing with DaFábrica4you profiles was installed.',
      es: 'En Quinta do Sol, en Alenquer, una zona con 108 viviendas tenía vallados de madera que exigían mantenimiento y ya estaban degradados. Se instalaron vallados con perfiles DaFábrica4you.',
    },
    images: [
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000575-b46a3b46a5/21-09-2022%20%281%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000576-3461b3461f/21-09-2022%20%282%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000574-73e8c73e8e/21-09-2022%20%283%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000580-be5dcbe5de/21-09-2022%20%285%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000579-bc18bbc18d/21-09-2022%20%287%29-4.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000581-2d78a2d78c/21-09-2022%20%288%29.jpeg?ph=828f6b5e7d',
    ],
  },
  {
    slug: 'decking-mobiliario-torres-mondego',
    title: {
      pt: 'Decking e mobiliário urbano em Torres do Mondego',
      en: 'Decking and urban furniture in Torres do Mondego',
      es: 'Decking y mobiliario urbano en Torres do Mondego',
    },
    location: 'Torres do Mondego',
    productArea: {
      pt: 'Decking e mobiliário urbano',
      en: 'Decking and urban furniture',
      es: 'Decking y mobiliario urbano',
    },
    summary: {
      pt: 'Instalação de decking e mobiliário urbano junto ao rio, numa zona assente sobre areia.',
      en: 'Decking and urban furniture were installed by the river, in an area built over sand.',
      es: 'Instalación de decking y mobiliario urbano junto al río, en una zona sobre arena.',
    },
    description: {
      pt: 'Para a Junta de Freguesia de Torres do Mondego, foi instalado decking e mobiliário urbano junto ao rio, numa zona assente sobre areia.',
      en: 'For the Parish Council of Torres do Mondego, decking and urban furniture were installed by the river in an area built over sand.',
      es: 'Para la Junta de Freguesia de Torres do Mondego, se instaló decking y mobiliario urbano junto al río, en una zona sobre arena.',
    },
    images: [
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000586-015e7015e8/Decking%20e%20Mobili%C3%A1rio%20Torres%20do%20Mondego%20%281%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000587-26c3a26c3c/Decking%20e%20Mobili%C3%A1rio%20Torres%20do%20Mondego%20%282%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000588-4a20e4a20f/Decking%20e%20Mobili%C3%A1rio%20Torres%20do%20Mondego%20%283%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000590-613ab613ad/Decking%20e%20Mobili%C3%A1rio%20Torres%20do%20Mondego%20%284%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000589-5d6f85d6f9/Decking%20e%20Mobili%C3%A1rio%20Torres%20do%20Mondego%20%285%29.jpeg?ph=828f6b5e7d',
    ],
  },
  {
    slug: 'teia-picadeiro-brogueira',
    title: {
      pt: 'Teia de picadeiro em Brogueira',
      en: 'Riding arena rail in Brogueira',
      es: 'Cerramiento de picadero en Brogueira',
    },
    location: 'Brogueira',
    productArea: {
      pt: 'Hipismo',
      en: 'Equestrian',
      es: 'Hípica',
    },
    summary: {
      pt: 'Construção de uma teia de picadeiro com tábuas DaFábrica4you.',
      en: 'A riding arena rail was built with DaFábrica4you boards.',
      es: 'Construcción de un cerramiento de picadero con tablas DaFábrica4you.',
    },
    description: {
      pt: 'Em Brogueira, o cliente construiu uma teia de picadeiro com tábuas DaFábrica4you.',
      en: 'In Brogueira, the customer built a riding arena rail with DaFábrica4you boards.',
      es: 'En Brogueira, el cliente construyó un cerramiento de picadero con tablas DaFábrica4you.',
    },
    images: [
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000596-106cd106cf/Teia%20%281%29-5.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000597-18a5518a57/Teia%20%282%29-1.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000599-62e4b62e4d/Teia%20%283%29-9.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000602-7a94b7a94c/Teia%20%284%29-5.jpeg?ph=828f6b5e7d',
    ],
  },
  {
    slug: 'decking-canteiros-pergula-famalicao',
    title: {
      pt: 'Decking, canteiros e pérgula em Vila Nova de Famalicão',
      en: 'Decking, planters and pergola in Vila Nova de Famalicão',
      es: 'Decking, jardineras y pérgola en Vila Nova de Famalicão',
    },
    location: 'Vila Nova de Famalicão',
    productArea: {
      pt: 'Decking, canteiros e pérgolas',
      en: 'Decking, planters and pergolas',
      es: 'Decking, jardineras y pérgolas',
    },
    summary: {
      pt: 'O cliente comprou perfis e tábuas DaFábrica4you e construiu decking, canteiros e uma pérgula.',
      en: 'The customer bought DaFábrica4you profiles and boards and built decking, planters and a pergola.',
      es: 'El cliente compró perfiles y tablas DaFábrica4you y construyó decking, jardineras y una pérgola.',
    },
    description: {
      pt: 'O cliente Ruben, de Vila Nova de Famalicão, comprou perfis e tábuas DaFábrica4you e construiu decking, canteiros e uma pérgula.',
      en: 'Ruben, from Vila Nova de Famalicão, bought DaFábrica4you profiles and boards and built decking, planters and a pergola.',
      es: 'Ruben, de Vila Nova de Famalicão, compró perfiles y tablas DaFábrica4you y construyó decking, jardineras y una pérgola.',
    },
    images: [
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000605-a417ca417e/Obra%20Vila%20Nova%20Famalic%C3%A3o%20%281%29-5.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000606-b8df4b8df5/Obra%20Vila%20Nova%20Famalic%C3%A3o%20%282%29-6.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000607-ebacbebacd/Obra%20Vila%20Nova%20Famalic%C3%A3o%20%283%29-0.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000608-1cbd81cbda/Obra%20Vila%20Nova%20Famalic%C3%A3o%20%284%29-2.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000604-962689626a/Obra%20Vila%20Nova%20Famalic%C3%A3o%20%285%29.jpeg?ph=828f6b5e7d',
    ],
  },
  {
    slug: 'floreiras-cobertura-moscavide',
    title: {
      pt: 'Floreiras em cobertura em Moscavide',
      en: 'Rooftop planters in Moscavide',
      es: 'Jardineras en cubierta en Moscavide',
    },
    location: 'Moscavide',
    productArea: {
      pt: 'Floreiras',
      en: 'Planters',
      es: 'Jardineras',
    },
    summary: {
      pt: 'Foram instalados 80 metros de floreiras no último piso de uma habitação, com vários recortes de detalhe.',
      en: 'Eighty metres of planters were installed on the top floor of a home, with several detailed cut-outs.',
      es: 'Se instalaron 80 metros de jardineras en la última planta de una vivienda, con varios recortes de detalle.',
    },
    description: {
      pt: 'Para o cliente Bruno, em Moscavide, foram instalados 80 metros de floreiras no último piso de uma habitação. A obra exigiu detalhe devido aos muitos recortes necessários.',
      en: 'For Bruno, in Moscavide, 80 metres of planters were installed on the top floor of a home. The work required detail because of the many cut-outs needed.',
      es: 'Para Bruno, en Moscavide, se instalaron 80 metros de jardineras en la última planta de una vivienda. La obra exigió detalle por los muchos recortes necesarios.',
    },
    images: [
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000614-c2c4dc2c4f/Moscavide%20%281%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000615-0247d0247e/Moscavide%20%282%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000616-a9764a9765/Moscavide%20%283%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000618-09b2a09b2c/Moscavide%20%284%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000620-57dfb57dfc/Moscavide%20%285%29.jpeg?ph=828f6b5e7d',
    ],
  },
  {
    slug: 'vedacao-muro-ribafria',
    title: {
      pt: 'Vedação sobre muro existente em Ribafria',
      en: 'Fence on an existing wall in Ribafria',
      es: 'Vallado sobre muro existente en Ribafria',
    },
    location: 'Ribafria',
    productArea: {
      pt: 'Vedações',
      en: 'Fencing',
      es: 'Vallados',
    },
    summary: {
      pt: 'Produção e instalação de uma vedação construída sobre um muro existente.',
      en: 'Production and installation of a fence built on top of an existing wall.',
      es: 'Producción e instalación de un vallado construido sobre un muro existente.',
    },
    description: {
      pt: 'Para a cliente Rita, em Ribafria, foi produzida e instalada uma vedação construída sobre um muro existente.',
      en: 'For Rita, in Ribafria, a fence was produced and installed on top of an existing wall.',
      es: 'Para Rita, en Ribafria, se produjo e instaló un vallado construido sobre un muro existente.',
    },
    images: [
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000752-3c9a53c9a9/Fotos%20Ribafria%20Veda%C3%A7%C3%A3o%20%284%29.jpeg?ph=828f6b5e7d',
    ],
  },
  {
    slug: 'mobiliario-resguardos-sanfins-douro',
    title: {
      pt: 'Mobiliário urbano e resguardos em Sanfins do Douro',
      en: 'Urban furniture and bin screens in Sanfins do Douro',
      es: 'Mobiliario urbano y resguardos en Sanfins do Douro',
    },
    location: 'Sanfins do Douro',
    productArea: {
      pt: 'Mobiliário urbano e resguardos',
      en: 'Urban furniture and screens',
      es: 'Mobiliario urbano y resguardos',
    },
    summary: {
      pt: 'A freguesia tem vindo a substituir mobiliário urbano e a construir resguardos de ecopontos com perfis DaFábrica4you.',
      en: 'The parish has been replacing urban furniture and building recycling-point screens with DaFábrica4you profiles.',
      es: 'La freguesia ha ido sustituyendo mobiliario urbano y construyendo resguardos de ecopuntos con perfiles DaFábrica4you.',
    },
    description: {
      pt: 'A Junta de Freguesia de Sanfins do Douro tem vindo a substituir o seu mobiliário urbano por equipamentos DaFábrica4you. Em paralelo, tem construído resguardos de ecopontos com perfis DaFábrica4you.',
      en: 'The Parish Council of Sanfins do Douro has been replacing its urban furniture with DaFábrica4you equipment. At the same time, it has been building recycling-point screens with DaFábrica4you profiles.',
      es: 'La Junta de Freguesia de Sanfins do Douro ha ido sustituyendo su mobiliario urbano por equipamiento DaFábrica4you. En paralelo, ha construido resguardos de ecopuntos con perfiles DaFábrica4you.',
    },
    images: [
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000883-f388af388c/Sans%20Fins%20do%20Douro%201.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000884-3ab1b3ab1e/Sans%20Fins%20do%20Douro%202.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000885-85f1d85f21/Sans%20Fins%20do%20Douro.jpeg?ph=828f6b5e7d',
    ],
  },
  {
    slug: 'rampa-acesso-praia-carcavelos',
    title: {
      pt: 'Rampa de acesso na Praia de Carcavelos',
      en: 'Access ramp at Carcavelos Beach',
      es: 'Rampa de acceso en la playa de Carcavelos',
    },
    location: 'Praia de Carcavelos',
    productArea: {
      pt: 'Passadiços e acessibilidade',
      en: 'Walkways and accessibility',
      es: 'Pasarelas y accesibilidad',
    },
    summary: {
      pt: 'Rampa de acesso à praia pensada para pessoas com mobilidade reduzida.',
      en: 'A beach access ramp designed for people with reduced mobility.',
      es: 'Rampa de acceso a la playa pensada para personas con movilidad reducida.',
    },
    description: {
      pt: 'Na Praia de Carcavelos, foi instalada uma rampa de acesso para pessoas com mobilidade reduzida.',
      en: 'At Carcavelos Beach, an access ramp was installed for people with reduced mobility.',
      es: 'En la playa de Carcavelos, se instaló una rampa de acceso para personas con movilidad reducida.',
    },
    images: [
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200001035-6ba7a6ba7c/Rampas%20%281%29-8.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200001036-c6139c613c/Rampas%20%282%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200001037-1b5601b562/Rampas%20%283%29-5.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200001038-7d6577d658/Rampas%20%284%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200001043-9b9c09b9c1/Rampas%20%285%29-8.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200001044-b71e0b71e2/Rampas%20%286%29.jpeg?ph=828f6b5e7d',
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200001034-634bb634bd/Rampas%20%287%29.jpeg?ph=828f6b5e7d',
    ],
  },
]
