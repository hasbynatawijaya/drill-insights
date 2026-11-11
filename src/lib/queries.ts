import type { Filters } from './filters';

const LAST_CAMPAIGN = 48;

/** Values come from parseFilters' allow-lists only. */
export function whereClause(filters: Filters): string {
	const conditions: string[] = [];
	if (filters.department) conditions.push(`department = '${filters.department}'`);
	if (filters.template) conditions.push(`template = '${filters.template}'`);
	if (filters.difficulty) conditions.push(`difficulty = ${Number(filters.difficulty)}`);
	if (filters.window !== 'all') {
		conditions.push(`campaign_id > ${LAST_CAMPAIGN - Number(filters.window)}`);
	}
	return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
}

export function summarySql(filters: Filters): string {
	return `SELECT
		count(*)::DOUBLE AS delivered,
		coalesce(avg(clicked::INTEGER), 0)::DOUBLE AS click_rate,
		coalesce(avg(reported::INTEGER), 0)::DOUBLE AS report_rate,
		quantile_cont(seconds_to_report, 0.5)::DOUBLE AS median_seconds,
		coalesce(sum(trained::INTEGER) / nullif(sum(clicked::INTEGER), 0), 0)::DOUBLE AS training_rate
	FROM events ${whereClause(filters)}`;
}

export function trendSql(filters: Filters): string {
	return `SELECT
		campaign_id::INTEGER AS campaign,
		strftime(any_value(sent_on), '%b %Y') AS label,
		avg(clicked::INTEGER)::DOUBLE AS click_rate,
		avg(reported::INTEGER)::DOUBLE AS report_rate
	FROM events ${whereClause(filters)}
	GROUP BY campaign_id
	ORDER BY campaign_id`;
}

/** The department filter is left out here so the breakdown still compares every department. */
export function departmentSql(filters: Filters): string {
	return `SELECT
		department,
		avg(clicked::INTEGER)::DOUBLE AS click_rate
	FROM events ${whereClause({ ...filters, department: null })}
	GROUP BY department
	ORDER BY click_rate DESC`;
}

export function rowsSql(filters: Filters, offset: number, limit: number): string {
	return `SELECT
		employee_id::INTEGER AS employee_id,
		campaign_id::INTEGER AS campaign_id,
		strftime(sent_on, '%Y-%m-%d') AS sent_on,
		department,
		template,
		difficulty::INTEGER AS difficulty,
		clicked,
		reported
	FROM events ${whereClause(filters)}
	LIMIT ${Math.max(0, Math.floor(limit))} OFFSET ${Math.max(0, Math.floor(offset))}`;
}
