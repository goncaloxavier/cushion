<script lang="ts">
  import PainelRequestCard from '$lib/components/PainelRequestCard.svelte'
  import {submissionStatuses} from '$lib/painel'

  let {data} = $props()
</script>

<svelte:head>
  <title>Pedidos de catálogo | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <h1>Pedidos de catálogo</h1>
  <p>{data.rows.length} pedido(s)</p>
</header>

{#if data.rows.length === 0}
  <p class="painel-empty">Ainda não há pedidos de catálogo.</p>
{:else}
  <div class="req-list">
    {#each data.rows as row (row._id)}
      <PainelRequestCard {row} statuses={submissionStatuses} />
    {/each}
  </div>
{/if}
