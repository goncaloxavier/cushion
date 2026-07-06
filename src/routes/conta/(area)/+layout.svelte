<script lang="ts">
  import AccountLayout from '$lib/components/AccountLayout.svelte'

  let {children, data} = $props()
</script>

<AccountLayout language={data.language} csrfToken={data.csrfToken}>
  {@render children()}
</AccountLayout>
