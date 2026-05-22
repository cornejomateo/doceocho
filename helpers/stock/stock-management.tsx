import { STOCK_CONFIGS } from '@/lib/stock/stock-config';

export const getTitle = (category: string, materialType: string) => {
	return `Gestión de ${STOCK_CONFIGS.Insumos.title}`;
};

export const getDescription = (category: string, materialType: string) => {
	return `Control de inventario de ${STOCK_CONFIGS.Insumos.title.toLowerCase()}`;
};
