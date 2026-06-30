'use client';

import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Trash2, Plus, Edit, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { translateError } from '@/lib/error-translator';
import {
	User,
	listUsers,
	createUser,
	deleteUser,
	updateUser,
	updateUserPassword,
} from '@/lib/users/users';
import { cn } from '@/lib/utils';
import { roles, UserRole } from '@/constants/users/user-role';
import { useAuth } from '@/components/provider/auth-provider';

interface UsersDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function UsersDialog({ open, onOpenChange }: UsersDialogProps) {
	const { toast } = useToast();
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [formData, setFormData] = useState({
		username: '',
		password: '',
		role: '',
		name: '',
		last_name: '',
	});
	const [saving, setSaving] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [userToDelete, setUserToDelete] = useState<User | null>(null);
	const { user: currentUser } = useAuth();

	const isCurrentUser = (user: User) => user.username === currentUser?.username;

	const loadUsers = async () => {
		try {
			const { data, error } = await listUsers();
			if (error) {
				toast({
					title: 'Error al cargar usuarios',
					description: translateError(error) || 'Ocurrió un error al cargar los usuarios',
					variant: 'destructive',
				});
			} else {
				setUsers(data ?? []);
			}
		} catch (error: any) {
			toast({
				title: 'Error al cargar usuarios',
				description: translateError(error?.message) || 'Ocurrió un error al cargar los usuarios',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (open) {
			loadUsers();
			setShowForm(false);
			setEditingUser(null);
			setFormData({ username: '', password: '', role: '', name: '', last_name: '' });
		}
	}, [open]);

	const handleEdit = (user: User) => {
		setEditingUser(user);
		setFormData({
			username: user.username,
			password: '',
			role: user.role,
			name: user.name || '',
			last_name: user.last_name || '',
		});
		setShowForm(true);
	};

	const handleSave = async () => {
		if (!formData.username || !formData.role) {
			toast({ title: 'Completá todos los campos', variant: 'destructive' });
			return;
		}

		setSaving(true);

		if (editingUser) {
			const { error: updateError } = await updateUser(editingUser.uid_user!, {
				username: formData.username,
				role: formData.role as UserRole,
				name: formData.name,
				last_name: formData.last_name,
			});

			if (updateError) {
				toast({
					title: 'Error al actualizar usuario',
					description: translateError(updateError) || 'Ocurrió un error al actualizar el usuario',
					variant: 'destructive',
				});
				setSaving(false);
				return;
			}

			if (formData.password) {
				const { error: pwError } = await updateUserPassword(
					editingUser.uid_user!,
					formData.password
				);

				if (pwError) {
					toast({
						title: 'Error al actualizar contraseña',
						description: translateError(pwError),
						variant: 'destructive',
					});
					setSaving(false);
					return;
				}
			}

			toast({
				title: 'Usuario actualizado',
				description: `${formData.username} ha sido actualizado correctamente.`,
			});
		} else {
			if (!formData.password) {
				toast({ title: 'La contraseña es obligatoria', variant: 'destructive' });
				setSaving(false);
				return;
			}

			const { error } = await createUser({
				username: formData.username,
				password: formData.password,
				role: formData.role as UserRole,
				name: formData.name,
				last_name: formData.last_name,
			});

			if (error) {
				toast({
					title: 'Error al crear usuario',
					description: translateError(error),
					variant: 'destructive',
				});
				setSaving(false);
				return;
			}

			toast({
				title: 'Usuario creado',
				description: `${formData.username} ha sido creado correctamente.`,
			});
		}

		setShowForm(false);
		setEditingUser(null);
		setFormData({ username: '', password: '', role: '', name: '', last_name: '' });
		await loadUsers();
		setSaving(false);
	};

	const handleUpdateRole = async (user: User, newRole: string) => {
		if (!user.uid_user) return;

		const { error } = await updateUser(user.uid_user, { role: newRole as UserRole });

		if (error) {
			toast({
				title: 'Error al actualizar rol',
				description: translateError(error),
				variant: 'destructive',
			});
		} else {
			toast({
				title: 'Rol actualizado',
				description: `El rol de ${user.username} ahora es ${newRole}.`,
			});
			await loadUsers();
		}
	};

	const confirmDelete = async () => {
		const user = userToDelete;
		if (!user?.uid_user) {
			toast({
				title: 'Error al eliminar usuario',
				description: 'El usuario no tiene un ID válido.',
				variant: 'destructive',
			});
			setUserToDelete(null);
			return;
		}
		const { error } = await deleteUser(user.uid_user);
		if (error) {
			toast({
				title: 'Error al eliminar usuario',
				description: translateError(error),
				variant: 'destructive',
			});
			return;
		} else {
			toast({
				title: 'Usuario eliminado',
				description: `${user.username} ha sido eliminado correctamente.`,
			});
			await loadUsers();
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-card !max-w-3xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-foreground">
						{showForm ? (editingUser ? 'Editar usuario' : 'Nuevo usuario') : 'Configurar usuarios'}
					</DialogTitle>
					<DialogDescription className="text-muted-foreground">
						{showForm
							? editingUser
								? 'Actualizá los datos del usuario'
								: 'Completá los datos del nuevo usuario'
							: 'Administrá los usuarios del sistema'}
					</DialogDescription>
				</DialogHeader>

				{!showForm ? (
					<div className="space-y-4">
						<div className="flex justify-end">
							<Button onClick={() => setShowForm(true)} className="gap-2">
								<Plus className="h-4 w-4" />
								Agregar usuario
							</Button>
						</div>

						{loading ? (
							<p className="text-center text-muted-foreground py-8">Cargando usuarios...</p>
						) : users.length === 0 ? (
							<p className="text-center text-muted-foreground py-8">No hay usuarios registrados</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="text-center">Usuario</TableHead>
										<TableHead className="text-center">Apellido</TableHead>
										<TableHead className="text-center">Nombre</TableHead>
										<TableHead className="text-center">Rol</TableHead>
										<TableHead className="text-center w-[200px]">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{users.map((user) => (
										<TableRow key={user.uid_user || user.username}>
											<TableCell className="font-medium text-center">{user.username}</TableCell>
											<TableCell className="text-center">{user.last_name || '-'}</TableCell>
											<TableCell className="text-center">{user.name || '-'}</TableCell>
											<TableCell className="text-center">
												<div className="flex items-center gap-2 justify-center">
													<Select
														value={user.role}
														onValueChange={(value) => handleUpdateRole(user, value)}
													>
														{user.username !== currentUser?.username ? (
															<>
																<SelectTrigger
																	className={cn(
																		'h-8 w-[130px] text-center',
																		user.role === 'Admin' ? 'border-primary/30 text-primary' : ''
																	)}
																>
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	{roles.map((role) => (
																		<SelectItem key={role} value={role}>
																			{role}
																		</SelectItem>
																	))}
																</SelectContent>
															</>
														) : (
															<Label className="text-muted-foreground">{user.role}</Label>
														)}
													</Select>
												</div>
											</TableCell>
											<TableCell className="text-center">
												{!isCurrentUser(user) && (
													<div className="flex items-center gap-1 justify-center">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleEdit(user)}
															aria-label={`Editar ${user.username}`}
														>
															<Edit className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															className="text-destructive hover:text-destructive"
															onClick={() => setUserToDelete(user)}
															aria-label={`Eliminar ${user.username}`}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</div>
				) : (
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="username" className="text-foreground">
								Nombre de usuario
							</Label>
							<Input
								id="username"
								value={formData.username}
								onChange={(e) =>
									setFormData((p) => ({
										...p,
										username: e.target.value.replace(/\s/g, ''),
									}))
								}
								className="bg-background"
								placeholder="ej: juanperez"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="last_name" className="text-foreground">
								Apellido
							</Label>
							<Input
								id="last_name"
								value={formData.last_name}
								onChange={(e) => setFormData((p) => ({ ...p, last_name: e.target.value }))}
								className="bg-background"
								placeholder="ej: Pérez"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="name" className="text-foreground">
								Nombre
							</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
								className="bg-background"
								placeholder="ej: Juan"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="password" className="text-foreground">
								Contraseña{''}
								{editingUser && (
									<span className="text-muted-foreground font-normal">
										(La contraseña no se muestra por seguridad, dejá en blanco para no cambiar)
									</span>
								)}
							</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? 'text' : 'password'}
									value={formData.password}
									onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
									className="bg-background pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((p) => !p)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									tabIndex={-1}
								>
									{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="role" className="text-foreground">
								Rol
							</Label>
							<Select
								value={formData.role}
								onValueChange={(value) => setFormData((p) => ({ ...p, role: value }))}
							>
								<SelectTrigger className="bg-background">
									<SelectValue placeholder="Seleccionar rol" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Admin">Admin</SelectItem>
									<SelectItem value="Taller">Taller</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<DialogFooter className="gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setShowForm(false);
									setEditingUser(null);
									setFormData({ username: '', password: '', role: '', name: '', last_name: '' });
								}}
							>
								Cancelar
							</Button>
							<Button onClick={handleSave} disabled={saving}>
								{saving ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Crear usuario'}
							</Button>
						</DialogFooter>
					</div>
				)}
			</DialogContent>
			<AlertDialog open={!!userToDelete} onOpenChange={(o) => !o && setUserToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
					</AlertDialogHeader>
					<p className="text-sm text-muted-foreground">
						Esta acción no se puede deshacer. Se eliminará el usuario{' '}
						<strong>{userToDelete?.username}</strong> y no podrá iniciar sesión.
					</p>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Dialog>
	);
}
