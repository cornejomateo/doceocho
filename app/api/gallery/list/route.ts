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
			.from('supplies_category')
			.select('*')
			.limit(1)
			.eq('supply_code', name_code || '');

		const { data, error } = await query;
		if (error) throw error;

		return NextResponse.json({ success: true, images: data });
	} catch (error: any) {
		console.error('Error fetching gallery images:', error);
		return NextResponse.json({ success: false, error: error.message }, { status: 500 });
	}
}
