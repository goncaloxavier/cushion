<script lang="ts">
  let {
    name,
  }: {
    name: 'facebook' | 'instagram' | 'whatsapp' | 'youtube'
  } = $props()

  const iconUrl = $derived(`/brand-icons/${name}.svg`)
</script>

<span
  class="brand-icon"
  data-brand={name}
  style={`--brand-icon-url: url('${iconUrl}')`}
  aria-hidden="true"
>
  <span class="brand-icon-mark"></span>
</span>
