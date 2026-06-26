import { renderHook, waitFor } from '@testing-library/react';
import { useWorkChecklists } from '@/hooks/clients/use-works-checklists';
import { getChecklistsByWorkId } from '@/lib/checklists/checklists';
import { Work } from '@/lib/works/works';

jest.mock('@/lib/checklists/checklists', () => ({
	getChecklistsByWorkId: jest.fn(),
}));

const mockWork = (id: number): Work => ({
	id,
	locality: 'Bs As',
	address: 'Calle 123',
	client_name: 'Cliente',
	client_last_name: 'Apellido',
	status: 'pending',
});

describe('useWorkChecklists', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns empty when works is empty', () => {
		const { result } = renderHook(() => useWorkChecklists([]));

		expect(result.current.workChecklists).toEqual({});
		expect(result.current.loadingChecklists).toEqual({});
	});

	it('calls getChecklistsByWorkId for each work', async () => {
		const works = [mockWork(1), mockWork(2)];
		(getChecklistsByWorkId as jest.Mock).mockResolvedValue({
			data: [{ id: 10, items: [] }],
			error: null,
		});

		const { result } = renderHook(() => useWorkChecklists(works));

		await waitFor(() => {
			expect(getChecklistsByWorkId).toHaveBeenCalledTimes(2);
			expect(getChecklistsByWorkId).toHaveBeenCalledWith(1);
			expect(getChecklistsByWorkId).toHaveBeenCalledWith(2);
		});

		await waitFor(() => {
			expect(result.current.workChecklists[1]).toBe(true);
			expect(result.current.workChecklists[2]).toBe(true);
		});
	});

	it('sets hasChecklists to true when data has items', async () => {
		const works = [mockWork(1)];
		(getChecklistsByWorkId as jest.Mock).mockResolvedValue({
			data: [{ id: 10, items: [{ key: 1, name: 'Task', done: false }] }],
			error: null,
		});

		const { result } = renderHook(() => useWorkChecklists(works));

		await waitFor(() => {
			expect(result.current.workChecklists[1]).toBe(true);
		});
	});

	it('sets hasChecklists to false when no checklists exist', async () => {
		const works = [mockWork(1)];
		(getChecklistsByWorkId as jest.Mock).mockResolvedValue({
			data: [],
			error: null,
		});

		const { result } = renderHook(() => useWorkChecklists(works));

		await waitFor(() => {
			expect(result.current.workChecklists[1]).toBe(false);
		});
	});

	it('handles fetch error gracefully', async () => {
		const works = [mockWork(1)];
		(getChecklistsByWorkId as jest.Mock).mockRejectedValue(new Error('API Error'));

		const { result } = renderHook(() => useWorkChecklists(works));

		await waitFor(() => {
			expect(result.current.workChecklists[1]).toBe(false);
		});
	});

	it('sets loading state initially', async () => {
		const works = [mockWork(1)];
		(getChecklistsByWorkId as jest.Mock).mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(() => resolve({ data: [{ id: 10, items: [] }], error: null }), 50)
				)
		);

		const { result } = renderHook(() => useWorkChecklists(works));

		expect(result.current.loadingChecklists[1]).toBe(true);

		await waitFor(() => {
			expect(result.current.loadingChecklists[1]).toBe(false);
		});
	});
});
