import { renderHook, act, waitFor } from '@testing-library/react';
import { useClientBudgets } from '@/hooks/clients/use-client-budgets';
import { getFolderBudgetsByClientId } from '@/lib/budgets/folder_budgets';
import { getBudgetsByFolderBudgetIds } from '@/lib/budgets/budgets';

jest.mock('@/lib/budgets/folder_budgets', () => ({
	getFolderBudgetsByClientId: jest.fn(),
}));

jest.mock('@/lib/budgets/budgets', () => ({
	getBudgetsByFolderBudgetIds: jest.fn(),
}));

describe('useClientBudgets', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('starts with empty budgets', () => {
		const { result } = renderHook(() => useClientBudgets(1));
		expect(result.current.budgets).toEqual([]);
	});

	it('loads budgets successfully', async () => {
		const folderBudgets = [{ id: 10 }, { id: 11 }];
		const budgets = [
			{
				id: 1,
				amount_ars: 100,
				amount_usd: 10,
				created_at: '2024-01-01',
				folder_budget: { id: 10, work_id: 5, work: { address: 'Calle', locality: 'Bs As' } },
			},
		];

		(getFolderBudgetsByClientId as jest.Mock).mockResolvedValue({
			data: folderBudgets,
			error: null,
		});
		(getBudgetsByFolderBudgetIds as jest.Mock).mockResolvedValue({ data: budgets, error: null });

		const { result } = renderHook(() => useClientBudgets(1));

		await act(async () => {
			await result.current.loadBudgets();
		});

		expect(result.current.budgets).toEqual(budgets);
		expect(getFolderBudgetsByClientId).toHaveBeenCalledWith(1);
		expect(getBudgetsByFolderBudgetIds).toHaveBeenCalledWith([10, 11]);
	});

	it('handles empty folder budgets', async () => {
		(getFolderBudgetsByClientId as jest.Mock).mockResolvedValue({ data: [], error: null });

		const { result } = renderHook(() => useClientBudgets(1));

		await act(async () => {
			await result.current.loadBudgets();
		});

		expect(result.current.budgets).toEqual([]);
		expect(getBudgetsByFolderBudgetIds).not.toHaveBeenCalled();
	});

	it('does nothing when clientId is undefined', async () => {
		const { result } = renderHook(() => useClientBudgets());

		await act(async () => {
			await result.current.loadBudgets();
		});

		expect(result.current.budgets).toEqual([]);
		expect(getFolderBudgetsByClientId).not.toHaveBeenCalled();
	});

	it('handles fetch errors gracefully', async () => {
		(getFolderBudgetsByClientId as jest.Mock).mockRejectedValue(new Error('API Error'));
		jest.spyOn(console, 'error').mockImplementation(() => {});

		const { result } = renderHook(() => useClientBudgets(1));

		await act(async () => {
			await result.current.loadBudgets();
		});

		expect(result.current.budgets).toEqual([]);
	});
});
