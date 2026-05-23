import { filterStockItems } from '@/components/business/stock/stock-filters-logic';

describe('filterStockItems', () => {
	it('filters by search term and material type', () => {
		const items = [
			{
				id: 1,
				supply_category: 'Tornillos',
				supply_line: 'Linea 1',
				supply_brand: 'Marca A',
				supply_code: 'ABC',
				supply_site: 'Deposito',
				supply_description: 'Descripcion',
				supply_material: 'Aluminio',
			},
			{
				id: 2,
				supply_category: 'Perfiles',
				supply_line: 'Linea 2',
				supply_brand: 'Marca B',
				supply_code: 'XYZ',
				supply_site: 'Otro',
				supply_description: 'Otra',
				supply_material: 'PVC',
			},
		];

		expect(filterStockItems(items, 'abc', 'Aluminio')).toHaveLength(1);
		expect(filterStockItems(items, 'abc', 'PVC')).toHaveLength(0);
		expect(filterStockItems(items, '', undefined)).toHaveLength(2);
	});
});
