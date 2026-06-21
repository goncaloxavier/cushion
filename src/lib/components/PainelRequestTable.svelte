<script lang="ts">
  import type {SubmissionRow} from '$lib/server/crm-admin'
  import {fmtDateTime, sourceLabel, submissionStatusLabels} from '$lib/painel'

  let {rows, showSource = false}: {rows: SubmissionRow[]; showSource?: boolean} = $props()
</script>

{#if rows.length === 0}
  <p class="painel-empty">Sem pedidos para mostrar.</p>
{:else}
  <table class="painel-table">
    <thead>
      <tr>
        <th>Data</th>
        {#if showSource}<th>Origem</th>{/if}
        <th>Nome</th>
        <th>Email</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row._id)}
        <tr>
          <td><a href={`/painel/pedidos/${row._id}`}>{fmtDateTime(row.submittedAt)}</a></td>
          {#if showSource}<td>{sourceLabel(row.source)}</td>{/if}
          <td><a href={`/painel/pedidos/${row._id}`}>{row.name}</a></td>
          <td>{row.email}</td>
          <td>{submissionStatusLabels[row.status] ?? row.status}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
