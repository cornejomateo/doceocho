import { createSupplyStock, updateSupplyStock } from '@/lib/stock/supplies-stock';
import { getSupabaseClient } from '@/lib/supabase-client';

jest.mock('@/lib/supabase-client', () => ({
	getSupabaseClient: jest.fn(),
}));

function createChain() {
	const chain: Record<string, jest.Mock> = {
		select: jest.fn(() => chain),
		order: jest.fn(() => chain),
		eq: jest.fn(() => chain),
		insert: jest.fn(() => chain),
		update: jest.fn(() => chain),
		limit: jest.fn(() => chain),
	};

	return chain;
}

describe('supplies stock lib', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('creates a supply item and adds last_update', async () => {
		const chain = createChain();
		chain.single = jest.fn().mockResolvedValue({
			data: { id: 22, supply_code: 'A-001' },
			error: null,
		});
		const supabase = {
			from: jest.fn(() => chain),
		};
		(getSupabaseClient as jest.Mock).mockReturnValue(supabase);

		const result = await createSupplyStock({
			supply_category: 'Perfilería',
			supply_line: 'Línea A',
			supply_brand: 'Marca',
			supply_code: 'A-001',
			supply_description: 'Descripción',
			supply_color: 'Blanco',
			supply_quantity_for_lump: 10,
			supply_quantity_lump: 3,
			supply_quantity: 30,
			supply_site: 'Depósito',
			supply_material: 'Aluminio',
			supply_price: 1200,
			image_id: 77,
		});

		expect(supabase.from).toHaveBeenCalledWith('stock_supplies');
		expect(chain.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				supply_code: 'A-001',
				image_id: 77,
				last_update: expect.any(String),
			})
		);
		expect(result.data).toEqual({ id: 22, supply_code: 'A-001' });
	});

	it('updates a supply item and refreshes last_update', async () => {
		const stockChain = createChain();
		const supabase = {
			from: jest.fn((table: string) => {
				if (table === 'stock_supplies') return stockChain;
				return stockChain;
			}),
		};

		stockChain.single = jest
			.fn()
			.mockResolvedValueOnce({
				data: { supply_code: 'OLD-001' },
				error: null,
			})
			.mockResolvedValueOnce({
				data: { id: 22, supply_code: 'OLD-001', supply_quantity: 55 },
				error: null,
			});

		(getSupabaseClient as jest.Mock).mockReturnValue(supabase);

		const result = await updateSupplyStock(22, {
			supply_quantity: 55,
			supply_site: 'Nuevo depósito',
		});

		expect(supabase.from).toHaveBeenCalledWith('stock_supplies');
		expect(stockChain.update).toHaveBeenCalledWith(
			expect.objectContaining({
				supply_quantity: 55,
				supply_site: 'Nuevo depósito',
				last_update: expect.any(String),
			})
		);
		expect(stockChain.eq).toHaveBeenCalledWith('id', 22);
		expect(result.data).toEqual({ id: 22, supply_code: 'OLD-001', supply_quantity: 55 });
	});
});
