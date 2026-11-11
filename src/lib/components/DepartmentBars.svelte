<script lang="ts">
	import { percent } from '#lib/format.ts';
	import type { Filters } from '#lib/filters.ts';

	export type DepartmentRow = { department: NonNullable<Filters['department']>; click_rate: number };

	let {
		rows,
		selected,
		onselect
	}: {
		rows: DepartmentRow[];
		selected: Filters['department'];
		onselect: (department: Filters['department']) => void;
	} = $props();

	const max = $derived(Math.max(0.01, ...rows.map((row) => row.click_rate)));
</script>

<section class="panel">
	<h2>Click rate by department</h2>
	<p class="hint">Select a department to filter the page.</p>
	<ul>
		{#each rows as row (row.department)}
			<li>
				<button
					type="button"
					aria-pressed={selected === row.department}
					class:dimmed={selected && selected !== row.department}
					onclick={() => onselect(selected === row.department ? null : row.department)}
				>
					<span class="name">{row.department}</span>
					<span class="track"><span class="bar" style:width="{(row.click_rate / max) * 100}%"></span></span>
					<span class="value">{percent(row.click_rate)}</span>
				</button>
			</li>
		{/each}
	</ul>
</section>

<style>
	ul {
		list-style: none;
		margin: 10px 0 0;
		padding: 0;
		display: grid;
		gap: 2px;
	}

	button {
		display: grid;
		grid-template-columns: 92px 1fr 52px;
		gap: 8px;
		align-items: center;
		width: 100%;
		min-height: 32px;
		padding: 2px 4px;
		font: inherit;
		font-size: 13px;
		color: var(--text-primary);
		background: none;
		border: 0;
		border-radius: 4px;
		cursor: pointer;
		text-align: left;
	}

	button:hover {
		background: var(--grid);
	}

	button[aria-pressed='true'] .name {
		font-weight: 600;
	}

	.track {
		display: block;
	}

	.bar {
		display: block;
		height: 14px;
		min-width: 2px;
		background: var(--series-1);
		border-radius: 0 4px 4px 0;
	}

	.dimmed .bar {
		opacity: 0.35;
	}

	.value {
		text-align: right;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}
</style>
