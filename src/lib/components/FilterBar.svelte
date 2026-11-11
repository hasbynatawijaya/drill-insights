<script lang="ts">
	import { DEPARTMENTS, DIFFICULTIES, TEMPLATES, type Filters } from '#lib/filters.ts';

	let {
		filters,
		onchange
	}: { filters: Filters; onchange: (patch: Partial<Filters>) => void } = $props();

	const active = $derived(
		filters.department || filters.template || filters.difficulty || filters.window !== 'all'
	);

	function value(event: Event) {
		return (event.currentTarget as HTMLSelectElement).value;
	}
</script>

<form class="filters" aria-label="Filters" onsubmit={(event) => event.preventDefault()}>
	<label>
		<span>Period</span>
		<select
			value={filters.window}
			onchange={(event) => onchange({ window: value(event) as Filters['window'] })}
		>
			<option value="all">All 48 campaigns</option>
			<option value="24">Last 24 campaigns</option>
			<option value="12">Last 12 campaigns</option>
		</select>
	</label>
	<label>
		<span>Department</span>
		<select
			value={filters.department ?? ''}
			onchange={(event) =>
				onchange({ department: (value(event) || null) as Filters['department'] })}
		>
			<option value="">All departments</option>
			{#each DEPARTMENTS as department (department)}
				<option value={department}>{department}</option>
			{/each}
		</select>
	</label>
	<label>
		<span>Template</span>
		<select
			value={filters.template ?? ''}
			onchange={(event) => onchange({ template: (value(event) || null) as Filters['template'] })}
		>
			<option value="">All templates</option>
			{#each TEMPLATES as template (template)}
				<option value={template}>{template}</option>
			{/each}
		</select>
	</label>
	<label>
		<span>Difficulty</span>
		<select
			value={filters.difficulty ?? ''}
			onchange={(event) =>
				onchange({ difficulty: (value(event) || null) as Filters['difficulty'] })}
		>
			<option value="">All levels</option>
			{#each DIFFICULTIES as difficulty (difficulty)}
				<option value={difficulty}>Level {difficulty}</option>
			{/each}
		</select>
	</label>
	{#if active}
		<button
			type="button"
			onclick={() => onchange({ department: null, template: null, difficulty: null, window: 'all' })}
		>
			Clear filters
		</button>
	{/if}
</form>

<style>
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: flex-end;
	}

	label {
		display: grid;
		gap: 4px;
		flex: 1 1 150px;
		max-width: 220px;
		font-size: 13px;
		color: var(--text-secondary);
	}

	select,
	button {
		font: inherit;
		font-size: 14px;
		height: 38px;
		color: var(--text-primary);
		background: var(--surface-1);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0 10px;
	}

	button {
		cursor: pointer;
	}

	@media (max-width: 520px) {
		label {
			max-width: none;
		}
	}
</style>
