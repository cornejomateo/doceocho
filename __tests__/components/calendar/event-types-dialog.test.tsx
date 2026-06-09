import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventTypesDialog } from '@/components/business/calendar/event-types-dialog';
import { createEventType, updateEventType, deleteEventType } from '@/lib/calendar/event-types';
import { toast } from '@/components/ui/use-toast';

jest.mock('@/lib/calendar/event-types', () => ({
	createEventType: jest.fn(),
	updateEventType: jest.fn(),
	deleteEventType: jest.fn(),
}));

jest.mock('@/components/ui/use-toast', () => ({
	toast: jest.fn(),
}));

jest.mock('@/lib/error-translator', () => ({
	translateError: () => 'Error traducido',
}));

const mockRefresh = jest.fn();

const eventTypes = [
	{
		id: 1,
		name: 'Reunión',
		color: '#ff0000',
	},
	{
		id: 2,
		name: 'Llamada',
		color: '#00ff00',
	},
];

describe('EventTypesDialog', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('render exists types', () => {
		render(
			<EventTypesDialog
				open
				onOpenChange={jest.fn()}
				eventTypes={eventTypes}
				refresh={mockRefresh}
			/>
		);

		expect(screen.getByText('Reunión')).toBeInTheDocument();
		expect(screen.getByText('Llamada')).toBeInTheDocument();
	});

	it('show message when no types exist', () => {
		render(
			<EventTypesDialog open onOpenChange={jest.fn()} eventTypes={[]} refresh={mockRefresh} />
		);

		expect(screen.getByText('No hay tipos de eventos creados.')).toBeInTheDocument();
	});

	it('show error when name is empty', async () => {
		render(
			<EventTypesDialog open onOpenChange={jest.fn()} eventTypes={[]} refresh={mockRefresh} />
		);

		fireEvent.click(
			screen.getByRole('button', {
				name: /agregar tipo de evento/i,
			})
		);

		expect(toast).toHaveBeenCalled();
		expect(createEventType).not.toHaveBeenCalled();
	});

	it('show message when creating event type', async () => {
		(createEventType as jest.Mock).mockResolvedValue({
			error: null,
		});

		render(
			<EventTypesDialog open onOpenChange={jest.fn()} eventTypes={[]} refresh={mockRefresh} />
		);

		fireEvent.change(screen.getByPlaceholderText('Ej: Reunión, Llamada, etc.'), {
			target: { value: 'Visita' },
		});

		fireEvent.click(
			screen.getByRole('button', {
				name: /agregar tipo de evento/i,
			})
		);

		await waitFor(() => {
			expect(createEventType).toHaveBeenCalledWith({
				name: 'Visita',
				color: '#3b82f6',
			});
		});

		expect(mockRefresh).toHaveBeenCalled();
	});

	it('show message when loading data to edit', () => {
		render(
			<EventTypesDialog
				open
				onOpenChange={jest.fn()}
				eventTypes={eventTypes}
				refresh={mockRefresh}
			/>
		);

		fireEvent.click(screen.getAllByRole('button')[1]);

		expect(screen.getByDisplayValue('Reunión')).toBeInTheDocument();
	});

	it('show message when updating event type', async () => {
		(updateEventType as jest.Mock).mockResolvedValue({
			error: null,
		});

		render(
			<EventTypesDialog
				open
				onOpenChange={jest.fn()}
				eventTypes={eventTypes}
				refresh={mockRefresh}
			/>
		);

		fireEvent.click(screen.getAllByRole('button')[1]);

		const input = screen.getByDisplayValue('Reunión');

		fireEvent.change(input, {
			target: {
				value: 'Reunión Cliente',
			},
		});

		fireEvent.click(
			screen.getByRole('button', {
				name: /actualizar tipo de evento/i,
			})
		);

		await waitFor(() => {
			expect(updateEventType).toHaveBeenCalledWith(
				1,
				expect.objectContaining({
					name: 'Reunión Cliente',
				})
			);
		});
	});

	it('show message when opening deletion dialog', async () => {
		render(
			<EventTypesDialog
				open
				onOpenChange={jest.fn()}
				eventTypes={eventTypes}
				refresh={mockRefresh}
			/>
		);

		const buttons = screen.getAllByRole('button');

		fireEvent.click(buttons[2]);

		expect(screen.getByText(/Eliminar tipo de evento/i)).toBeInTheDocument();
	});

	it('show message when deleting event type', async () => {
		(deleteEventType as jest.Mock).mockResolvedValue({
			error: null,
		});

		render(
			<EventTypesDialog
				open
				onOpenChange={jest.fn()}
				eventTypes={eventTypes}
				refresh={mockRefresh}
			/>
		);

		const buttons = screen.getAllByRole('button');

		fireEvent.click(buttons[2]);

		fireEvent.click(
			screen.getByRole('button', {
				name: /eliminar/i,
			})
		);

		await waitFor(() => {
			expect(deleteEventType).toHaveBeenCalledWith(1);
		});

		expect(mockRefresh).toHaveBeenCalled();
	});

	it('show message when handling error while saving', async () => {
		(createEventType as jest.Mock).mockResolvedValue({
			error: new Error('error'),
		});

		render(
			<EventTypesDialog open onOpenChange={jest.fn()} eventTypes={[]} refresh={mockRefresh} />
		);

		fireEvent.change(screen.getByPlaceholderText('Ej: Reunión, Llamada, etc.'), {
			target: { value: 'Prueba' },
		});

		fireEvent.click(
			screen.getByRole('button', {
				name: /agregar tipo de evento/i,
			})
		);

		await waitFor(() => {
			expect(toast).toHaveBeenCalled();
		});
	});
});
