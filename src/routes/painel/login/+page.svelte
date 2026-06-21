<script lang="ts">
  let {data, form} = $props()
</script>

<svelte:head>
  <title>Entrar | Backoffice DaFábrica4You</title>
</svelte:head>

<div class="painel-login">
  <form class="painel-login-card" method="POST">
    <h1>Backoffice</h1>
    <p class="painel-login-sub">Acesso reservado à equipa.</p>

    <input type="hidden" name="next" value={data.next} />

    {#if form?.message}
      <p class="painel-login-error" role="alert">{form.message}</p>
    {/if}

    <label for="login-email">
      <span>Email</span>
      <input
        id="login-email"
        name="email"
        type="email"
        autocomplete="username"
        required
        value={form?.email ?? ''}
      />
    </label>

    <label for="login-password">
      <span>Palavra-passe</span>
      <input id="login-password" name="password" type="password" autocomplete="current-password" required />
    </label>

    <button class="button primary" type="submit">Entrar</button>
  </form>
</div>
