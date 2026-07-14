<script lang="ts">
  import type {SubmissionRow} from '$lib/server/crm-postgres'
  import {fmtDateTime, sourceLabel, submissionStatusLabels, submissionStatusTone} from '$lib/painel'

  let {rows, showSource = false}: {rows: SubmissionRow[]; showSource?: boolean} = $props()
</script>

{#if rows.length === 0}
  <p class="painel-empty">Sem pedidos para mostrar.</p>
{:else}
  <div class="painel-table-wrap">
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
        {#each rows as row (row.id)}
          <tr>
            <td class="painel-mono"><a href={`/painel/pedidos/${row.id}`}>{fmtDateTime(row.submittedAt)}</a></td>
            {#if showSource}<td>{sourceLabel(row.source)}</td>{/if}
            <td><a href={`/painel/pedidos/${row.id}`}>{row.name}</a></td>
            <td>{row.email}</td>
            <td>
              <span class="painel-tag" data-tone={submissionStatusTone(row.status)}>
                {submissionStatusLabels[row.status] ?? row.status}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
