<script lang="ts">
  import {onMount} from 'svelte'

  let {data} = $props()
  let host: HTMLDivElement
  let bootError = $state('')

  onMount(() => {
    let disposed = false
    let settled = false
    let unmount = () => {}

    // A dynamic import that 404s rejects and lands in .catch below, but one whose
    // request simply stalls never settles at all — and this screen has nothing
    // else that clears it, so the editor sits on "A preparar…" indefinitely.
    // Give the wait an end so it becomes a message with a way out.
    const bootTimeout = window.setTimeout(() => {
      if (!disposed && !settled) {
        bootError = 'O editor está a demorar mais do que o normal a abrir. Verifique a ligação e tente de novo.'
      }
    }, 25_000)

    Promise.all([
      import('react'),
      import('react-dom/client'),
      import('$lib/site-editor/editor/SiteEditorApp'),
    ])
      .then(([React, ReactDom, editor]) => {
        settled = true
        if (disposed) return
        bootError = ''
        const root = ReactDom.createRoot(host)
        root.render(
          React.createElement(editor.SiteEditorApp, {
            csrfToken: data.builderCsrfToken,
            previewReady: data.previewReady,
            initialCanPublish: data.staffRole === 'admin',
          }),
        )
        unmount = () => root.unmount()
      })
      .catch(() => {
        settled = true
        if (!disposed) bootError = 'Não foi possível abrir o editor. Atualize a página e tente novamente.'
      })
      .finally(() => window.clearTimeout(bootTimeout))

    return () => {
      disposed = true
      window.clearTimeout(bootTimeout)
      unmount()
    }
  })
</script>

<svelte:head>
  <title>Editor do site | DaFábrica4You</title>
</svelte:head>

<div class="standalone-builder-host" bind:this={host}>
  <div class="standalone-builder-boot" class:is-error={bootError} aria-live="polite">
    <span>{bootError || 'A preparar o editor do site…'}</span>
    {#if bootError}
      <button type="button" onclick={() => window.location.reload()}>Tentar novamente</button>
    {/if}
  </div>
</div>

<style>
  .standalone-builder-host {
    min-height: 100vh;
  }

  .standalone-builder-boot {
    display: grid;
    place-items: center;
    gap: 1rem;
    min-height: 100vh;
    padding: 1.5rem;
    color: #53655f;
    font-size: 0.9rem;
    font-weight: 650;
    text-align: center;
  }

  .standalone-builder-boot.is-error {
    color: #922f2f;
  }

  .standalone-builder-boot button {
    padding: 0.6rem 1.1rem;
    color: #ffffff;
    font: inherit;
    background: #0a4b4e;
    border: 0;
    border-radius: 8px;
    cursor: pointer;
  }

  .standalone-builder-boot button:focus-visible {
    outline: 2px solid #0a4b4e;
    outline-offset: 2px;
  }
</style>
