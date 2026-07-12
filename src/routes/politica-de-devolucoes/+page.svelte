<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte'
  import type {LanguageCode} from '$lib/site-content'

  let {data} = $props()

  type Copy = {
    kicker: string
    title: string
    lead: string
    conditions: string[]
  }

  const copyByLanguage: Record<LanguageCode, Copy> = {
    pt: {
      kicker: 'Política',
      title: 'Política de devoluções',
      lead: 'Aceitamos devoluções, nas condições:',
      conditions: [
        'Produto tem que ser entregue à empresa de logística ao nível da rua',
        'Recolha entre as 9.00 e 18:00 horas',
        'Produto ser devolvido não danificado',
        'Devolução no máximo de 14 dias de calendário, da data de entrega',
        'Restituição integral do dinheiro na data de receção na nossa fábrica em Ponte Sor',
      ],
    },
    en: {
      kicker: 'Policy',
      title: 'Returns policy',
      lead: 'We accept returns under the following conditions:',
      conditions: [
        'The product must be handed over to the logistics company at street level',
        'Collection between 9:00 AM and 6:00 PM',
        'The product must be returned undamaged',
        'Returns within a maximum of 14 calendar days from the delivery date',
        'Full refund on the date the product is received at our factory in Ponte Sor',
      ],
    },
    es: {
      kicker: 'Política',
      title: 'Política de devoluciones',
      lead: 'Aceptamos devoluciones en las siguientes condiciones:',
      conditions: [
        'El producto debe entregarse a la empresa de logística a nivel de calle',
        'Recogida entre las 9:00 y las 18:00 horas',
        'El producto debe devolverse sin daños',
        'Devolución en un máximo de 14 días naturales desde la fecha de entrega',
        'Reembolso íntegro en la fecha de recepción en nuestra fábrica en Ponte Sor',
      ],
    },
  }

  const t = $derived(copyByLanguage[data.language] ?? copyByLanguage.pt)
</script>

<SeoHead title={t.title} description={t.lead} />

<main class="article-page policy-page">
  <p class="kicker">{t.kicker}</p>
  <h1>{t.title}</h1>
  <p class="policy-lead">{t.lead}</p>
  <ul class="policy-list">
    {#each t.conditions as condition}
      <li>{condition}</li>
    {/each}
  </ul>
</main>
