export const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

export const count = (value: number) => new Intl.NumberFormat('en-US').format(value);

export function duration(seconds: number | null): string {
	if (seconds === null) return '—';
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	return `${hours} h ${minutes % 60} min`;
}
