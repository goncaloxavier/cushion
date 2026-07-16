<script lang="ts">
  import {fmtDateTime} from '$lib/painel'

  let {data, form} = $props()
  const member = $derived(data.member)
</script>

<svelte:head>
  <title>{member.name} | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <a class="painel-back" href="/painel/equipa">← Equipa</a>
    <h1>{member.name}</h1>
  </div>
  <span class="painel-tag" data-tone={member.active ? 'done' : 'danger'}>
    {member.active ? 'Ativa' : 'Inativa'}
  </span>
</header>

{#if form?.message}
  <p class="painel-alert" data-tone="error" role="alert">{form.message}</p>
{/if}
{#if form?.reset}
  <p class="painel-alert" data-tone="success">Palavra-passe redefinida. As sessões desta conta foram terminadas.</p>
{/if}

<div class="painel-panel">
  <h2 class="painel-panel-title">Conta</h2>
  <div class="painel-field-grid">
    <div class="painel-field">
      <span class="painel-field-label">Utilizador</span>
      <p class="painel-field-value painel-mono">@{member.username}</p>
    </div>
    <div class="painel-field">
      <span class="painel-field-label">Criada em</span>
      <p class="painel-field-value painel-mono">{fmtDateTime(member.createdAt)}</p>
    </div>
    <div class="painel-field">
      <span class="painel-field-label">Último acesso</span>
      <p class="painel-field-value painel-mono">{member.lastLoginAt ? fmtDateTime(member.lastLoginAt) : '—'}</p>
    </div>
  </div>
</div>

<div class="painel-panel">
  <h2 class="painel-panel-title">Função</h2>
  <form method="POST" action="?/updateRole" class="painel-form-row">
    <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
    <select name="role" class="painel-select">
      <option value="staff" selected={member.role === 'staff'}>Equipa</option>
      <option value="admin" selected={member.role === 'admin'}>Administrador</option>
    </select>
    <button type="submit" class="painel-btn painel-btn-primary">Guardar função</button>
  </form>

  <form method="POST" action="?/setActive" class="painel-form-row">
    <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
    <input type="hidden" name="active" value={member.active ? 'false' : 'true'} />
    <button type="submit" class="painel-btn" class:painel-btn-danger={member.active}>
      {member.active ? 'Desativar conta' : 'Reativar conta'}
    </button>
  </form>
</div>

<div class="painel-panel">
  <h2 class="painel-panel-title">Redefinir palavra-passe</h2>
  <form method="POST" action="?/resetPassword" class="painel-form-row">
    <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
    <input
      name="password"
      type="password"
      class="painel-input"
      placeholder="Nova palavra-passe (mín. 10 caracteres)"
      minlength="10"
      required
    />
    <button type="submit" class="painel-btn">Redefinir</button>
  </form>
</div>
