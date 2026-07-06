<script lang="ts">
  import PainelRequestTable from '$lib/components/PainelRequestTable.svelte'

  let {data} = $props()
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
  <a class="painel-stat" href="/painel/encomendas">
    <strong>{data.stats.orders}</strong>
    <span>Encomendas da loja</span>
  </a>
  <div class="painel-stat" data-tone="accent">
    <strong>{data.stats.newTotal + data.stats.pendingPaymentLink}</strong>
    <span>Pedidos por tratar</span>
  </div>
</div>

<section class="painel-section">
  <h2>Pedidos recentes</h2>
  <PainelRequestTable rows={data.recent} showSource />
</section>
