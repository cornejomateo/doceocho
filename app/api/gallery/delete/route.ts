import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const code_name = searchParams.get('code_name')!;

		if (!code_name) {
			return NextResponse.json({ success: false, error: 'Código no completado' }, { status: 400 });
		}

		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);

		const table = 'supplies_category';
		const query = supabase.from(table).select('id, image_path').eq('supply_code', code_name);

		const { data: rows, error } = await query;

		if (error) throw error;

		if (!rows || rows.length === 0) {
			return NextResponse.json({ success: true });
		}

		const imagePath = rows[0].image_path;

		if (imagePath) {
			await supabase.storage.from('images').remove([imagePath]);
		}

		const ids = rows.map((r) => r.id);

		const { error: updateError } = await supabase
			.from(table)
			.update({ image_url: null, image_path: null })
			.in('id', ids);

		if (updateError) {
			return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error('Error deleting option:', error);
		return NextResponse.json({ success: false, error: error.message }, { status: 500 });
	}
}
