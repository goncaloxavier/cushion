<script lang="ts">
  let {data, form} = $props()

  const sourceLabel: Record<string, string> = {
    override: 'Chave personalizada',
    env: 'Chave de ambiente (padrão)',
    none: 'Não configurada',
  }

  const usagePercent = $derived(
    data.usage && data.usage.limit > 0
      ? Math.min(100, Math.round((data.usage.count / data.usage.limit) * 100))
      : null,
  )
  const usageTone = $derived(
    usagePercent === null ? undefined : usagePercent >= 95 ? 'danger' : usagePercent >= 80 ? 'progress' : 'done',
  )
  const numberFormat = new Intl.NumberFormat('pt-PT')
</script>

<svelte:head>
  <title>Definições | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <p class="painel-eyebrow">Administração</p>
    <h1>Definições</h1>
    <p class="painel-page-sub">Serviços usados pelo website.</p>
  </div>
</header>

{#if form?.message}
  <p class="painel-alert" data-tone="error" role="alert">{form.message}</p>
{/if}
{#if form?.saved}
  <p class="painel-alert" data-tone="success">Chave guardada e validada junto do DeepL.</p>
{/if}
{#if form?.cleared}
  <p class="painel-alert" data-tone="success">Chave personalizada removida. A usar a chave de ambiente.</p>
{/if}

<div class="painel-settings-layout">
  <section class="painel-panel">
    <header class="painel-panel-head">
      <div>
        <p class="painel-eyebrow">DeepL</p>
        <h2>Tradução automática</h2>
      </div>
      <span class="painel-tag" data-tone={data.usage ? 'done' : 'danger'}>
        {data.usage ? 'Operacional' : 'Verificar'}
      </span>
    </header>
    <p class="painel-panel-copy">
      Traduz os textos publicados em português para inglês e espanhol.
    </p>

    <div class="painel-field-grid">
      <div class="painel-field">
        <span class="painel-field-label">Origem da chave</span>
        <p class="painel-field-value">{sourceLabel[data.status.source]}</p>
      </div>
      {#if data.status.maskedKey}
        <div class="painel-field">
          <span class="painel-field-label">Chave atual</span>
          <p class="painel-field-value painel-mono">{data.status.maskedKey}</p>
        </div>
      {/if}
      {#if data.status.source === 'override' && data.status.updatedAt}
        <div class="painel-field">
          <span class="painel-field-label">Última alteração</span>
          <p class="painel-field-value painel-mono">
            {new Date(data.status.updatedAt).toLocaleString('pt-PT')}
            {#if data.status.updatedBy}<br />@{data.status.updatedBy}{/if}
          </p>
        </div>
      {/if}
    </div>

    {#if data.usage}
      <div class="painel-usage">
        <div class="painel-usage-head">
          <span>Caracteres utilizados</span>
          <strong>{usagePercent}%</strong>
        </div>
        <div class="painel-progress-track" aria-label={`${usagePercent}% dos caracteres utilizados`}>
          <i class="painel-progress-fill" data-tone={usageTone} style={`width: ${usagePercent}%`}></i>
        </div>
        <p class="painel-hint painel-mono">
          {numberFormat.format(data.usage.count)} de {numberFormat.format(data.usage.limit)} caracteres
        </p>
      </div>
    {:else}
      <p class="painel-alert" data-tone="error">
        Não foi possível consultar o consumo. Verifique a chave atual.
      </p>
    {/if}
  </section>

  <aside class="painel-panel">
    <header class="painel-panel-head">
      <div>
        <p class="painel-eyebrow">Acesso</p>
        <h2>Chave DeepL</h2>
      </div>
    </header>
    <form method="POST" action="?/saveKey" class="painel-form-stack">
      <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
      <label class="painel-control">
        <span>Nova chave da API</span>
      <input
        name="key"
        class="painel-input"
        autocomplete="off"
        spellcheck="false"
        required
      />
        <small>A chave é validada antes de ser guardada.</small>
      </label>
      <button type="submit" class="painel-btn painel-btn-primary">Guardar nova chave</button>
    </form>

    {#if data.status.source === 'override'}
      <div class="painel-divider"></div>
      <form method="POST" action="?/clearKey">
        <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
        <button type="submit" class="painel-btn painel-btn-danger">Usar chave padrão</button>
      </form>
    {/if}
  </aside>
</div>
