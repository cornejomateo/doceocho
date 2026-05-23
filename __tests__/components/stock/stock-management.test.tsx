import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { StockManagement } from '@/components/business/stock/stock-management';
import { useOptimizedRealtime } from '@/hooks/use-optimized-realtime';

jest.mock('@/hooks/use-optimized-realtime', () => ({
	useOptimizedRealtime: jest.fn(),
}));

jest.mock('@/components/ui/use-toast', () => ({
	toast: jest.fn(),
}));

jest.mock('@/components/provider/auth-provider', () => ({
	useAuth: () => ({ user: { role: 'Admin' } }),
}));

jest.mock('@/lib/stock/adapters', () => ({
	STOCK_ADAPTERS: {
		Insumos: {
			fetch: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			remove: jest.fn(),
			updateQuantity: jest.fn(),
			getQuantity: jest.fn((item: any) => item.supply_quantity),
		},
	},
}));

jest.mock('@/lib/stock/stock-config', () => ({
	STOCK_CONFIGS: {
		Insumos: { tableName: 'stock_supplies', title: 'Insumos' },
	},
}));

jest.mock('@/helpers/stock/stock-management', () => ({
	getDescription: () => 'Descripción de insumos',
	getTitle: () => 'Insumos',
}));

jest.mock('@/components/business/stock/stock-filters', () => ({
	StockFilters: ({ searchTerm, setSearchTerm, showOutOfStock, setShowOutOfStock }: any) => (
		<div>
			<input
				placeholder="Buscar por ubicación, categoría, código, línea o color..."
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
			/>
			<button onClick={() => setShowOutOfStock(!showOutOfStock)}>toggle</button>
		</div>
	),
}));

jest.mock('@/components/business/stock/stock-stats', () => ({
	StockStats: () => <div>stats</div>,
}));

jest.mock('@/components/business/stock/images/photo-gallery-modal', () => ({
	PhotoGalleryModal: ({ open }: { open: boolean }) => (open ? <div data-testid="gallery" /> : null),
}));

jest.mock('@/components/business/stock/supplies-add-dialog', () => ({
	SupplyFormDialog: ({
		open,
		triggerButton,
		onOpenChange,
	}: {
		open: boolean;
		triggerButton?: boolean;
		onOpenChange: (open: boolean) => void;
	}) => (
		<div>
			{triggerButton && <button onClick={() => onOpenChange(true)}>Agregar insumo</button>}
			{open ? <div data-testid="supply-dialog" /> : null}
		</div>
	),
}));

jest.mock('@/components/business/stock/stock-tables', () => ({
	SuppliesTable: ({ filteredStock }: { filteredStock: any[] }) => (
		<div>
			{filteredStock.map((item) => (
				<div key={item.id}>{item.supply_code}</div>
			))}
		</div>
	),
}));

jest.mock('@/components/ui/button', () => ({
	Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
		<button {...props}>{children}</button>
	),
}));

jest.mock('@/components/ui/pagination', () => ({
	Pagination: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	PaginationContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	PaginationItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	PaginationLink: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
	PaginationNext: ({ onClick }: any) => <button onClick={onClick}>next</button>,
	PaginationPrevious: ({ onClick }: any) => <button onClick={onClick}>prev</button>,
}));

describe('StockManagement', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(useOptimizedRealtime as jest.Mock).mockReturnValue({
			data: [
				{
					id: 1,
					supply_code: 'A1',
					supply_category: 'Cat',
					supply_quantity: 5,
					created_at: '2026-05-23',
				},
				{
					id: 2,
					supply_code: 'B2',
					supply_category: 'Cat',
					supply_quantity: 0,
					created_at: '2026-05-22',
				},
			],
			loading: false,
			error: null,
		});
	});

	it('renders stock items and filters by search', () => {
		render(<StockManagement />);

		expect(screen.getByText('A1')).toBeInTheDocument();
		expect(screen.getByText('B2')).toBeInTheDocument();

		fireEvent.change(
			screen.getByPlaceholderText('Buscar por ubicación, categoría, código, línea o color...'),
			{
				target: { value: 'A1' },
			}
		);

		expect(screen.getByText('A1')).toBeInTheDocument();
	});

	it('opens add dialog from button', () => {
		render(<StockManagement />);
		fireEvent.click(screen.getByText('Agregar insumo'));
		expect(screen.getByTestId('supply-dialog')).toBeInTheDocument();
	});
});
