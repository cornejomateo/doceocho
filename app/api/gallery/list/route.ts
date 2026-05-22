import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);

		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);

		const name_code = url.searchParams.get('name_code');

		const query = supabase
			.from('gallery_supplies')
			.select('id, supply_code, image_url, image_path, created_at')
			.eq('supply_code', name_code || '')
			.order('created_at', { ascending: false });

		const { data, error } = await query;
		if (error) throw error;

		const normalizedImages = await Promise.all(
			(data || []).map(async (row) => {
				if (row.image_path) {
					const { data: signedData } = await supabase.storage
						.from('stock_supplies')
						.createSignedUrl(row.image_path, 60 * 60);
					return {
						...row,
						image_url: signedData?.signedUrl || row.image_url,
					};
				}

				return row;
			})
		);

		return NextResponse.json({ success: true, images: normalizedImages });
	} catch (error: any) {
		console.error('Error fetching gallery images:', error);
		return NextResponse.json({ success: false, error: error.message }, { status: 500 });
	}
}
