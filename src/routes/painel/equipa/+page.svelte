<script lang="ts">
  import {fmtDateTime} from '$lib/painel'

  let {data, form} = $props()

  const roleLabel: Record<string, string> = {admin: 'Administrador', staff: 'Equipa'}
</script>

<svelte:head>
  <title>Equipa | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <h1>Equipa</h1>
  <p class="painel-page-sub">{data.staff.length} conta(s)</p>
</header>

{#if form?.message}
  <p class="painel-alert" data-tone="error" role="alert">{form.message}</p>
{/if}

<div class="painel-table-wrap">
  <table class="painel-table">
    <thead>
      <tr>
        <th>Nome</th>
        <th>Utilizador</th>
        <th>Função</th>
        <th>Estado</th>
        <th>Último acesso</th>
      </tr>
    </thead>
    <tbody>
      {#each data.staff as member (member.id)}
        <tr>
          <td><a href={`/painel/equipa/${member.id}`}>{member.name}</a></td>
          <td class="painel-mono">@{member.username}</td>
          <td>{roleLabel[member.role] ?? member.role}</td>
          <td>
            <span class="painel-tag" data-tone={member.active ? 'done' : 'danger'}>
              {member.active ? 'Ativa' : 'Inativa'}
            </span>
          </td>
          <td class="painel-mono">{member.lastLoginAt ? fmtDateTime(member.lastLoginAt) : '—'}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<div class="painel-panel" style="margin-top: 1.5rem">
  <h2 class="painel-panel-title">Nova conta</h2>
  <form method="POST" action="?/create">
    <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
    <div class="painel-form-row">
      <input name="name" class="painel-input" placeholder="Nome" maxlength="160" required />
      <input name="username" class="painel-input" placeholder="Utilizador" maxlength="120" required />
    </div>
    <div class="painel-form-row">
      <input
        name="password"
        type="password"
        class="painel-input"
        placeholder="Palavra-passe (mín. 10 caracteres)"
        minlength="10"
        required
      />
      <select name="role" class="painel-select">
        <option value="staff">Equipa</option>
        <option value="admin">Administrador</option>
      </select>
      <button type="submit" class="painel-btn painel-btn-primary">Criar conta</button>
    </div>
  </form>
</div>
