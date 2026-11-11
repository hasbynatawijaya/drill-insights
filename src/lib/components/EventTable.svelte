<script lang="ts">
	import { query } from '#lib/db.ts';
	import type { Filters } from '#lib/filters.ts';
	import { count } from '#lib/format.ts';
	import { rowsSql } from '#lib/queries.ts';

	type Row = {
		employee_id: number;
		campaign_id: number;
		sent_on: string;
		department: string;
		template: string;
		difficulty: number;
		clicked: boolean;
		reported: boolean;
	};

	let { filters, total }: { filters: Filters; total: number } = $props();

	const ROW_HEIGHT = 34;
	const VIEW_HEIGHT = 340;
	const OVERSCAN = 15;
	// Browsers cap element height, so past this size scroll position is mapped onto the rows.
	const MAX_SPACER = 15_000_000;

	let scrollTop = $state(0);
	let buffer = $state<{ start: number; rows: Row[] } | null>(null);
	let requestId = 0;

	const fullHeight = $derived(total * ROW_HEIGHT);
	const spacerHeight = $derived(Math.min(fullHeight, MAX_SPACER));
	const scale = $derived(
		spacerHeight > VIEW_HEIGHT ? (fullHeight - VIEW_HEIGHT) / (spacerHeight - VIEW_HEIGHT) : 1
	);
	const virtualTop = $derived(scrollTop * scale);
	const first = $derived(Math.floor(virtualTop / ROW_HEIGHT));
	const visibleCount = $derived(Math.min(Math.ceil(VIEW_HEIGHT / ROW_HEIGHT) + 1, total - first));
	const offsetY = $derived(scrollTop - (virtualTop % ROW_HEIGHT));

	const visible = $derived(
		Array.from({ length: Math.max(visibleCount, 0) }, (_, step) => {
			const index = first + step;
			const row = buffer && index >= buffer.start ? buffer.rows[index - buffer.start] : undefined;
			return { index, row };
		})
	);

	$effect(() => {
		const end = first + visibleCount;
		const covered =
			total === 0 || (buffer && first >= buffer.start && end <= buffer.start + buffer.rows.length);
		if (covered) return;

		const start = Math.max(0, first - OVERSCAN);
		const limit = visibleCount + OVERSCAN * 2;
		const id = ++requestId;
		const timer = setTimeout(async () => {
			const result = await query<Row>(rowsSql(filters, start, limit));
			if (id === requestId) buffer = { start, rows: result.rows };
		}, 60);
		return () => clearTimeout(timer);
	});
</script>

<section class="panel">
	<h2>Individual results</h2>
	<p class="hint">{count(total)} rows, fetched as you scroll.</p>

	<div class="wide">
		<div class="table" role="table" aria-label="Individual drill results" aria-rowcount={total + 1}>
			<div role="rowgroup">
				<div class="row head" role="row" aria-rowindex="1">
					<span role="columnheader">Employee</span>
					<span role="columnheader">Campaign</span>
					<span role="columnheader">Sent</span>
					<span role="columnheader">Department</span>
					<span role="columnheader">Template</span>
					<span role="columnheader">Level</span>
					<span role="columnheader">Clicked</span>
					<span role="columnheader">Reported</span>
				</div>
			</div>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				class="scroller"
				role="rowgroup"
				tabindex="0"
				style:height="{VIEW_HEIGHT}px"
				onscroll={(event) => (scrollTop = event.currentTarget.scrollTop)}
			>
				<div class="spacer" style:height="{spacerHeight}px">
					<div class="rows" style:transform="translateY({offsetY}px)">
						{#each visible as { index, row } (index)}
							<div class="row" role="row" aria-rowindex={index + 2} style:height="{ROW_HEIGHT}px">
								{#if row}
									<span role="cell">#{row.employee_id}</span>
									<span role="cell">{row.campaign_id}</span>
									<span role="cell">{row.sent_on}</span>
									<span role="cell">{row.department}</span>
									<span role="cell">{row.template}</span>
									<span role="cell">{row.difficulty}</span>
									<span role="cell">{row.clicked ? 'Yes' : 'No'}</span>
									<span role="cell">{row.reported ? 'Yes' : 'No'}</span>
								{:else}
									<span role="cell" class="pending">Loading…</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.wide {
		overflow-x: auto;
		margin-top: 10px;
	}

	.table {
		min-width: 760px;
		font-size: 13px;
		font-variant-numeric: tabular-nums;
	}

	.row {
		display: grid;
		grid-template-columns: 90px 76px 100px 110px 1fr 56px 70px 80px;
		align-items: center;
		padding: 0 8px;
		border-bottom: 1px solid var(--grid);
	}

	.head {
		height: 34px;
		color: var(--text-secondary);
		font-weight: 600;
		border-bottom: 1px solid var(--border);
	}

	.scroller {
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.spacer {
		position: relative;
	}

	.rows {
		position: absolute;
		inset: 0 0 auto;
	}

	.pending {
		grid-column: 1 / -1;
		color: var(--text-muted);
	}
</style>
