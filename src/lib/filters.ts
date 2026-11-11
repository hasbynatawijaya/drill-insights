export const DEPARTMENTS = [
	'Engineering',
	'Finance',
	'Legal',
	'Marketing',
	'Operations',
	'People',
	'Sales',
	'Support'
] as const;

export const TEMPLATES = [
	'Credential reset',
	'HR policy',
	'Invoice',
	'Parcel delivery',
	'Shared document'
] as const;

export const DIFFICULTIES = ['1', '2', '3'] as const;
export const WINDOWS = ['all', '24', '12'] as const;

export type Filters = {
	department: (typeof DEPARTMENTS)[number] | null;
	template: (typeof TEMPLATES)[number] | null;
	difficulty: (typeof DIFFICULTIES)[number] | null;
	window: (typeof WINDOWS)[number];
};

function oneOf<T extends string>(allowed: readonly T[], value: string | null): T | null {
	return allowed.find((item) => item === value) ?? null;
}

/** Anything not on the allow-lists is dropped, so a hand-edited URL can't reach the SQL. */
export function parseFilters(params: Pick<URLSearchParams, 'get'>): Filters {
	return {
		department: oneOf(DEPARTMENTS, params.get('department')),
		template: oneOf(TEMPLATES, params.get('template')),
		difficulty: oneOf(DIFFICULTIES, params.get('difficulty')),
		window: oneOf(WINDOWS, params.get('window')) ?? 'all'
	};
}

/** Defaults stay out of the URL so the plain link and the unfiltered link are the same page. */
export function toSearch(filters: Filters): string {
	const params = new URLSearchParams();
	if (filters.department) params.set('department', filters.department);
	if (filters.template) params.set('template', filters.template);
	if (filters.difficulty) params.set('difficulty', filters.difficulty);
	if (filters.window !== 'all') params.set('window', filters.window);
	const search = params.toString();
	return search ? `?${search}` : '';
}
