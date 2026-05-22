export type StockCategory = 'Insumos';

export interface StockConfig {
	title: string;
	tableName: string;
	galleryTableName: string;
	fields: {
		category: string;
		line: string;
		brand: string;
		code: string;
		description: string;
		color: string;
		quantityForLump: string;
		quantityLump: string;
		quantity: string;
		site: string;
		material: string;
		price: string;
		image_url: string;
		image_path?: string;
		createdAt: string;
	};
}

export const STOCK_CONFIGS: Record<StockCategory, StockConfig> = {
	Insumos: {
		title: 'Insumos',
		tableName: 'stock_supplies',
		galleryTableName: 'gallery_images_supplies',
		fields: {
			category: 'supply_category',
			line: 'supply_line',
			brand: 'supply_brand',
			code: 'supply_code',
			description: 'supply_description',
			color: 'supply_color',
			quantityForLump: 'supply_quantity_for_lump',
			quantityLump: 'supply_quantity_lump',
			quantity: 'supply_quantity',
			site: 'supply_site',
			material: 'supply_material',
			price: 'supply_price',
			image_url: 'image_url',
			image_path: 'image_path',
			createdAt: 'created_at',
		},
	},
};
