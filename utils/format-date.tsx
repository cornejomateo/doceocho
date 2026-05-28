// The method we should always use to display timestampz data
export const formatCreatedAt = (dateValue: unknown) => {
	if (!dateValue) return 'N/A';
	const d = new Date(String(dateValue));
	if (isNaN(d.getTime())) return 'N/A';
	const day = String(d.getUTCDate()).padStart(2, '0');
	const month = String(d.getUTCMonth() + 1).padStart(2, '0');
	const year = d.getUTCFullYear();
	return `${day}/${month}/${year}`;
};

export function formatShortDate(value: string | null | undefined) {
	if (!value) return '-';
	try {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '-';
		return date.toLocaleDateString('es-AR');
	} catch {
		return '-';
	}
}
