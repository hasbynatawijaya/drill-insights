import { describe, expect, it } from 'vitest';
import { parseFilters, toSearch, type Filters } from './filters';

const params = (query: string) => new URLSearchParams(query);

describe('parseFilters', () => {
	it('uses defaults for an empty URL', () => {
		expect(parseFilters(params(''))).toEqual({
			department: null,
			template: null,
			difficulty: null,
			window: 'all'
		});
	});

	it('drops values that are not on the allow-list', () => {
		const filters = parseFilters(params(`department=x'%20OR%201=1&difficulty=9&window=7`));
		expect(filters.department).toBeNull();
		expect(filters.difficulty).toBeNull();
		expect(filters.window).toBe('all');
	});
});

describe('toSearch', () => {
	it('keeps default values out of the URL', () => {
		expect(toSearch(parseFilters(params('')))).toBe('');
	});

	it('round-trips through the URL', () => {
		const filters: Filters = {
			department: 'Finance',
			template: 'HR policy',
			difficulty: '3',
			window: '12'
		};
		expect(parseFilters(params(toSearch(filters)))).toEqual(filters);
	});
});
