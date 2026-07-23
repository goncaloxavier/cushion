<script lang="ts">
  import '$lib/styles/painel.css'
  import {roleLabels, roleTone} from '$lib/painel'

  let {data, children} = $props()
  const staff = $derived(data.staff)
  const path = $derived(data.currentPath ?? '/painel')
  const isSiteBuilder = $derived(path === '/painel/site' || path.startsWith('/painel/site/'))
  let mobileMenuOpen = $state(false)

  const navGroups = $derived([
    {label: 'Visão geral', items: [{href: '/painel', label: 'Início'}]},
    {
      label: 'Vendas',
      items: [
        {href: '/painel/pedidos', label: 'Pedidos de contacto'},
        {href: '/painel/perfis', label: 'Perfis de clientes'},
        {href: '/painel/encomendas', label: 'Encomendas'},
      ],
    },
    {label: 'Site', items: [{href: '/painel/site', label: 'Website'}]},
    ...(staff?.role === 'admin'
      ? [
          {
            label: 'Administração',
            items: [
              {href: '/painel/equipa', label: 'Equipa'},
              {href: '/painel/atividade', label: 'Atividade'},
              {href: '/painel/definicoes', label: 'Definições'},
            ],
          },
        ]
      : []),
  ])

  const isActive = (href: string) => (href === '/painel' ? path === '/painel' : path.startsWith(href))

  $effect(() => {
    path
    mobileMenuOpen = false
  })
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
    <a class="painel-skip-link" href="#painel-main-content">Saltar para o conteúdo</a>
    <aside class="painel-side" class:open={mobileMenuOpen}>
      <div class="painel-side-head">
        <a class="painel-brand" href="/painel" aria-label="Início do painel">
          <img src="/logo/brand_mark.png" alt="DaFábrica4You" />
        </a>
        <button
          class="painel-menu-toggle"
          type="button"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
          title={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>

      <div class="painel-side-body">
        <nav class="painel-nav" aria-label="Navegação do painel">
          {#each navGroups as group (group.label)}
            <div class="painel-nav-group">
              <p class="painel-nav-group-label">{group.label}</p>
              {#each group.items as item (item.href)}
                <a
                  href={item.href}
                  class:active={isActive(item.href)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >{item.label}</a>
              {/each}
            </div>
          {/each}
        </nav>
        <form method="POST" action="/painel/pedidos?/logout" class="painel-account">
          <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
          <span class="painel-account-name">{staff.name}</span>
          <span class="painel-account-role">
            @{staff.username}
            <span class="painel-tag" data-tone={roleTone(staff.role)}>
              {roleLabels[staff.role] ?? staff.role}
            </span>
          </span>
          <button type="submit" class="painel-logout">Terminar sessão</button>
        </form>
      </div>
    </aside>
    {#if mobileMenuOpen}
      <button
        class="painel-menu-backdrop"
        type="button"
        aria-label="Fechar menu"
        onclick={() => (mobileMenuOpen = false)}
      ></button>
    {/if}
    <main class="painel-main" id="painel-main-content" tabindex="-1">
      <div class="painel-main-inner">
        {@render children()}
      </div>
    </main>
  </div>
{:else}
  {@render children()}
{/if}
