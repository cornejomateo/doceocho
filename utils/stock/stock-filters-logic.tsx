export function filterStockItems(
	stock: any[],
	searchTerm: string,
	materialType: 'Aluminio' | 'PVC' | undefined
) {
	return (stock || []).filter((item: any) => {
		const searchLower = searchTerm.toLowerCase();
		const matchesSearch =
			(item.category?.toLowerCase() || '').includes(searchLower) ||
			(item.supply_category?.toLowerCase?.() || '').includes(searchLower) ||
			(item.supply_line?.toLowerCase?.() || '').includes(searchLower) ||
			(item.supply_brand?.toLowerCase?.() || '').includes(searchLower) ||
			(item.supply_site?.toLowerCase?.() || '').includes(searchLower) ||
			(item.supply_code?.toLowerCase?.() || '').includes(searchLower) ||
			(item.supply_description?.toLowerCase?.() || '').includes(searchLower);

		const matchesMaterial =
			!materialType || (item.supply_material || '').toLowerCase() === materialType.toLowerCase();

		return matchesSearch && matchesMaterial;
	});
}
