<script lang="ts">
  import {enhance} from '$app/forms'
  import {invalidateAll} from '$app/navigation'
  import {showToast} from '$lib/toast'

  let {data} = $props()

  const typeLabels: Record<string, string> = {
    access: 'Acesso aos dados',
    portability: 'Portabilidade',
    erasure: 'Eliminação',
    restriction: 'Limitação',
    marketing_withdrawal: 'Retirada de marketing',
  }
  const statusLabels: Record<string, string> = {
    new: 'Recebido',
    in_progress: 'Em análise',
    completed: 'Concluído',
    rejected: 'Não aplicável',
  }
</script>

<svelte:head>
  <title>Privacidade | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <p class="painel-eyebrow">Clientes</p>
    <h1>Pedidos de privacidade</h1>
    <p class="painel-page-sub">
      {data.rows.length} {data.rows.length === 1 ? 'pedido' : 'pedidos'}
    </p>
  </div>
</header>

<section class="painel-data-view">
  <form method="GET" class="painel-toolbar">
    <label>
      <span class="painel-toolbar-label">Estado</span>
      <select name="status">
        <option value="">Todos</option>
        {#each Object.entries(statusLabels) as [value, label]}
          <option value={value} selected={data.status === value}>{label}</option>
        {/each}
      </select>
    </label>
    <button type="submit">Filtrar</button>
  </form>

  {#if data.rows.length === 0}
    <p class="painel-empty">Sem pedidos para mostrar.</p>
  {:else}
    <div class="painel-privacy-list">
      {#each data.rows as request (request.id)}
        <article class="painel-detail-card">
          <header class="painel-detail-card-head">
            <div>
              <p class="painel-eyebrow">{typeLabels[request.requestType] ?? request.requestType}</p>
              <h2>{request.customerEmail}</h2>
              <p class="painel-page-sub">
                {new Date(request.createdAt).toLocaleString('pt-PT')}
              </p>
            </div>
            <span class="painel-tag">{statusLabels[request.status] ?? request.status}</span>
          </header>

          {#if request.customerNote}
            <p>{request.customerNote}</p>
          {/if}

          {#if request.customerId && (request.requestType === 'access' || request.requestType === 'portability')}
            <p>
              <a class="painel-text-link" href={`/painel/privacidade/${request.id}/exportar`}>
                Descarregar dados do cliente
              </a>
            </p>
          {/if}

          {#if request.requestType === 'erasure' && request.status !== 'completed'}
            <p class="painel-form-note">
              Ao marcar como concluído, a conta e os dados CRM são removidos. As encomendas ficam
              sem ligação à conta e conservam apenas os dados exigidos por lei.
            </p>
          {/if}

          <form
            method="POST"
            action="?/update"
            class="painel-form"
            use:enhance={() =>
              async ({result}) => {
                if (result.type === 'success') {
                  showToast('Pedido atualizado.', 'success')
                  await invalidateAll()
                } else if (result.type === 'failure') {
                  showToast(
                    (result.data as {message?: string})?.message || 'Não foi possível atualizar.',
                    'error',
                  )
                }
              }}
          >
            <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
            <input type="hidden" name="id" value={request.id} />
            <label>
              <span>Estado</span>
              <select name="status">
                {#each Object.entries(statusLabels) as [value, label]}
                  <option value={value} selected={request.status === value}>{label}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Nota interna</span>
              <textarea name="internalNote" rows="3">{request.internalNote}</textarea>
            </label>
            <button type="submit">Guardar</button>
          </form>
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .painel-privacy-list {
    display: grid;
    gap: 1rem;
  }

  .painel-detail-card-head {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 1rem;
  }

  .painel-detail-card-head h2 {
    overflow-wrap: anywhere;
  }
</style>
