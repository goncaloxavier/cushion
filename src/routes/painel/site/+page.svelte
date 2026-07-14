<script lang="ts">
  import {onMount} from 'svelte'

  let {data} = $props()
  let host: HTMLDivElement
  let bootError = $state('')

  onMount(() => {
    let disposed = false
    let unmount = () => {}

    Promise.all([
      import('react'),
      import('react-dom/client'),
      import('$lib/site-editor/editor/SiteEditorApp'),
    ])
      .then(([React, ReactDom, editor]) => {
        if (disposed) return
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
        if (!disposed) bootError = 'Não foi possível abrir o editor. Atualize a página e tente novamente.'
      })

    return () => {
      disposed = true
      unmount()
    }
  })
</script>

<svelte:head>
  <title>Editor do site | DaFábrica4You</title>
</svelte:head>

<div class="standalone-builder-host" bind:this={host}>
  <div class="standalone-builder-boot" class:is-error={bootError} aria-live="polite">
    {bootError || 'A preparar o editor do site…'}
  </div>
</div>

<style>
  .standalone-builder-host {
    min-height: 100vh;
  }

  .standalone-builder-boot {
    display: grid;
    place-items: center;
    min-height: 100vh;
    color: #53655f;
    font-size: 0.9rem;
    font-weight: 650;
  }

  .standalone-builder-boot.is-error {
    color: #922f2f;
  }
</style>
