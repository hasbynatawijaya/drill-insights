import { describe, expect, it } from 'vitest';
import type { Filters } from './filters';
import { departmentSql, rowsSql, whereClause } from './queries';

const none: Filters = { department: null, template: null, difficulty: null, window: 'all' };

describe('whereClause', () => {
	it('is empty with no filters', () => {
		expect(whereClause(none)).toBe('');
	});

	it('combines filters and turns the window into a campaign range', () => {
		expect(whereClause({ ...none, department: 'Sales', difficulty: '2', window: '12' })).toBe(
			`WHERE department = 'Sales' AND difficulty = 2 AND campaign_id > 36`
		);
	});
});

describe('departmentSql', () => {
	it('ignores the department filter but keeps the others', () => {
		const sql = departmentSql({ ...none, department: 'Sales', template: 'Invoice' });
		expect(sql).toContain(`template = 'Invoice'`);
		expect(sql).not.toContain(`department = 'Sales'`);
	});
});

describe('rowsSql', () => {
	it('never emits a negative or fractional window', () => {
		expect(rowsSql(none, -5.5, 20.9)).toContain('LIMIT 20 OFFSET 0');
	});
});
