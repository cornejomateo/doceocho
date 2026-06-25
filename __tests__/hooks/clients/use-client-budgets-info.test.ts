import { renderHook, waitFor } from '@testing-library/react';
import { useClientBudgetsInfo } from '@/hooks/clients/use-client-budgets-info';
import * as folderBudgetsModule from '@/lib/budgets/folder_budgets';
import * as budgetsModule from '@/lib/budgets/budgets';
import { Client } from '@/lib/clients/clients';

const getFolderBudgetsByClientIdsSpy = jest.spyOn(
	folderBudgetsModule,
	'getFolderBudgetsByClientIds'
);
const getBudgetsByFolderBudgetIdsSpy = jest.spyOn(budgetsModule, 'getBudgetsByFolderBudgetIds');

const EMPTY_CLIENTS: Client[] = [];
const CLIENT_1: Client = {
	id: 1,
	name: 'Client',
	last_name: '1',
	email: '',
	phone_number: '',
	created_at: '',
};
const CLIENT_2: Client = {
	id: 2,
	name: 'Client',
	last_name: '2',
	email: '',
	phone_number: '',
	created_at: '',
};

describe('useClientBudgetsInfo', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns empty info when clients is empty', () => {
		const { result } = renderHook(() => useClientBudgetsInfo(EMPTY_CLIENTS));

		expect(result.current.info).toEqual({});
		expect(result.current.loading).toBe(false);
	});

	it('loads folders and budgets and aggregates per client', async () => {
		const clients = [CLIENT_1, CLIENT_2];
		getFolderBudgetsByClientIdsSpy.mockResolvedValue({
			data: [
				{ id: 10, client_id: 1 },
				{ id: 11, client_id: 1 },
				{ id: 12, client_id: 2 },
			],
			error: null,
		});
		getBudgetsByFolderBudgetIdsSpy.mockResolvedValue({
			data: [
				{ id: 1, accepted: true, folder_budget: { id: 10 } },
				{ id: 2, accepted: false, folder_budget: { id: 10 } },
				{ id: 3, accepted: true, folder_budget: { id: 11 } },
				{ id: 4, accepted: false, folder_budget: { id: 12 } },
			],
			error: null,
		});

		const { result } = renderHook(() => useClientBudgetsInfo(clients));

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.info['1']).toEqual({ total: 3, chosen: 2 });
		expect(result.current.info['2']).toEqual({ total: 1, chosen: 0 });
	});

	it('starts with loading state', () => {
		const clients = [CLIENT_1];
		getFolderBudgetsByClientIdsSpy.mockResolvedValue({ data: [], error: null });

		const { result } = renderHook(() => useClientBudgetsInfo(clients));

		expect(result.current.loading).toBe(true);
	});

	it('handles empty folders', async () => {
		const clients = [CLIENT_1];
		getFolderBudgetsByClientIdsSpy.mockResolvedValue({ data: [], error: null });

		const { result } = renderHook(() => useClientBudgetsInfo(clients));

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.info['1']).toEqual({ total: 0, chosen: 0 });
		expect(getBudgetsByFolderBudgetIdsSpy).not.toHaveBeenCalled();
	});

	it('handles folders error', async () => {
		const clients = [CLIENT_1];
		getFolderBudgetsByClientIdsSpy.mockResolvedValue({ data: null, error: new Error('Error') });

		const { result } = renderHook(() => useClientBudgetsInfo(clients));

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.info['1']).toEqual({ total: 0, chosen: 0 });
		expect(getBudgetsByFolderBudgetIdsSpy).not.toHaveBeenCalled();
	});

	it('handles empty budgets', async () => {
		const clients = [CLIENT_1];
		getFolderBudgetsByClientIdsSpy.mockResolvedValue({
			data: [{ id: 10, client_id: 1 }],
			error: null,
		});
		getBudgetsByFolderBudgetIdsSpy.mockResolvedValue({ data: [], error: null });

		const { result } = renderHook(() => useClientBudgetsInfo(clients));

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.info['1']).toEqual({ total: 0, chosen: 0 });
	});

	it('handles budgets error', async () => {
		const clients = [CLIENT_1];
		getFolderBudgetsByClientIdsSpy.mockResolvedValue({
			data: [{ id: 10, client_id: 1 }],
			error: null,
		});
		getBudgetsByFolderBudgetIdsSpy.mockResolvedValue({ data: null, error: new Error('Error') });

		const { result } = renderHook(() => useClientBudgetsInfo(clients));

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.info['1']).toEqual({ total: 0, chosen: 0 });
	});

	it('handles fetch errors gracefully', async () => {
		const clients = [CLIENT_1];
		getFolderBudgetsByClientIdsSpy.mockRejectedValue(new Error('API Error'));
		jest.spyOn(console, 'error').mockImplementation(() => {});
		const rejectionHandler = jest.fn();
		process.on('unhandledRejection', rejectionHandler);

		const { result } = renderHook(() => useClientBudgetsInfo(clients));

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.info['1']).toEqual({ total: 0, chosen: 0 });
		process.off('unhandledRejection', rejectionHandler);
	});

	it('handles folders without client_id', async () => {
		const clients = [CLIENT_1];
		getFolderBudgetsByClientIdsSpy.mockResolvedValue({
			data: [
				{ id: 10, client_id: 1 },
				{ id: 11, client_id: null },
			],
			error: null,
		});
		getBudgetsByFolderBudgetIdsSpy.mockResolvedValue({
			data: [
				{ id: 1, accepted: true, folder_budget: { id: 10 } },
				{ id: 2, accepted: true, folder_budget: { id: 11 } },
			],
			error: null,
		});

		const { result } = renderHook(() => useClientBudgetsInfo(clients));

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.info['1']).toEqual({ total: 1, chosen: 1 });
	});

	it('handles budgets without folder_budget', async () => {
		const clients = [CLIENT_1];
		getFolderBudgetsByClientIdsSpy.mockResolvedValue({
			data: [{ id: 10, client_id: 1 }],
			error: null,
		});
		getBudgetsByFolderBudgetIdsSpy.mockResolvedValue({
			data: [
				{ id: 1, accepted: true, folder_budget: { id: 10 } },
				{ id: 2, accepted: true, folder_budget: null },
			],
			error: null,
		});

		const { result } = renderHook(() => useClientBudgetsInfo(clients));

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.info['1']).toEqual({ total: 1, chosen: 1 });
	});

	it('does not update state after unmount', async () => {
		const clients = [CLIENT_1];
		getFolderBudgetsByClientIdsSpy.mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(() => resolve({ data: [{ id: 10, client_id: 1 }], error: null }), 100)
				)
		);
		getBudgetsByFolderBudgetIdsSpy.mockResolvedValue({
			data: [{ id: 1, accepted: true, folder_budget: { id: 10 } }],
			error: null,
		});

		const { result, unmount } = renderHook(() => useClientBudgetsInfo(clients));

		unmount();

		await new Promise((r) => setTimeout(r, 200));

		expect(result.current.info).toEqual({});
	});
});
