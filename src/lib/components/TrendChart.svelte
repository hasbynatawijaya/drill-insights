<script lang="ts">
	import { percent } from '#lib/format.ts';

	export type TrendPoint = {
		campaign: number;
		label: string;
		click_rate: number;
		report_rate: number;
	};

	let { points }: { points: TrendPoint[] } = $props();

	const series = [
		{ key: 'click_rate', name: 'Clicked', color: 'var(--series-1)' },
		{ key: 'report_rate', name: 'Reported', color: 'var(--series-2)' }
	] as const;

	const height = 280;
	const margin = { top: 14, right: 76, bottom: 28, left: 42 };

	let width = $state(640);
	let hovered = $state<number | null>(null);

	const innerWidth = $derived(Math.max(width - margin.left - margin.right, 10));
	const innerHeight = height - margin.top - margin.bottom;
	// The step comes first so every axis label is a whole percentage.
	const peak = $derived(Math.max(0.01, ...points.flatMap((p) => [p.click_rate, p.report_rate])));
	const step = $derived([0.01, 0.02, 0.05, 0.1, 0.2, 0.25].find((s) => peak / s <= 5) ?? 0.25);
	const top = $derived(Math.ceil(peak / step) * step);
	const yTicks = $derived(
		Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step)
	);
	const xTicks = $derived.by(() => {
		const count = Math.min(points.length, width < 480 ? 3 : 5);
		if (count < 2) return points.map((_, index) => index);
		return Array.from({ length: count }, (_, step) =>
			Math.round((step * (points.length - 1)) / (count - 1))
		);
	});

	const x = (index: number) =>
		margin.left +
		(points.length > 1 ? (index / (points.length - 1)) * innerWidth : innerWidth / 2);
	const y = (value: number) => margin.top + innerHeight - (value / top) * innerHeight;
	const path = (key: (typeof series)[number]['key']) =>
		points
			.map((p, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(p[key]).toFixed(1)}`)
			.join('');

	// Direct labels are pushed apart when the two lines end close together.
	const endLabels = $derived.by(() => {
		const last = points.at(-1);
		if (!last) return [];
		const labels = series.map((s) => ({ name: s.name, value: last[s.key], y: y(last[s.key]) + 4 }));
		const [first, second] = labels;
		if (Math.abs(first.y - second.y) < 16) {
			const middle = (first.y + second.y) / 2;
			const upper = first.value >= second.value ? first : second;
			const lower = upper === first ? second : first;
			upper.y = middle - 8;
			lower.y = middle + 8;
		}
		return labels;
	});

	function onpointermove(event: PointerEvent) {
		const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
		const ratio = (event.clientX - rect.left - margin.left) / innerWidth;
		hovered = Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1))));
	}

	const summary = $derived.by(() => {
		const first = points[0];
		const last = points.at(-1);
		if (!first || !last) return 'No campaigns match these filters.';
		return `From ${first.label} to ${last.label}, click rate moved from ${percent(first.click_rate)} to ${percent(last.click_rate)} and report rate from ${percent(first.report_rate)} to ${percent(last.report_rate)}.`;
	});
</script>

<section class="panel">
	<h2>Click and report rate by campaign</h2>
	<ul class="legend">
		{#each series as s (s.key)}
			<li><span class="swatch" style:background={s.color}></span>{s.name}</li>
		{/each}
	</ul>

	<div class="plot" bind:clientWidth={width}>
		<svg
			{width}
			{height}
			role="img"
			aria-label={summary}
			{onpointermove}
			onpointerleave={() => (hovered = null)}
		>
			{#each yTicks as tick (tick)}
				<line class="grid" x1={margin.left} x2={margin.left + innerWidth} y1={y(tick)} y2={y(tick)} />
				<text class="axis" x={margin.left - 8} y={y(tick) + 4} text-anchor="end">
					{Math.round(tick * 100)}%
				</text>
			{/each}
			{#each xTicks as index (index)}
				<text
					class="axis"
					x={x(index)}
					y={height - 8}
					text-anchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
				>
					{points[index].label}
				</text>
			{/each}

			{#each series as s (s.key)}
				<path d={path(s.key)} fill="none" stroke={s.color} stroke-width="2" stroke-linejoin="round" />
			{/each}

			{#if points.length}
				{#each endLabels as label (label.name)}
					<text class="end" x={margin.left + innerWidth + 8} y={label.y}>
						{percent(label.value)}
					</text>
				{/each}
			{/if}

			{#if hovered !== null && points[hovered]}
				<line
					class="crosshair"
					x1={x(hovered)}
					x2={x(hovered)}
					y1={margin.top}
					y2={margin.top + innerHeight}
				/>
				{#each series as s (s.key)}
					<circle
						cx={x(hovered)}
						cy={y(points[hovered][s.key])}
						r="4.5"
						fill={s.color}
						stroke="var(--surface-1)"
						stroke-width="2"
					/>
				{/each}
			{/if}
		</svg>

		{#if hovered !== null && points[hovered]}
			{@const point = points[hovered]}
			<div
				class="tooltip"
				style:left="{x(hovered)}px"
				style:transform={x(hovered) > width / 2
					? 'translateX(calc(-100% - 12px))'
					: 'translateX(12px)'}
			>
				<strong>Campaign {point.campaign} · {point.label}</strong>
				{#each series as s (s.key)}
					<div class="row">
						<span class="swatch" style:background={s.color}></span>
						<span>{s.name}</span>
						<b>{percent(point[s.key])}</b>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<details>
		<summary>View as table</summary>
		<div class="data">
			<table>
				<thead>
					<tr><th scope="col">Campaign</th><th scope="col">Sent</th><th scope="col">Clicked</th><th scope="col">Reported</th></tr>
				</thead>
				<tbody>
					{#each points as point (point.campaign)}
						<tr>
							<td>{point.campaign}</td>
							<td>{point.label}</td>
							<td>{percent(point.click_rate)}</td>
							<td>{percent(point.report_rate)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</details>
</section>

<style>
	.legend {
		display: flex;
		gap: 16px;
		list-style: none;
		margin: 6px 0 8px;
		padding: 0;
		font-size: 13px;
		color: var(--text-secondary);
	}

	.legend li,
	.row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.swatch {
		width: 10px;
		height: 10px;
		border-radius: 3px;
		display: inline-block;
	}

	.plot {
		position: relative;
	}

	svg {
		display: block;
		touch-action: pan-y;
	}

	.grid {
		stroke: var(--grid);
	}

	.axis {
		fill: var(--text-muted);
		font-size: 12px;
	}

	.end {
		fill: var(--text-secondary);
		font-size: 12px;
		font-variant-numeric: tabular-nums;
	}

	.crosshair {
		stroke: var(--text-muted);
		stroke-dasharray: 3 3;
	}

	.tooltip {
		position: absolute;
		top: 16px;
		background: var(--surface-1);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 8px 10px;
		font-size: 13px;
		pointer-events: none;
		white-space: nowrap;
		box-shadow: 0 2px 8px rgb(0 0 0 / 0.12);
	}

	.row b {
		margin-left: auto;
		padding-left: 16px;
		font-variant-numeric: tabular-nums;
	}

	details {
		margin-top: 8px;
		font-size: 13px;
		color: var(--text-secondary);
	}

	summary {
		cursor: pointer;
	}

	.data {
		max-height: 220px;
		overflow: auto;
		margin-top: 8px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}

	th,
	td {
		text-align: left;
		padding: 4px 8px;
		border-bottom: 1px solid var(--grid);
	}
</style>
