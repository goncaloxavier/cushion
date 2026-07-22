<script lang="ts">
  import {page} from '$app/state'
</script>

<svelte:head>
  <title>Acesso restrito | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <h1>Acesso restrito</h1>
</header>

<div class="painel-panel">
  <p class="painel-field-text">{page.error?.message || 'Não tem permissão para aceder a esta página.'}</p>
  <p class="painel-hint">Esta área está reservada a contas de administrador.</p>
  <p class="painel-page-sub"><a href="/painel/pedidos">← Voltar aos pedidos</a></p>
</div>
