<script lang="ts">
  import {onMount} from 'svelte'

  export type CookieNoticeStrings = {
    message: string
    learnMore: string
    accept: string
  }

  let {policyUrl, strings} = $props<{
    policyUrl: string
    strings: CookieNoticeStrings
  }>()

  const storageKey = 'df4y-cookie-notice-seen'
  let show = $state(false)

  onMount(() => {
    try {
      if (!localStorage.getItem(storageKey)) show = true
    } catch {
      // ignore storage failures (private mode etc.)
    }
  })

  const dismiss = () => {
    show = false
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }
</script>

{#if show}
  <div class="cookie-notice" role="dialog" aria-label={strings.message}>
    <p>
      {strings.message}
      <a href={policyUrl} target="_blank" rel="noreferrer">{strings.learnMore}</a>
    </p>
    <button type="button" class="button secondary" onclick={dismiss}>{strings.accept}</button>
  </div>
{/if}
