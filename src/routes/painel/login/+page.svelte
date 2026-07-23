<script lang="ts">
  let {data, form} = $props()
</script>

<svelte:head>
  <title>Entrar | Backoffice DaFábrica4You</title>
</svelte:head>

<div class="painel-login">
  <div class="painel-login-shell">
    <header class="painel-login-brand">
      <img src="/logo/brand_mark.png" alt="DaFábrica4You" />
    </header>

    <form class="painel-login-card" method="POST">
      <div>
        <p class="painel-login-eyebrow">Acesso interno</p>
        <h1>Backoffice</h1>
      </div>

      <input type="hidden" name="next" value={data.next} />
      <input type="hidden" name="csrfToken" value={data.csrfToken} />

      {#if form?.message}
        <p class="painel-alert" data-tone="error" role="alert">{form.message}</p>
      {/if}

      <label for="login-username">
        <span>Utilizador</span>
        <input
          id="login-username"
          name="username"
          type="text"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          required
          value={form?.username ?? ''}
        />
      </label>

      <label for="login-password">
        <span>Palavra-passe</span>
        <input id="login-password" name="password" type="password" autocomplete="current-password" required />
      </label>

      <button type="submit">Entrar</button>
    </form>
  </div>
</div>
