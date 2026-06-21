<script lang="ts">
  import PainelRequestTable from '$lib/components/PainelRequestTable.svelte'

  let {data} = $props()
</script>

<svelte:head>
  <title>Mensagens de contacto | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <h1>Mensagens de contacto</h1>
  <p>{data.rows.length} mensagem(ns)</p>
</header>

<PainelRequestTable rows={data.rows} />
