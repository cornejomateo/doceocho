import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EventDetailsModal } from '@/components/business/calendar/event-details-modal';

jest.mock('@/components/ui/dialog', () => ({
	Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
	DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

jest.mock('@/components/ui/button', () => ({
	Button: ({ children, type = 'button', ...props }: any) => (
		<button type={type} {...props}>
			{children}
		</button>
	),
}));

jest.mock('@/components/ui/badge', () => ({
	Badge: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@/components/ui/use-toast', () => ({ useToast: jest.fn() }));
jest.mock('@/lib/calendar/events', () => ({
	updateEvent: jest.fn().mockResolvedValue({ error: null }),
}));

describe('EventDetailsModal', () => {
	const toast = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		const { useToast } = require('@/components/ui/use-toast');
		(useToast as jest.Mock).mockReturnValue({ toast });
	});

	test('renders event details and toggles remember', async () => {
		const onClose = jest.fn();
		const onEventUpdated = jest.fn();

		const event = {
			id: 33,
			title: 'Prueba evento',
			date: '05-05-2025',
			client: 'ACME',
			location: 'Ciudad',
			address: 'Calle 1',
			description: 'Desc',
			type: 'reuniones',
			is_overdue: false,
			remember: false,
		} as any;

		render(
			<EventDetailsModal
				isOpen={true}
				onClose={onClose}
				event={event}
				onEventUpdated={onEventUpdated}
			/>
		);

		expect(screen.getByText('Prueba evento')).toBeInTheDocument();
		expect(screen.getByText('05-05-2025')).toBeInTheDocument();
		expect(screen.getByText('ACME')).toBeInTheDocument();

		const buttons = screen.getAllByRole('button');
		// first is Cerrar, second is remember toggle
		fireEvent.click(buttons[1]);

		await waitFor(() => {
			const { updateEvent } = require('@/lib/calendar/events');
			expect(updateEvent).toHaveBeenCalledWith(33, { remember: true });
			expect(toast).toHaveBeenCalledWith(
				expect.objectContaining({ title: 'Recordatorio actualizado' })
			);
			expect(onEventUpdated).toHaveBeenCalled();
		});
	});
});
