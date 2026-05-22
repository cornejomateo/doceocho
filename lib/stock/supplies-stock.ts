import { getSupabaseClient } from '../supabase-client';

export type SupplyItemStock = {
	id: number;
	supply_category: string;
	supply_line: string | null;
	supply_brand: string | null;
	supply_code: string;
	supply_description?: string | null;
	supply_color: string;
	supply_quantity_for_lump: number;
	supply_quantity_lump: number;
	supply_quantity: number;
	supply_site: string;
	supply_material: string;
	image_id?: number | null;
	supply_price: number | null;
	created_at?: string | null;
	last_update?: string | null;
};

const TABLE = 'stock_supplies';

export async function listSuppliesStock(): Promise<{ data: SupplyItemStock[] | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select(
			`
			id,
			supply_category,
			supply_line,
			supply_brand,
			supply_code,
			supply_description,
			supply_color,
			supply_quantity_for_lump,
			image_id,
			supply_quantity_lump,
			supply_quantity,
			supply_site,
			supply_material,
			supply_price,
			created_at,
			last_update
		`
		)
		.order('created_at', { ascending: false });
	return { data, error };
}

export async function getSupplyById(
	id: number
): Promise<{ data: SupplyItemStock | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
	return { data, error };
}

export async function createSupplyStock(
	item: Partial<SupplyItemStock>
): Promise<{ data: SupplyItemStock | null; error: any }> {
	const supabase = getSupabaseClient();

	let image_id = item.image_id ?? null;
	if (!image_id && item.supply_code) {
		const { data: galleryImage, error: galleryError } = await supabase
			.from('gallery_supplies')
			.select('id')
			.eq('supply_code', item.supply_code)
			.limit(1)
			.single();

		if (galleryError && galleryError.code !== 'PGRST116') {
			throw galleryError;
		}

		image_id = galleryImage?.id ?? null;
	}

	const payload = {
		...item,
		image_id,
		last_update: new Date().toISOString().split('T')[0],
	};

	const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
	return { data, error };
}

export async function updateSupplyStock(
	id: number,
	changes: Partial<SupplyItemStock>
): Promise<{ data: SupplyItemStock | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data: currentItem, error: currentError } = await supabase
		.from(TABLE)
		.select('supply_code')
		.eq('id', id)
		.single();

	if (currentError) {
		throw currentError;
	}

	const currentCode = currentItem?.supply_code?.trim() ?? '';
	const nextCode = changes.supply_code?.trim() ?? '';
	const codeChanged = nextCode !== '' && nextCode !== currentCode;

	const payload: Partial<SupplyItemStock> = {
		...changes,
		last_update: new Date().toISOString().split('T')[0],
	};

	if (codeChanged) {
		const { data: galleryImage, error: galleryError } = await supabase
			.from('gallery_supplies')
			.select('id')
			.eq('supply_code', nextCode)
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (galleryError && galleryError.code !== 'PGRST116') {
			throw galleryError;
		}

		payload.image_id = galleryImage?.id ?? null;
	}

	const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();
	return { data, error };
}

export async function deleteSupplyStock(id: number): Promise<{ data: null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(TABLE).delete().eq('id', id);
	return { data: null, error };
}

export async function updateSupplyQuantity(
	id: number,
	newQuantity: number
): Promise<{ data: SupplyItemStock | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.update({ supply_quantity: newQuantity, last_update: new Date().toISOString().split('T')[0] })
		.eq('id', id)
		.select()
		.single();
	return { data, error };
}
