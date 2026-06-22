import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetCard } from '@/components/business/budgets/BudgetCard';
import { BudgetWithWork } from '@/lib/balances/balances';
import { BudgetFolderVM } from '@/components/business/reports/budgets/types';

const mockFolder: BudgetFolderVM = {
	id: 1,
	created_at: '2024-01-01',
	work_id: 5,
	client_id: 3,
	budgets: [],
};

const baseBudget: BudgetWithWork = {
	id: 1,
	created_at: '2024-06-15',
	amount_ars: 150000,
	amount_usd: 150,
	accepted: false,
	sold: false,
	lost: false,
	pdf_url: null,
	pdf_path: null,
	number: '001',
	type: 'MDF',
	folder_budget: {
		id: 1,
		work_id: 5,
		work: { address: 'Calle 123', locality: 'Bs As' },
	},
};

describe('BudgetCard', () => {
	const onChooseBudget = jest.fn();
	const onDeleteBudget = jest.fn();
	const onViewPdf = jest.fn();
	const onOpenDetail = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders budget number when present', () => {
		render(
			<BudgetCard
				budget={baseBudget}
				folder={mockFolder}
				isLoading={false}
				onChooseBudget={onChooseBudget}
				onDeleteBudget={onDeleteBudget}
				onViewPdf={onViewPdf}
				onOpenDetail={onOpenDetail}
			/>
		);

		expect(screen.getByText('#001')).toBeInTheDocument();
	});

	it('shows "Elegir" button when not chosen', () => {
		render(
			<BudgetCard
				budget={baseBudget}
				folder={mockFolder}
				isLoading={false}
				onChooseBudget={onChooseBudget}
				onDeleteBudget={onDeleteBudget}
				onViewPdf={onViewPdf}
				onOpenDetail={onOpenDetail}
			/>
		);

		expect(screen.getByText('Elegir')).toBeInTheDocument();
	});

	it('shows "Elegido" badge and button when accepted', () => {
		const chosenBudget = { ...baseBudget, accepted: true };
		render(
			<BudgetCard
				budget={chosenBudget}
				folder={mockFolder}
				isLoading={false}
				onChooseBudget={onChooseBudget}
				onDeleteBudget={onDeleteBudget}
				onViewPdf={onViewPdf}
				onOpenDetail={onOpenDetail}
			/>
		);

		const elegi = screen.getAllByText('Elegido');
		expect(elegi).toHaveLength(2);
	});

	it('calls onChooseBudget when choose button is clicked', () => {
		render(
			<BudgetCard
				budget={baseBudget}
				folder={mockFolder}
				isLoading={false}
				onChooseBudget={onChooseBudget}
				onDeleteBudget={onDeleteBudget}
				onViewPdf={onViewPdf}
				onOpenDetail={onOpenDetail}
			/>
		);

		fireEvent.click(screen.getByText('Elegir'));
		expect(onChooseBudget).toHaveBeenCalledWith(1);
	});

	it('calls onDeleteBudget when delete button is clicked', () => {
		render(
			<BudgetCard
				budget={baseBudget}
				folder={mockFolder}
				isLoading={false}
				onChooseBudget={onChooseBudget}
				onDeleteBudget={onDeleteBudget}
				onViewPdf={onViewPdf}
				onOpenDetail={onOpenDetail}
			/>
		);

		const deleteButton = screen.getByRole('button', { name: '' });
		fireEvent.click(deleteButton);
		expect(onDeleteBudget).toHaveBeenCalledWith(1);
	});

	it('calls onOpenDetail when card body is clicked', () => {
		render(
			<BudgetCard
				budget={baseBudget}
				folder={mockFolder}
				isLoading={false}
				onChooseBudget={onChooseBudget}
				onDeleteBudget={onDeleteBudget}
				onViewPdf={onViewPdf}
				onOpenDetail={onOpenDetail}
			/>
		);

		const card = screen.getByText('#001').closest('.cursor-pointer');
		fireEvent.click(card!);
		expect(onOpenDetail).toHaveBeenCalledWith(baseBudget);
	});

	it('shows "Sin PDF" when no pdf_path', () => {
		render(
			<BudgetCard
				budget={{ ...baseBudget, pdf_path: null }}
				folder={mockFolder}
				isLoading={false}
				onChooseBudget={onChooseBudget}
				onDeleteBudget={onDeleteBudget}
				onViewPdf={onViewPdf}
				onOpenDetail={onOpenDetail}
			/>
		);

		expect(screen.getByText('Sin PDF')).toBeInTheDocument();
	});

	it('shows "Ver PDF" button when pdf_path exists', () => {
		const budgetWithPdf = {
			...baseBudget,
			pdf_path: 'path/to/file.pdf',
			pdf_url: 'https://example.com/file.pdf',
		};
		render(
			<BudgetCard
				budget={budgetWithPdf}
				folder={mockFolder}
				isLoading={false}
				onChooseBudget={onChooseBudget}
				onDeleteBudget={onDeleteBudget}
				onViewPdf={onViewPdf}
				onOpenDetail={onOpenDetail}
			/>
		);

		expect(screen.getByText('Ver PDF')).toBeInTheDocument();
	});

	it('renders amount formatted', () => {
		render(
			<BudgetCard
				budget={baseBudget}
				folder={mockFolder}
				isLoading={false}
				onChooseBudget={onChooseBudget}
				onDeleteBudget={onDeleteBudget}
				onViewPdf={onViewPdf}
				onOpenDetail={onOpenDetail}
			/>
		);

		expect(screen.getByText(/150\.000/)).toBeInTheDocument();
	});
});
