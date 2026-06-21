<script lang="ts">
  let {data} = $props()
  const statusLabels: Record<string, string> = {
    new: 'Novo',
    read: 'Lido',
    inProgress: 'Em acompanhamento',
    resolved: 'Resolvido',
    spam: 'Spam',
    archived: 'Arquivado',
  }
  const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString('pt-PT') : '')
  const sourceLabel = (source: string) => (source === 'catalogue' ? 'Catálogo' : 'Contacto')
</script>

<svelte:head>
  <title>Resumo | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <h1>Resumo</h1>
</header>

<div class="painel-stats">
  <a class="painel-stat" href="/painel/contactos">
    <strong>{data.stats.contact}</strong>
    <span>Mensagens de contacto</span>
  </a>
  <a class="painel-stat" href="/painel/catalogo">
    <strong>{data.stats.catalogue}</strong>
    <span>Pedidos de catálogo</span>
  </a>
  <a class="painel-stat" href="/painel/perfis">
    <strong>{data.stats.profiles}</strong>
    <span>Perfis de clientes</span>
  </a>
  <div class="painel-stat" data-tone="accent">
    <strong>{data.stats.newTotal}</strong>
    <span>Pedidos por tratar</span>
  </div>
</div>

<section class="painel-section">
  <h2>Pedidos recentes</h2>
  {#if data.recent.length === 0}
    <p class="painel-empty">Ainda não há pedidos.</p>
  {:else}
    <table class="painel-table">
      <thead>
        <tr><th>Data</th><th>Origem</th><th>Nome</th><th>Email</th><th>Estado</th></tr>
      </thead>
      <tbody>
        {#each data.recent as row}
          <tr>
            <td>{fmtDate(row.submittedAt)}</td>
            <td>{sourceLabel(row.source)}</td>
            <td>{row.name}</td>
            <td><a href={`mailto:${row.email}`}>{row.email}</a></td>
            <td>{statusLabels[row.status] ?? row.status}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>
