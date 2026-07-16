<script lang="ts">
  import {lineReveal} from '$lib/actions/line-reveal'
  import Reveal from '$lib/components/Reveal.svelte'
  import '$lib/styles/account.css'
  import '$lib/styles/account-checkout.css'
  import type {Snippet} from 'svelte'

  let {
    kicker,
    title,
    lead,
    children,
  }: {
    language?: string
    kicker: string
    title: string
    lead?: string
    children: Snippet
  } = $props()
</script>

<main class="auth-simple">
  <section class="auth-shell">
    <Reveal class="auth-intro" variant="hero" priority>
      <p class="kicker">{kicker}</p>
      <h1 use:lineReveal>{title}</h1>
      {#if lead}
        <p class="auth-card-lead">{lead}</p>
      {/if}
    </Reveal>

    <Reveal class="auth-card" variant="panel" delay={100}>
      {@render children()}
    </Reveal>
  </section>
</main>
