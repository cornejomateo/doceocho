import { paginateAndFilter } from '@/utils/pagination';

interface User {
	id: number;
	name: string;
}

describe('paginateAndFilter', () => {
	const mockData: User[] = [
		{ id: 1, name: 'Juan' },
		{ id: 2, name: 'Pedro' },
		{ id: 3, name: 'Maria' },
		{ id: 4, name: 'Ana' },
		{ id: 5, name: 'Luis' },
	];

	const filterFn = (item: User, search: string) => item.name.toLowerCase().includes(search);

	it('returns all items when search term is empty', () => {
		const result = paginateAndFilter(mockData, '', 1, 10, filterFn);

		expect(result.filteredData).toHaveLength(5);
		expect(result.paginatedData).toHaveLength(5);
		expect(result.totalItems).toBe(5);
		expect(result.totalPages).toBe(1);
	});

	it('filters data correctly', () => {
		const result = paginateAndFilter(mockData, 'juan', 1, 10, filterFn);

		expect(result.filteredData).toEqual([{ id: 1, name: 'Juan' }]);

		expect(result.totalItems).toBe(1);
		expect(result.totalPages).toBe(1);
	});

	it('is case insensitive', () => {
		const result = paginateAndFilter(mockData, 'MARIA', 1, 10, filterFn);

		expect(result.filteredData).toEqual([{ id: 3, name: 'Maria' }]);
	});

	it('trims search term spaces', () => {
		const result = paginateAndFilter(mockData, '   pedro   ', 1, 10, filterFn);

		expect(result.filteredData).toEqual([{ id: 2, name: 'Pedro' }]);
	});

	it('paginates data correctly', () => {
		const result = paginateAndFilter(mockData, '', 2, 2, filterFn);

		expect(result.paginatedData).toEqual([
			{ id: 3, name: 'Maria' },
			{ id: 4, name: 'Ana' },
		]);

		expect(result.totalPages).toBe(3);
	});

	it('returns last page correctly', () => {
		const result = paginateAndFilter(mockData, '', 3, 2, filterFn);

		expect(result.paginatedData).toEqual([{ id: 5, name: 'Luis' }]);
	});

	it('clamps currentPage below 1', () => {
		const result = paginateAndFilter(mockData, '', -10, 2, filterFn);

		expect(result.paginatedData).toEqual([
			{ id: 1, name: 'Juan' },
			{ id: 2, name: 'Pedro' },
		]);
	});

	it('clamps currentPage above totalPages', () => {
		const result = paginateAndFilter(mockData, '', 999, 2, filterFn);

		expect(result.paginatedData).toEqual([{ id: 5, name: 'Luis' }]);
	});

	it('returns empty arrays when no items match', () => {
		const result = paginateAndFilter(mockData, 'zzz', 1, 10, filterFn);

		expect(result.filteredData).toEqual([]);
		expect(result.paginatedData).toEqual([]);
		expect(result.totalItems).toBe(0);
		expect(result.totalPages).toBe(0);
	});

	it('handles empty data array', () => {
		const result = paginateAndFilter([], 'juan', 1, 10, filterFn);

		expect(result.filteredData).toEqual([]);
		expect(result.paginatedData).toEqual([]);
		expect(result.totalItems).toBe(0);
		expect(result.totalPages).toBe(0);
	});

	it('works with itemsPerPage larger than dataset', () => {
		const result = paginateAndFilter(mockData, '', 1, 100, filterFn);

		expect(result.paginatedData).toHaveLength(5);
		expect(result.totalPages).toBe(1);
	});
});
