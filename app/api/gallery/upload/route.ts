import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const file = formData.get('file') as File;
		const name_code = formData.get('name_code') as string;

		if (!file || !name_code) {
			return NextResponse.json(
				{ success: false, error: 'Faltan campos obligatorios' },
				{ status: 400 }
			);
		}

		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);

		const path = 'supplies';
		const galleryTable = 'gallery_supplies';
		const stockTable = 'stock_supplies';

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const compressed = await sharp(buffer)
			.resize({ width: 1200, withoutEnlargement: true })
			.jpeg({ quality: 75, mozjpeg: true })
			.toBuffer();

		const ext = 'jpg';
		const fileName = `${crypto.randomUUID()}.${ext}`;

		const filePath = `${path}/${fileName}`;

		const { error: uploadError } = await supabase.storage
			.from('stock_supplies')
			.upload(filePath, compressed, {
				contentType: 'image/jpeg',
				upsert: true,
			});

		if (uploadError) throw uploadError;

		const image_path = filePath;

		const { data: imageRow, error: insertError } = await supabase
			.from(galleryTable)
			.insert({
				supply_code: name_code,
				image_url: null,
				image_path,
			})
			.select('id')
			.single();

		if (insertError) {
			await supabase.storage.from('stock_supplies').remove([filePath]);
			throw insertError;
		}

		const { data: matchingRows, error: searchError } = await supabase
			.from(stockTable)
			.select('id')
			.eq('supply_code', name_code);

		if (searchError) throw searchError;

		if (matchingRows && matchingRows.length > 0) {
			const idsToUpdate = matchingRows.map((row: any) => row.id);

			const { error } = await supabase
				.from(stockTable)
				.update({ image_id: imageRow.id, last_update: new Date().toISOString().split('T')[0] })
				.in('id', idsToUpdate);

			if (error) {
				console.error('Error updating supplies with new image URL:', error);
				throw error;
			}
		}

		return NextResponse.json({
			success: true,
			image_id: imageRow.id,
			image_url: null,
			image_path,
		});
	} catch (err) {
		console.error(err);
		return NextResponse.json({ success: false, error: 'Error al subir imagen' }, { status: 500 });
	}
}
