<script lang="ts">
  import {fmtDateTime, roleDescriptions, roleLabels, roleTone} from '$lib/painel'

  let {data, form} = $props()
  const member = $derived(data.member)
</script>

<svelte:head>
  <title>{member.name} | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <a class="painel-back" href="/painel/equipa">← Equipa</a>
    <p class="painel-eyebrow">Conta de equipa</p>
    <h1>{member.name}</h1>
    <p class="painel-page-sub painel-mono">@{member.username}</p>
  </div>
  <div class="painel-head-tags">
    <span class="painel-tag" data-tone={roleTone(member.role)}>
      {roleLabels[member.role] ?? member.role}
    </span>
    <span class="painel-tag" data-tone={member.active ? 'done' : 'danger'}>
      {member.active ? 'Ativa' : 'Inativa'}
    </span>
  </div>
</header>

{#if form?.message}
  <p class="painel-alert" data-tone="error" role="alert">{form.message}</p>
{/if}
{#if form?.reset}
  <p class="painel-alert" data-tone="success">Palavra-passe redefinida. As sessões desta conta foram terminadas.</p>
{/if}

<div class="painel-detail-layout painel-staff-detail">
  <div class="painel-detail-main">
    <section class="painel-panel">
      <header class="painel-panel-head">
        <div>
          <p class="painel-eyebrow">Identificação</p>
          <h2>Dados da conta</h2>
        </div>
      </header>
      <div class="painel-field-grid">
        <div class="painel-field">
          <span class="painel-field-label">Nome</span>
          <p class="painel-field-value">{member.name}</p>
        </div>
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
          <p class="painel-field-value painel-mono">{member.lastLoginAt ? fmtDateTime(member.lastLoginAt) : 'Nunca'}</p>
        </div>
      </div>
    </section>

    <section class="painel-panel">
      <h2 class="painel-panel-title">Permissões</h2>
      <form method="POST" action="?/updateRole" class="painel-form-stack">
        <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
        <label class="painel-control">
          <span>Função</span>
          <select name="role" class="painel-select">
            <option value="staff" selected={member.role === 'staff'}>Equipa</option>
            <option value="admin" selected={member.role === 'admin'}>Administrador</option>
          </select>
        </label>
        <p class="painel-hint">
          <strong>{roleLabels.admin}:</strong> {roleDescriptions.admin}<br />
          <strong>{roleLabels.staff}:</strong> {roleDescriptions.staff}
        </p>
        <button type="submit" class="painel-btn painel-btn-primary">Guardar função</button>
      </form>
    </section>
  </div>

  <aside class="painel-detail-rail">
    <section class="painel-panel">
      <h2 class="painel-panel-title">Palavra-passe</h2>
      <form method="POST" action="?/resetPassword" class="painel-form-stack">
        <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
        <label class="painel-control">
          <span>Nova palavra-passe</span>
          <input
            name="password"
            type="password"
            class="painel-input"
            autocomplete="new-password"
            minlength="10"
            required
          />
          <small>Mínimo de 10 caracteres. As sessões atuais serão terminadas.</small>
        </label>
        <button type="submit" class="painel-btn">Redefinir palavra-passe</button>
      </form>
    </section>

    <section class="painel-panel painel-danger-zone">
      <h2 class="painel-panel-title">Acesso</h2>
      <p class="painel-hint">
        {member.active ? 'Desativar impede novos acessos desta conta.' : 'Reativar volta a permitir o acesso ao backoffice.'}
      </p>
      <form method="POST" action="?/setActive">
        <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
        <input type="hidden" name="active" value={member.active ? 'false' : 'true'} />
        <button type="submit" class="painel-btn" class:painel-btn-danger={member.active}>
          {member.active ? 'Desativar conta' : 'Reativar conta'}
        </button>
      </form>
    </section>
  </aside>
</div>
