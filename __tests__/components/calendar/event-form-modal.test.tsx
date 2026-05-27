import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EventFormModal } from '@/components/business/calendar/event-form-modal';
import { useToast } from '@/components/ui/use-toast';

jest.mock('@/components/ui/use-toast', () => ({
	useToast: jest.fn(),
}));

// Mock only complex portal/dialog behavior
jest.mock('@/components/ui/dialog', () => ({
	Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
	DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
	DialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('EventFormModal', () => {
	const toast = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();

		(useToast as jest.Mock).mockReturnValue({
			toast,
		});
	});

	it('shows validation toast and prevents submit when date is missing', async () => {
		const user = userEvent.setup();
		const onSave = jest.fn();

		render(
			<EventFormModal onSave={onSave}>
				<button type="button">Open modal</button>
			</EventFormModal>
		);

		// Open modal
		await user.click(screen.getByRole('button', { name: /open modal/i }));

		// Submit form without date
		await user.click(screen.getByRole('button', { name: /guardar/i }));

		expect(toast).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Error en la fecha',
			})
		);

		expect(onSave).not.toHaveBeenCalled();
	});
});
