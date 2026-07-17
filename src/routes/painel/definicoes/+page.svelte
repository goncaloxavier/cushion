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
  <h1>Definições</h1>
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

<div class="painel-panel">
  <h2 class="painel-panel-title">Tradução automática (DeepL)</h2>
  <p class="painel-page-sub" style="margin-bottom: 1rem">
    Os textos são traduzidos automaticamente do português para inglês e espanhol. O plano gratuito do
    DeepL permite 1&nbsp;000&nbsp;000 de caracteres, no total, para sempre. Quando esse limite for
    atingido, crie uma nova conta gratuita no DeepL e cole aqui a nova chave — não é preciso pedir
    ajuda técnica nem esperar por um novo lançamento do site.
  </p>

  <div class="painel-field-grid">
    <div class="painel-field">
      <span class="painel-field-label">Origem da chave</span>
      <p class="painel-field-value">
        <span class="painel-tag" data-tone={data.status.source === 'override' ? 'done' : undefined}>
          {sourceLabel[data.status.source]}
        </span>
      </p>
    </div>
    {#if data.status.maskedKey}
      <div class="painel-field">
        <span class="painel-field-label">Chave atual</span>
        <p class="painel-field-value painel-mono">{data.status.maskedKey}</p>
      </div>
    {/if}
    {#if data.status.source === 'override' && data.status.updatedAt}
      <div class="painel-field">
        <span class="painel-field-label">Definida em</span>
        <p class="painel-field-value painel-mono">
          {new Date(data.status.updatedAt).toLocaleString('pt-PT')}
          {#if data.status.updatedBy}
            <span class="painel-mono">· @{data.status.updatedBy}</span>
          {/if}
        </p>
      </div>
    {/if}
  </div>

  {#if data.usage}
    <div class="painel-field painel-field-block" style="margin-top: 1rem">
      <span class="painel-field-label">Caracteres usados (plano gratuito)</span>
      <div class="painel-progress">
        <div class="painel-progress-track">
          <i class="painel-progress-fill" data-tone={usageTone} style={`width: ${usagePercent}%`}></i>
        </div>
        <p class="painel-field-value painel-mono">
          {numberFormat.format(data.usage.count)} / {numberFormat.format(data.usage.limit)} ({usagePercent}%)
        </p>
      </div>
    </div>
  {:else}
    <p class="painel-alert" data-tone="error" style="margin-top: 1rem">
      Não foi possível obter o consumo junto do DeepL com a chave atual. Verifique se a chave ainda é
      válida.
    </p>
  {/if}
</div>

<div class="painel-panel">
  <h2 class="painel-panel-title">Trocar a chave da API</h2>
  <form method="POST" action="?/saveKey">
    <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
    <div class="painel-form-row">
      <input
        name="key"
        class="painel-input"
        placeholder="Nova chave da API do DeepL"
        autocomplete="off"
        spellcheck="false"
        required
      />
      <button type="submit" class="painel-btn painel-btn-primary">Guardar e validar</button>
    </div>
  </form>

  {#if data.status.source === 'override'}
    <form method="POST" action="?/clearKey" style="margin-top: 0.5rem">
      <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
      <button type="submit" class="painel-btn painel-btn-danger">Remover chave personalizada</button>
    </form>
  {/if}
</div>
