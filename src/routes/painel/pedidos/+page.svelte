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
  <title>Pedidos | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <h1>Pedidos</h1>
  <p class="painel-page-sub">{data.rows.length} pedido(s)</p>
</header>

<div class="painel-toolbar">
  <div class="painel-filter-tabs">
    {#each tabs as tab (tab.value)}
      <a href={`/painel/pedidos?source=${tab.value}`} class:active={data.filter === tab.value}>{tab.label}</a>
    {/each}
  </div>
</div>

<PainelRequestTable rows={data.rows} showSource={data.filter === 'all'} />
