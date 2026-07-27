<script lang="ts">
  import {enhance} from '$app/forms'
  import {invalidateAll} from '$app/navigation'
  import {showToast} from '$lib/toast'

  let {data} = $props()

  const severityLabel: Record<string, string> = {
    warning: 'Atenção',
    error: 'Erro',
    critical: 'Crítico',
  }
</script>

<svelte:head>
  <title>Alertas | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <p class="painel-eyebrow">Operação</p>
    <h1>Alertas</h1>
    <p class="painel-page-sub">Falhas técnicas que precisam de confirmação.</p>
  </div>
  <a class="painel-head-action" href={data.includeResolved ? '/painel/incidentes' : '/painel/incidentes?resolvidos=1'}>
    {data.includeResolved ? 'Ocultar resolvidos' : 'Mostrar resolvidos'}
  </a>
</header>

{#if data.incidents.length === 0}
  <p class="painel-empty">Sem alertas para mostrar.</p>
{:else}
  <div class="painel-incident-list">
    {#each data.incidents as incident (incident.id)}
      <article class="painel-panel painel-incident" data-resolved={Boolean(incident.resolvedAt)}>
        <header class="painel-panel-head">
          <div>
            <p class="painel-eyebrow">{incident.category}</p>
            <h2>{incident.title}</h2>
          </div>
          <span class="painel-tag" data-tone={incident.severity === 'warning' ? 'progress' : 'danger'}>
            {severityLabel[incident.severity] ?? incident.severity}
          </span>
        </header>
        {#if incident.detail}<p>{incident.detail}</p>{/if}
        <p class="painel-form-note">
          Última ocorrência: {new Date(incident.lastSeenAt).toLocaleString('pt-PT')}
          · {incident.occurrences} {incident.occurrences === 1 ? 'ocorrência' : 'ocorrências'}
        </p>
        {#if incident.resolvedAt}
          <span class="painel-tag" data-tone="done">Resolvido</span>
        {:else}
          <form
            method="POST"
            action="?/resolve"
            use:enhance={() => async ({result}) => {
              if (result.type === 'success') {
                showToast('Alerta marcado como resolvido.', 'success')
                await invalidateAll()
              } else {
                showToast(
                  result.type === 'failure'
                    ? ((result.data as {message?: string})?.message ?? 'Não foi possível resolver.')
                    : 'Não foi possível resolver.',
                  'error',
                )
              }
            }}
          >
            <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
            <input type="hidden" name="id" value={incident.id} />
            <button type="submit">Marcar como resolvido</button>
          </form>
        {/if}
      </article>
    {/each}
  </div>
{/if}

<style>
  .painel-incident-list {
    display: grid;
    gap: 1rem;
  }

  .painel-incident[data-resolved='true'] {
    opacity: 0.72;
  }
</style>
