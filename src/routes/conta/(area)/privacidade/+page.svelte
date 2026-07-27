<script lang="ts">
  import {enhance} from '$app/forms'
  import {invalidateAll} from '$app/navigation'
  import Reveal from '$lib/components/Reveal.svelte'
  import {showToast} from '$lib/toast'

  let {data} = $props()

  const copy = {
    pt: {
      title: 'Privacidade',
      intro:
        'Consulte os seus dados ou envie um pedido relativo à utilização da sua informação pessoal.',
      export: 'Descarregar os meus dados',
      request: 'Fazer um pedido',
      type: 'Tipo de pedido',
      note: 'Informação adicional',
      optional: 'opcional',
      send: 'Enviar pedido',
      sent: 'Pedido registado.',
      history: 'Pedidos anteriores',
      empty: 'Ainda não existem pedidos.',
      retention:
        'Alguns dados de encomendas podem ter de ser conservados durante o prazo legal aplicável.',
    },
    en: {
      title: 'Privacy',
      intro: 'Review your data or submit a request about how your personal information is used.',
      export: 'Download my data',
      request: 'Make a request',
      type: 'Request type',
      note: 'Additional information',
      optional: 'optional',
      send: 'Submit request',
      sent: 'Request recorded.',
      history: 'Previous requests',
      empty: 'There are no requests yet.',
      retention: 'Some order data may need to be retained for the applicable legal period.',
    },
    es: {
      title: 'Privacidad',
      intro: 'Consulta tus datos o envía una solicitud sobre el uso de tu información personal.',
      export: 'Descargar mis datos',
      request: 'Hacer una solicitud',
      type: 'Tipo de solicitud',
      note: 'Información adicional',
      optional: 'opcional',
      send: 'Enviar solicitud',
      sent: 'Solicitud registrada.',
      history: 'Solicitudes anteriores',
      empty: 'Todavía no hay solicitudes.',
      retention:
        'Algunos datos de pedidos pueden tener que conservarse durante el plazo legal aplicable.',
    },
  }
  const labels = {
    pt: {
      access: 'Acesso aos dados',
      portability: 'Portabilidade',
      erasure: 'Eliminação da conta e dados',
      restriction: 'Limitação do tratamento',
      marketing_withdrawal: 'Retirar consentimento de marketing',
      new: 'Recebido',
      in_progress: 'Em análise',
      completed: 'Concluído',
      rejected: 'Não aplicável',
    },
    en: {
      access: 'Access to data',
      portability: 'Portability',
      erasure: 'Delete account and data',
      restriction: 'Restrict processing',
      marketing_withdrawal: 'Withdraw marketing consent',
      new: 'Received',
      in_progress: 'In review',
      completed: 'Completed',
      rejected: 'Not applicable',
    },
    es: {
      access: 'Acceso a los datos',
      portability: 'Portabilidad',
      erasure: 'Eliminar cuenta y datos',
      restriction: 'Limitar el tratamiento',
      marketing_withdrawal: 'Retirar consentimiento de marketing',
      new: 'Recibida',
      in_progress: 'En revisión',
      completed: 'Completada',
      rejected: 'No aplicable',
    },
  }

  const t = $derived(copy[data.language] ?? copy.pt)
  const l = $derived(labels[data.language] ?? labels.pt)
</script>

<svelte:head>
  <title>{t.title} | DaFábrica4You</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<Reveal class="account-card account-privacy-card" variant="card" priority>
  <div class="account-card-head">
    <div>
      <h2>{t.title}</h2>
      <p class="account-privacy-intro">{t.intro}</p>
    </div>
    <a class="button subtle" href={`/conta/privacidade/exportar?lang=${data.language}`}>
      {t.export}
    </a>
  </div>

  <form
    class="account-privacy-form"
    method="POST"
    action="?/request"
    use:enhance={() =>
      async ({result}) => {
        if (result.type === 'success') {
          showToast(t.sent, 'success')
          await invalidateAll()
        } else if (result.type === 'failure') {
          showToast((result.data as {message?: string})?.message || t.request, 'error')
        }
      }}
  >
    <input type="hidden" name="csrfToken" value={data.csrfToken} />
    <h3>{t.request}</h3>
    <label>
      <span>{t.type}</span>
      <select name="requestType" required>
        <option value="access">{l.access}</option>
        <option value="portability">{l.portability}</option>
        <option value="erasure">{l.erasure}</option>
        <option value="restriction">{l.restriction}</option>
        <option value="marketing_withdrawal">{l.marketing_withdrawal}</option>
      </select>
    </label>
    <label>
      <span>{t.note} <em>({t.optional})</em></span>
      <textarea name="note" rows="3" maxlength="1000"></textarea>
    </label>
    <p class="account-privacy-note">{t.retention}</p>
    <button class="button primary" type="submit">{t.send}</button>
  </form>

  <section class="account-privacy-history">
    <h3>{t.history}</h3>
    {#if data.requests.length === 0}
      <p class="account-empty">{t.empty}</p>
    {:else}
      <ul>
        {#each data.requests as request (request.id)}
          <li>
            <span>{l[request.requestType]}</span>
            <strong>{l[request.status]}</strong>
            <time datetime={request.createdAt}>
              {new Date(request.createdAt).toLocaleDateString(data.language)}
            </time>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</Reveal>
