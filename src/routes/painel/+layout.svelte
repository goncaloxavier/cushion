<script lang="ts">
  let {data, children} = $props()
  const staff = $derived(data.staff)
  const path = $derived(data.currentPath ?? '/painel')

  const nav = [
    {href: '/painel', label: 'Resumo'},
    {href: '/painel/perfis', label: 'Perfis de clientes'},
    {href: '/painel/catalogo', label: 'Pedidos de catálogo'},
    {href: '/painel/contactos', label: 'Mensagens de contacto'},
  ]

  const isActive = (href: string) =>
    href === '/painel' ? path === '/painel' : path.startsWith(href)
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if staff}
  <div class="painel">
    <aside class="painel-side">
      <div class="painel-brand">DaFábrica4You</div>
      <p class="painel-brand-sub">Pedidos &amp; Clientes</p>
      <nav class="painel-nav" aria-label="Backoffice">
        {#each nav as item}
          <a href={item.href} class:active={isActive(item.href)}>{item.label}</a>
        {/each}
      </nav>
      <form method="POST" action="/painel?/logout" class="painel-account">
        <span class="painel-account-name">{staff.name}</span>
        <span class="painel-account-email">{staff.email}</span>
        <button type="submit" class="painel-logout">Terminar sessão</button>
      </form>
    </aside>
    <main class="painel-main">
      {@render children()}
    </main>
  </div>
{:else}
  {@render children()}
{/if}
