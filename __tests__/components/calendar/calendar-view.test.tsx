import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CalendarView } from '@/components/business/calendar/calendar-view';

jest.mock('@/hooks/calendar/use-load-events', () => ({
	useLoadEvents: () => ({
		events: [
			{ id: 1, title: 'Evento A', date: '01-01-2025', type: 'reuniones', is_overdue: false },
			{ id: 2, title: 'Evento B', date: '02-01-2025', type: 'colocacion', is_overdue: true },
		],
		isLoading: false,
		refresh: jest.fn(),
	}),
}));

jest.mock('@/components/ui/use-toast', () => ({ useToast: jest.fn() }));
jest.mock('@/components/provider/auth-provider', () => ({
	useAuth: () => ({ user: { role: 'Admin' } }),
}));

jest.mock('@/lib/calendar/events', () => ({
	createEvent: jest.fn(),
	deleteEvent: jest.fn().mockResolvedValue({ error: null }),
	deleteLastYearEvents: jest.fn().mockResolvedValue({ error: null }),
}));

// Mock UI primitives to simplify rendering
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
	Button: ({ children, type = 'button', ...props }: any) => (
		<button type={type} {...props}>
			{children}
		</button>
	),
}));

jest.mock('@/components/ui/card', () => ({
	Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock inner modals to avoid complexity
jest.mock('@/components/business/calendar/event-form-modal', () => ({
	EventFormModal: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/business/calendar/event-details-modal', () => ({
	EventDetailsModal: ({ isOpen, event }: any) => (isOpen ? <div>{event?.title}</div> : null),
}));

describe('CalendarView', () => {
	const toast = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		const { useToast } = require('@/components/ui/use-toast');
		(useToast as jest.Mock).mockReturnValue({ toast });
	});

	test('renders header and upcoming events', () => {
		render(<CalendarView />);

		expect(screen.getByText('Calendario')).toBeInTheDocument();
		// upcoming events titles
		expect(screen.getByText('Evento A')).toBeInTheDocument();
		expect(screen.getByText('Evento B')).toBeInTheDocument();
	});

	test('delete last year events triggers API and shows toast', async () => {
		const { deleteLastYearEvents } = require('@/lib/calendar/events');

		render(<CalendarView />);

		// click the destructive button to open dialog (mock renders dialog content)
		fireEvent.click(screen.getByText('Eliminar eventos del año pasado'));

		// click 'Eliminar' button inside dialog footer
		fireEvent.click(screen.getByText('Eliminar'));

		await waitFor(() => {
			expect(deleteLastYearEvents).toHaveBeenCalled();
			expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Eventos eliminados' }));
		});
	});
});
