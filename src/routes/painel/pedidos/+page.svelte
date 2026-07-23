<script lang="ts">
  import PainelRequestTable from '$lib/components/PainelRequestTable.svelte'

  let {data} = $props()

  const tabs = [
    {value: 'all', label: 'Todos'},
    {value: 'contact', label: 'Contacto'},
    {value: 'catalogue', label: 'Catálogo'},
  ] as const
</script>

<svelte:head>
  <title>Pedidos de contacto | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <p class="painel-eyebrow">Vendas</p>
    <h1>Pedidos de contacto</h1>
    <p class="painel-page-sub">{data.rows.length} {data.rows.length === 1 ? 'pedido recebido' : 'pedidos recebidos'}</p>
  </div>
</header>

<section class="painel-data-view">
  <div class="painel-toolbar">
    <span class="painel-toolbar-label">Origem</span>
    <div class="painel-filter-tabs">
      {#each tabs as tab (tab.value)}
        <a href={`/painel/pedidos?source=${tab.value}`} class:active={data.filter === tab.value}>{tab.label}</a>
      {/each}
    </div>
  </div>

  <PainelRequestTable rows={data.rows} showSource={data.filter === 'all'} />
</section>
