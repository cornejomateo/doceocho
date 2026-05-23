import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SupplyFormDialog } from '@/components/business/stock/supplies-add-dialog';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/provider/auth-provider';

jest.mock('@/components/provider/auth-provider', () => ({
	useAuth: jest.fn(),
}));

jest.mock('@/components/ui/use-toast', () => ({
	toast: jest.fn(),
}));

jest.mock('@/components/ui/dialog', () => ({
	Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
	DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
	DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
	Button: ({
		children,
		type = 'button',
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
		<button type={type} {...props}>
			{children}
		</button>
	),
}));

jest.mock('@/components/ui/input', () => {
	const React = require('react');

	return {
		Input: React.forwardRef(
			(props: React.InputHTMLAttributes<HTMLInputElement>, ref: React.Ref<HTMLInputElement>) => (
				<input ref={ref} {...props} />
			)
		),
	};
});

jest.mock('@/components/ui/label', () => ({
	Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
		<label {...props}>{children}</label>
	),
}));

describe('SupplyFormDialog', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(useAuth as jest.Mock).mockReturnValue({ user: { role: 'Admin' } });
	});

	it('creates a supply item with numeric quantities', async () => {
		const onSave = jest.fn();
		const onOpenChange = jest.fn();

		render(
			<SupplyFormDialog open onOpenChange={onOpenChange} onSave={onSave} triggerButton={false} />
		);

		fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'Insumos' } });
		fireEvent.change(screen.getByLabelText('Línea'), { target: { value: 'Línea A' } });
		fireEvent.change(screen.getByLabelText('Marca'), { target: { value: 'Marca X' } });
		fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'S-001' } });
		fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Descripción' } });
		fireEvent.change(screen.getByLabelText('Color'), { target: { value: 'Blanco' } });
		fireEvent.change(screen.getByLabelText('Cantidad x bulto'), { target: { value: '10' } });
		fireEvent.change(screen.getByLabelText('Cantidad de bultos'), { target: { value: '3' } });
		fireEvent.change(screen.getByLabelText('Cantidad total'), { target: { value: '30' } });
		fireEvent.change(screen.getByLabelText('Ubicación'), { target: { value: 'Depósito' } });
		fireEvent.change(screen.getByLabelText('Precio (opcional)'), { target: { value: '1200' } });

		fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

		await waitFor(() => {
			expect(onSave).toHaveBeenCalledWith(
				expect.objectContaining({
					supply_category: 'Insumos',
					supply_line: 'Línea A',
					supply_brand: 'Marca X',
					supply_code: 'S-001',
					supply_description: 'Descripción',
					supply_color: 'Blanco',
					supply_quantity_for_lump: 10,
					supply_quantity_lump: 3,
					supply_quantity: 30,
					supply_site: 'Depósito',
					supply_material: 'Aluminio',
					supply_price: 1200,
					created_at: expect.any(String),
				})
			);
		});

		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(toast).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Ítem agregado',
			})
		);
	});

	it('loads an existing item for editing and preserves created_at', async () => {
		const onSave = jest.fn();
		const onOpenChange = jest.fn();

		render(
			<SupplyFormDialog
				open
				onOpenChange={onOpenChange}
				onSave={onSave}
				triggerButton={false}
				editItem={
					{
						id: 5,
						supply_category: 'Insumos',
						supply_line: 'Línea A',
						supply_brand: 'Marca X',
						supply_code: 'S-001',
						supply_description: 'Original',
						supply_color: 'Blanco',
						supply_quantity_for_lump: 10,
						supply_quantity_lump: 3,
						supply_quantity: 30,
						supply_site: 'Depósito',
						supply_material: 'PVC',
						supply_price: 1500,
						created_at: '2026-05-23',
					} as any
				}
			/>
		);

		expect(screen.getByDisplayValue('Original')).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('Ubicación'), { target: { value: 'Depósito 2' } });
		fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

		await waitFor(() => {
			expect(onSave).toHaveBeenCalledWith(
				expect.objectContaining({
					created_at: '2026-05-23',
					supply_material: 'PVC',
					supply_site: 'Depósito 2',
				})
			);
		});

		expect(toast).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Ítem actualizado',
			})
		);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
