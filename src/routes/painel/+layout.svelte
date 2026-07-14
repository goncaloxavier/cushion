<script lang="ts">
  import '$lib/styles/painel.css'

  let {data, children} = $props()
  const staff = $derived(data.staff)
  const path = $derived(data.currentPath ?? '/painel/pedidos')
  const isSiteBuilder = $derived(path === '/painel/site' || path.startsWith('/painel/site/'))

  const nav = $derived([
    {href: '/painel/site', label: 'Website'},
    {href: '/painel/pedidos', label: 'Pedidos'},
    {href: '/painel/perfis', label: 'Perfis de clientes'},
    {href: '/painel/encomendas', label: 'Encomendas'},
    ...(staff?.role === 'admin' ? [{href: '/painel/equipa', label: 'Equipa'}] : []),
  ])

  const isActive = (href: string) => path.startsWith(href)

  const roleLabel: Record<string, string> = {admin: 'Administrador', staff: 'Equipa'}
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if staff && isSiteBuilder}
  <div class="painel-builder-root">
    {@render children()}
  </div>
{:else if staff}
  <div class="painel">
    <aside class="painel-side">
      <div class="painel-brand">DaFábrica4You</div>
      <p class="painel-brand-sub">Backoffice</p>
      <nav class="painel-nav" aria-label="Backoffice">
        {#each nav as item (item.href)}
          <a href={item.href} class:active={isActive(item.href)}>{item.label}</a>
        {/each}
      </nav>
      <form method="POST" action="/painel/pedidos?/logout" class="painel-account">
        <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
        <span class="painel-account-name">{staff.name}</span>
        <span class="painel-account-role">@{staff.username} · {roleLabel[staff.role] ?? staff.role}</span>
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
