<script lang="ts">
  import PainelRequestCard from '$lib/components/PainelRequestCard.svelte'
  import {submissionStatuses} from '$lib/painel'

  let {data} = $props()
</script>

<svelte:head>
  <title>Mensagens de contacto | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <h1>Mensagens de contacto</h1>
  <p>{data.rows.length} mensagem(ns)</p>
</header>

{#if data.rows.length === 0}
  <p class="painel-empty">Ainda não há mensagens de contacto.</p>
{:else}
  <div class="req-list">
    {#each data.rows as row (row._id)}
      <PainelRequestCard {row} statuses={submissionStatuses} />
    {/each}
  </div>
{/if}
