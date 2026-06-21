<script lang="ts">
  import PainelRequestTable from '$lib/components/PainelRequestTable.svelte'

  let {data} = $props()
</script>

<svelte:head>
  <title>Pedidos de catálogo | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <h1>Pedidos de catálogo</h1>
  <p>{data.rows.length} pedido(s)</p>
</header>

<PainelRequestTable rows={data.rows} />
