import {
	listSuppliesStock,
	createSupplyStock,
	updateSupplyStock,
	deleteSupplyStock,
	updateSupplyQuantity,
} from '@/lib/stock/supplies-stock';

export type StockAdapter = {
	fetch: () => Promise<any[]>;
	create: (data: any) => Promise<any>;
	update: (id: number, data: any) => Promise<any>;
	remove: (id: number) => Promise<any>;
	getQuantity: (item: any) => number;
	updateQuantity: (id: number, newQuantity: number) => Promise<any>;
};

export const STOCK_ADAPTERS: Record<string, StockAdapter> = {
	Insumos: {
		fetch: async () => {
			const { data, error } = await listSuppliesStock();
			if (error) throw error;
			return data || [];
		},
		create: createSupplyStock,
		update: updateSupplyStock,
		remove: deleteSupplyStock,
		getQuantity: (item) => item.supply_quantity ?? 0,
		updateQuantity: updateSupplyQuantity,
	},
};
