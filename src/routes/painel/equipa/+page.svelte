<script lang="ts">
  import {activeTone, fmtDateTime, roleDescriptions, roleLabels, roleTone} from '$lib/painel'

  let {data, form} = $props()
</script>

<svelte:head>
  <title>Equipa | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <p class="painel-eyebrow">Administração</p>
    <h1>Equipa</h1>
    <p class="painel-page-sub">{data.staff.length} {data.staff.length === 1 ? 'conta com acesso' : 'contas com acesso'}</p>
  </div>
</header>

{#if form?.message}
  <p class="painel-alert" data-tone="error" role="alert">{form.message}</p>
{/if}

<div class="painel-team-layout">
  <div class="painel-table-wrap">
    <table class="painel-table">
      <thead>
        <tr>
          <th scope="col">Nome</th>
          <th scope="col">Utilizador</th>
          <th scope="col">Função</th>
          <th scope="col">Estado</th>
          <th scope="col">Último acesso</th>
        </tr>
      </thead>
      <tbody>
        {#each data.staff as member (member.id)}
          <tr>
            <td data-label="Nome"><a href={`/painel/equipa/${member.id}`}>{member.name}</a></td>
            <td data-label="Utilizador" class="painel-mono">@{member.username}</td>
            <td data-label="Função">
              <span class="painel-tag" data-tone={roleTone(member.role)}>
                {roleLabels[member.role] ?? member.role}
              </span>
            </td>
            <td data-label="Estado">
              <span class="painel-tag" data-tone={activeTone(member.active)}>
                {member.active ? 'Ativa' : 'Inativa'}
              </span>
            </td>
            <td data-label="Último acesso" class="painel-mono">{member.lastLoginAt ? fmtDateTime(member.lastLoginAt) : '—'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <aside class="painel-panel painel-create-account">
    <header class="painel-panel-head">
      <div>
        <p class="painel-eyebrow">Novo acesso</p>
        <h2>Criar conta</h2>
      </div>
    </header>
    <form method="POST" action="?/create" class="painel-form-stack">
      <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
      <label class="painel-control">
        <span>Nome</span>
        <input name="name" class="painel-input" autocomplete="name" maxlength="160" required />
      </label>
      <label class="painel-control">
        <span>Utilizador</span>
        <input name="username" class="painel-input" autocomplete="off" maxlength="120" required />
      </label>
      <label class="painel-control">
        <span>Palavra-passe</span>
        <input
          name="password"
          type="password"
          class="painel-input"
          autocomplete="new-password"
          minlength="10"
          required
        />
        <small>Mínimo de 10 caracteres.</small>
      </label>
      <label class="painel-control">
        <span>Função</span>
        <select name="role" class="painel-select">
          <option value="staff">Equipa</option>
          <option value="admin">Administrador</option>
        </select>
      </label>
      <button type="submit" class="painel-btn painel-btn-primary">Criar conta</button>
      <p class="painel-hint">
        <strong>{roleLabels.admin}:</strong> {roleDescriptions.admin}<br />
        <strong>{roleLabels.staff}:</strong> {roleDescriptions.staff}
      </p>
    </form>
  </aside>
</div>
