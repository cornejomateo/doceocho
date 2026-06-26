import { render, screen, fireEvent } from '@testing-library/react';
import { WorksList } from '@/components/business/works/works-list';
import { Work } from '@/lib/works/works';

jest.mock('@/hooks/clients/use-works-checklists', () => ({
	useWorkChecklists: () => ({
		workChecklists: {} as Record<number, boolean>,
		loadingChecklists: {} as Record<number, boolean>,
	}),
}));

jest.mock('@/lib/checklists/checklists', () => ({
	getChecklistsByWorkId: jest.fn().mockResolvedValue({ data: [], error: null }),
	createChecklist: jest.fn().mockResolvedValue({ error: null }),
}));

const mockWorks: Work[] = Array.from({ length: 8 }, (_, i) => ({
	id: i + 1,
	address: `Calle ${i + 1}`,
	locality: 'CABA',
	status: i % 2 === 0 ? 'pending' : 'in_progress',
	architect: i % 2 === 0 ? 'Arq. Pérez' : '',
	furniture: '',
	created_at: '2024-06-15',
}));

describe('WorksList', () => {
	const onDelete = jest.fn();
	const onWorkUpdated = jest.fn();
	const onCreateWork = jest.fn();
	const onUpdate = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders search input', () => {
		render(
			<WorksList
				works={mockWorks}
				onDelete={onDelete}
				onWorkUpdated={onWorkUpdated}
				onCreateWork={onCreateWork}
				onUpdate={onUpdate}
			/>
		);

		expect(
			screen.getByPlaceholderText('Buscar por dirección, arquitecto, zona, barrio o estado...')
		).toBeInTheDocument();
	});

	it('renders "Crear Obra" button when onCreateWork is provided', () => {
		render(
			<WorksList
				works={mockWorks}
				onDelete={onDelete}
				onWorkUpdated={onWorkUpdated}
				onCreateWork={onCreateWork}
				onUpdate={onUpdate}
			/>
		);

		expect(screen.getByText('Crear Obra')).toBeInTheDocument();
	});

	it('hides "Crear Obra" button when onCreateWork is not provided', () => {
		render(
			<WorksList
				works={mockWorks}
				onDelete={onDelete}
				onWorkUpdated={onWorkUpdated}
				onUpdate={onUpdate}
			/>
		);

		expect(screen.queryByText('Crear Obra')).not.toBeInTheDocument();
	});

	it('calls onCreateWork when button is clicked', () => {
		render(
			<WorksList
				works={mockWorks}
				onDelete={onDelete}
				onWorkUpdated={onWorkUpdated}
				onCreateWork={onCreateWork}
				onUpdate={onUpdate}
			/>
		);

		fireEvent.click(screen.getByText('Crear Obra'));
		expect(onCreateWork).toHaveBeenCalled();
	});

	it('renders work cards', () => {
		render(
			<WorksList
				works={mockWorks.slice(0, 3)}
				onDelete={onDelete}
				onWorkUpdated={onWorkUpdated}
				onUpdate={onUpdate}
			/>
		);

		expect(screen.getByText('Calle 1')).toBeInTheDocument();
		expect(screen.getByText('Calle 2')).toBeInTheDocument();
	});

	it('renders delete buttons when onDelete is provided', () => {
		render(
			<WorksList
				works={mockWorks.slice(0, 1)}
				onDelete={onDelete}
				onWorkUpdated={onWorkUpdated}
				onUpdate={onUpdate}
			/>
		);

		const trashButtons = screen.getAllByRole('button');
		expect(trashButtons.length).toBeGreaterThan(0);
	});

	it('opens delete dialog when trash icon is clicked', () => {
		render(
			<WorksList
				works={mockWorks.slice(0, 1)}
				onDelete={onDelete}
				onWorkUpdated={onWorkUpdated}
				onUpdate={onUpdate}
			/>
		);

		const buttons = screen.getAllByRole('button');
		const trashButton = buttons.find((b) => b.querySelector('svg.lucide-trash2') !== null);
		if (trashButton) {
			fireEvent.click(trashButton);
		}

		expect(screen.getByText('Eliminar obra')).toBeInTheDocument();
	});

	it('filters works by search term', () => {
		render(
			<WorksList
				works={mockWorks}
				onDelete={onDelete}
				onWorkUpdated={onWorkUpdated}
				onUpdate={onUpdate}
			/>
		);

		const searchInput = screen.getByPlaceholderText(
			'Buscar por dirección, arquitecto, zona, barrio o estado...'
		);
		fireEvent.change(searchInput, { target: { value: 'Calle 1' } });

		expect(screen.getByText('Calle 1')).toBeInTheDocument();
	});

	it('renders pagination when more than itemsPerPage works', () => {
		render(
			<WorksList
				works={mockWorks}
				onDelete={onDelete}
				onWorkUpdated={onWorkUpdated}
				onUpdate={onUpdate}
			/>
		);

		expect(screen.getByText('1')).toBeInTheDocument();
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	it('renders status select for each work', () => {
		render(
			<WorksList
				works={mockWorks.slice(0, 1)}
				onDelete={onDelete}
				onWorkUpdated={onWorkUpdated}
				onUpdate={onUpdate}
			/>
		);

		const statusSelect = screen.getByRole('combobox');
		expect(statusSelect).toBeInTheDocument();
	});

	it('rendes "Crear Checklists" button for works without checklists', () => {
		render(
			<WorksList
				works={mockWorks.slice(0, 1)}
				onDelete={onDelete}
				onWorkUpdated={onWorkUpdated}
				onUpdate={onUpdate}
			/>
		);

		const createButtons = screen.getAllByText('Crear Checklists');
		expect(createButtons.length).toBeGreaterThan(0);
	});
});
