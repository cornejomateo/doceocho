import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UsersDialog } from '@/components/business/users/users-dialog';
import {
	listUsers,
	createUser,
	deleteUser,
	updateUser,
	updateUserPassword,
} from '@/lib/users/users';
import { useToast } from '@/components/ui/use-toast';

jest.mock('@/lib/users/users', () => ({
	listUsers: jest.fn(),
	createUser: jest.fn(),
	deleteUser: jest.fn(),
	updateUser: jest.fn(),
	updateUserPassword: jest.fn(),
}));

jest.mock('@/components/ui/use-toast', () => ({
	useToast: jest.fn(),
}));

jest.mock('@/components/ui/dialog', () => ({
	Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
		open ? <div>{children}</div> : null,
	DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
	DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
	DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/alert-dialog', () => ({
	AlertDialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
		open ? <div>{children}</div> : null,
	AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
	AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	AlertDialogCancel: ({ children, ...props }: any) => <button {...props}>{children}</button>,
	AlertDialogAction: ({ children, onClick, ...props }: any) => (
		<button onClick={onClick} {...props}>
			{children}
		</button>
	),
}));

jest.mock('@/components/ui/button', () => ({
	Button: ({
		children,
		type = 'button',
		onClick,
		disabled,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
		<button type={type} onClick={onClick} disabled={disabled} {...props}>
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

jest.mock('@/components/ui/table', () => ({
	Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
	TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
	TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
	TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
	TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
	TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
}));

jest.mock('@/components/ui/select', () => ({
	Select: ({ children, onValueChange, value }: any) => {
		const React = require('react');
		const selectRef = React.useRef<HTMLSelectElement>(null);

		React.useEffect(() => {
			if (selectRef.current && value) {
				selectRef.current.value = value;
			}
		}, [value]);

		return (
			<select
				ref={selectRef}
				data-testid="select-role"
				value={value}
				onChange={(e) => onValueChange?.(e.target.value)}
			>
				{children}
			</select>
		);
	},
	SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
		<option value={value}>{children}</option>
	),
	SelectTrigger: ({ children, className }: any) => <>{children}</>,
	SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

describe('UsersDialog', () => {
	const toast = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		(useToast as jest.Mock).mockReturnValue({ toast });
	});

	it('loads and displays users on open', async () => {
		(listUsers as jest.Mock).mockResolvedValue({
			data: [
				{ uid_user: '1', username: 'admin1', role: 'Admin' },
				{ uid_user: '2', username: 'taller1', role: 'Taller' },
			],
			error: null,
		});

		render(<UsersDialog open onOpenChange={jest.fn()} />);

		await waitFor(() => {
			expect(screen.getByText('admin1')).toBeInTheDocument();
		});

		expect(screen.getByText('taller1')).toBeInTheDocument();
	});

	it('shows create user form when clicking Agregar usuario', async () => {
		(listUsers as jest.Mock).mockResolvedValue({ data: [], error: null });

		render(<UsersDialog open onOpenChange={jest.fn()} />);

		await waitFor(() => {
			expect(screen.getByText('Agregar usuario')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText('Agregar usuario'));

		expect(screen.getByLabelText('Nombre de usuario')).toBeInTheDocument();
		expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
	});

	it('creates a new user', async () => {
		(listUsers as jest.Mock).mockResolvedValue({ data: [], error: null });
		(createUser as jest.Mock).mockResolvedValue({ data: { success: true }, error: null });

		render(<UsersDialog open onOpenChange={jest.fn()} />);

		await waitFor(() => {
			expect(screen.getByText('Agregar usuario')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText('Agregar usuario'));

		fireEvent.change(screen.getByLabelText('Nombre de usuario'), {
			target: { value: 'nuevouser' },
		});
		fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '123456' } });

		const select = screen.getByTestId('select-role');
		fireEvent.change(select, { target: { value: 'Taller' } });

		fireEvent.click(screen.getByText('Crear usuario'));

		await waitFor(() => {
			expect(createUser).toHaveBeenCalledWith({
				username: 'nuevouser',
				password: '123456',
				role: 'Taller',
			});
		});

		expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Usuario creado' }));
	});

	it('updates user role', async () => {
		(listUsers as jest.Mock).mockResolvedValue({
			data: [{ uid_user: '1', username: 'user1', role: 'Taller' }],
			error: null,
		});
		(updateUser as jest.Mock).mockResolvedValue({ data: null, error: null });

		render(<UsersDialog open onOpenChange={jest.fn()} />);

		await waitFor(() => {
			expect(screen.getByText('user1')).toBeInTheDocument();
		});

		const select = screen.getByTestId('select-role');
		fireEvent.change(select, { target: { value: 'Admin' } });

		await waitFor(() => {
			expect(updateUser).toHaveBeenCalledWith('1', { role: 'Admin' });
		});

		expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Rol actualizado' }));
	});

	it('deletes a user', async () => {
		(listUsers as jest.Mock).mockResolvedValue({
			data: [{ uid_user: '1', username: 'user1', role: 'Taller' }],
			error: null,
		});
		(deleteUser as jest.Mock).mockResolvedValue({ error: null });

		render(<UsersDialog open onOpenChange={jest.fn()} />);

		await waitFor(() => {
			expect(screen.getByText('user1')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: /eliminar user1/i }));

		await waitFor(() => {
			expect(screen.getByText('¿Eliminar usuario?')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText('Eliminar'));

		await waitFor(() => {
			expect(deleteUser).toHaveBeenCalledWith('1');
		});

		expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Usuario eliminado' }));
	});

	it('shows edit form when clicking Editar button', async () => {
		(listUsers as jest.Mock).mockResolvedValue({
			data: [{ uid_user: '1', username: 'user1', role: 'Taller' }],
			error: null,
		});

		render(<UsersDialog open onOpenChange={jest.fn()} />);

		await waitFor(() => {
			expect(screen.getByText('user1')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: /editar user1/i }));

		expect(screen.getByDisplayValue('user1')).toBeInTheDocument();
		expect(screen.getByText('Guardar cambios')).toBeInTheDocument();
		expect(screen.getByText('Editar usuario')).toBeInTheDocument();
	});

	it('edits username and role without changing password', async () => {
		(listUsers as jest.Mock).mockResolvedValue({
			data: [{ uid_user: '1', username: 'user1', role: 'Taller' }],
			error: null,
		});
		(updateUser as jest.Mock).mockResolvedValue({ data: null, error: null });

		render(<UsersDialog open onOpenChange={jest.fn()} />);

		await waitFor(() => {
			expect(screen.getByText('user1')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: /editar user1/i }));

		fireEvent.change(screen.getByLabelText('Nombre de usuario'), {
			target: { value: 'user1-editado' },
		});

		const select = screen.getByTestId('select-role');
		fireEvent.change(select, { target: { value: 'Admin' } });

		fireEvent.click(screen.getByText('Guardar cambios'));

		await waitFor(() => {
			expect(updateUser).toHaveBeenCalledWith('1', {
				username: 'user1-editado',
				role: 'Admin',
			});
		});

		expect(updateUserPassword).not.toHaveBeenCalled();
		expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Usuario actualizado' }));
	});

	it('edits user and changes password', async () => {
		(listUsers as jest.Mock).mockResolvedValue({
			data: [{ uid_user: '1', username: 'user1', role: 'Taller' }],
			error: null,
		});
		(updateUser as jest.Mock).mockResolvedValue({ data: null, error: null });
		(updateUserPassword as jest.Mock).mockResolvedValue({ error: null });

		render(<UsersDialog open onOpenChange={jest.fn()} />);

		await waitFor(() => {
			expect(screen.getByText('user1')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: /editar user1/i }));

		fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'user1' } });
		fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'newpass123' } });

		fireEvent.click(screen.getByText('Guardar cambios'));

		await waitFor(() => {
			expect(updateUser).toHaveBeenCalledWith('1', {
				username: 'user1',
				role: 'Taller',
			});
		});

		expect(updateUserPassword).toHaveBeenCalledWith('1', 'newpass123');
		expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Usuario actualizado' }));
	});
});
