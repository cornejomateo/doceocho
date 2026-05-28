import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CalendarDay } from '@/components/business/calendar/calendar-days';

describe('CalendarDay component', () => {
	test('renders day number and applies today styles', () => {
		render(
			<CalendarDay day={5} events={{}} isToday={true} isSelected={false} onClick={() => {}} />
		);

		const dayEl = screen.getByText('5');
		expect(dayEl).toBeInTheDocument();
		expect(dayEl).toHaveClass('text-green-600');
	});

	test('renders event indicators and count when there are events', () => {
		const events = {
			reuniones: [
				{ id: 1, date: '2024-01-01', title: 'a', is_overdue: true },
				{ id: 2, date: '2024-01-01', title: 'b', is_overdue: false },
			],
		};

		render(
			<CalendarDay
				day={12}
				events={events as any}
				isToday={false}
				isSelected={false}
				onClick={() => {}}
			/>
		);

		// title contains count and label (lowercased)
		const wrapper = screen.getByTitle(/2 reuniones/i);
		expect(wrapper).toBeInTheDocument();

		// count badge '2' should be visible
		const count = screen.getByText('2');
		expect(count).toBeInTheDocument();

		// there should be a dot element (the colored circle)
		const dot = wrapper.querySelector('div');
		expect(dot).toBeTruthy();
	});
});
