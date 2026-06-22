<script lang="ts">
  import {dismissToast, toasts} from '$lib/toast'
  import {fly} from 'svelte/transition'
</script>

<div class="toaster" role="status" aria-live="polite">
  {#each $toasts as toast (toast.id)}
    <button
      class="toast"
      data-tone={toast.tone}
      type="button"
      onclick={() => dismissToast(toast.id)}
      transition:fly={{y: -14, duration: 240}}
    >
      <span class="toast-mark" aria-hidden="true">
        {#if toast.tone === 'success'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 12 4.5 4.5L19 7" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <path d="M6 12h12" />
          </svg>
        {/if}
      </span>
      <span class="toast-message">{toast.message}</span>
    </button>
  {/each}
</div>
