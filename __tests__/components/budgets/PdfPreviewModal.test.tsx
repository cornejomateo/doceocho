import { render, screen } from '@testing-library/react';
import { PdfPreviewModal } from '@/components/business/budgets/PdfPreviewModal';
import { BudgetWithWork } from '@/lib/balances/balances';

const mockBudget = {
	id: 1,
	created_at: '2024-01-01',
	amount_ars: 1000,
	amount_usd: 10,
	number: '001',
	type: 'MDF',
	folder_budget: {
		id: 1,
		work_id: 5,
		work: { address: 'Calle 123', locality: 'Bs As' },
	},
} as BudgetWithWork;

describe('PdfPreviewModal', () => {
	const onOpenChange = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders nothing when closed', () => {
		const { container } = render(
			<PdfPreviewModal isOpen={false} onOpenChange={onOpenChange} budget={null} pdfUrl={null} />
		);

		expect(container.textContent).toBe('');
	});

	it('renders iframe when pdfUrl is provided', () => {
		render(
			<PdfPreviewModal
				isOpen={true}
				onOpenChange={onOpenChange}
				budget={mockBudget}
				pdfUrl="https://example.com/file.pdf"
			/>
		);

		const iframe = screen.getByTitle('Vista previa del PDF');
		expect(iframe).toBeInTheDocument();
		expect(iframe).toHaveAttribute('src', 'https://example.com/file.pdf');
	});

	it('shows budget number and type in title', () => {
		render(
			<PdfPreviewModal
				isOpen={true}
				onOpenChange={onOpenChange}
				budget={mockBudget}
				pdfUrl="https://example.com/file.pdf"
			/>
		);

		expect(screen.getByText(/MDF/)).toBeInTheDocument();
		expect(screen.getByText(/#001/)).toBeInTheDocument();
	});

	it('shows work address in description', () => {
		render(
			<PdfPreviewModal
				isOpen={true}
				onOpenChange={onOpenChange}
				budget={mockBudget}
				pdfUrl="https://example.com/file.pdf"
			/>
		);

		expect(screen.getByText('Calle 123 - Bs As')).toBeInTheDocument();
	});

	it('shows "Sin obra" when budget has no work', () => {
		const budgetWithoutWork = {
			...mockBudget,
			folder_budget: { id: 1, work_id: null, work: null },
		} as unknown as BudgetWithWork;

		render(
			<PdfPreviewModal
				isOpen={true}
				onOpenChange={onOpenChange}
				budget={budgetWithoutWork}
				pdfUrl="https://example.com/file.pdf"
			/>
		);

		expect(screen.getByText('Sin obra')).toBeInTheDocument();
	});

	it('shows "sin número" when budget has no number', () => {
		const budgetWithoutNumber = { ...mockBudget, number: null } as unknown as BudgetWithWork;

		render(
			<PdfPreviewModal
				isOpen={true}
				onOpenChange={onOpenChange}
				budget={budgetWithoutNumber}
				pdfUrl="https://example.com/file.pdf"
			/>
		);

		expect(screen.getByText(/sin número/)).toBeInTheDocument();
	});
});
