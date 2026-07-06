<script lang="ts">
  import Reveal from '$lib/components/Reveal.svelte'
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
    <Reveal class="auth-intro" variant="panel" priority>
      <p class="kicker">{kicker}</p>
      <h1>{title}</h1>
      {#if lead}
        <p class="auth-card-lead">{lead}</p>
      {/if}
    </Reveal>

    <Reveal class="auth-card" variant="panel" delay={80} priority>
      {@render children()}
    </Reveal>
  </section>
</main>
