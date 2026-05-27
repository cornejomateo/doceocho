'use client';

import { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Trash2, Edit } from 'lucide-react';
import {
	BankAccount,
	createBankAccount,
	updateBankAccount,
	deleteBankAccount,
} from '@/lib/cash-flow/cash-flow';
import { useToast } from '@/components/ui/use-toast';

interface BankAccountsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bankAccounts: BankAccount[];
	onBankAccountsUpdated: () => void;
}

export function BankAccountsDialog({
	open,
	onOpenChange,
	bankAccounts,
	onBankAccountsUpdated,
}: BankAccountsDialogProps) {
	const { toast } = useToast();
	const [isAdding, setIsAdding] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [name, setName] = useState('');
	const [bank, setBank] = useState('');
	const [accountNumber, setAccountNumber] = useState('');
	const [accountType, setAccountType] = useState('');
	const [loading, setLoading] = useState(false);

	const resetForm = () => {
		setName('');
		setBank('');
		setAccountNumber('');
		setAccountType('');
		setEditingId(null);
		setIsAdding(false);
	};

	const handleAdd = () => {
		resetForm();
		setIsAdding(true);
	};

	const handleEdit = (account: BankAccount) => {
		setName(account.name);
		setBank(account.bank);
		setAccountNumber(account.account_number);
		setAccountType(account.account_type);
		setEditingId(account.id);
		setIsAdding(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name || !bank || !accountNumber || !accountType) return;

		setLoading(true);
		try {
			if (editingId) {
				const { error } = await updateBankAccount(editingId, {
					name,
					bank,
					account_number: accountNumber,
					account_type: accountType,
				});
				if (error) throw error;
				toast({
					title: 'Cuenta actualizada',
					description: 'La cuenta bancaria ha sido actualizada correctamente.',
				});
			} else {
				const { error } = await createBankAccount({
					name,
					bank,
					account_number: accountNumber,
					account_type: accountType,
					is_active: true,
				});
				if (error) throw error;
				toast({
					title: 'Cuenta creada',
					description: 'La cuenta bancaria ha sido creada correctamente.',
				});
			}
			resetForm();
			onBankAccountsUpdated();
		} catch (error) {
			console.error('Error saving bank account:', error);
			toast({
				title: 'Error',
				description: 'No se pudo guardar la cuenta bancaria.',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id: number) => {
		try {
			const { error } = await deleteBankAccount(id);
			if (error) throw error;
			toast({
				title: 'Cuenta eliminada',
				description: 'La cuenta bancaria ha sido eliminada correctamente.',
			});
			onBankAccountsUpdated();
		} catch (error) {
			console.error('Error deleting bank account:', error);
			toast({
				title: 'Error',
				description: 'No se pudo eliminar la cuenta bancaria.',
				variant: 'destructive',
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Building2 className="h-5 w-5" />
						Cuentas Bancarias
					</DialogTitle>
					<DialogDescription>Gestiona las cuentas bancarias para transferencias</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{!isAdding && (
						<Button onClick={handleAdd} className="w-full gap-2">
							<Plus className="h-4 w-4" />
							Agregar Nueva Cuenta
						</Button>
					)}

					{isAdding && (
						<Card className="p-4 bg-card border-border">
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Nombre de la Cuenta</Label>
									<Input
										id="name"
										placeholder="Ej: Cuenta Principal"
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="bank">Banco</Label>
									<Input
										id="bank"
										placeholder="Ej: Banco Galicia"
										value={bank}
										onChange={(e) => setBank(e.target.value)}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="accountNumber">Número de Cuenta</Label>
									<Input
										id="accountNumber"
										placeholder="Ej: 1234-5678-9012"
										value={accountNumber}
										onChange={(e) => setAccountNumber(e.target.value)}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="accountType">Tipo de Cuenta</Label>
									<Select value={accountType} onValueChange={setAccountType} required>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona el tipo" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="checking">Cuenta Corriente</SelectItem>
											<SelectItem value="savings">Caja de Ahorro</SelectItem>
											<SelectItem value="other">Otro</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="flex gap-2">
									<Button type="submit" disabled={loading} className="flex-1">
										{loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
									</Button>
									<Button type="button" variant="outline" onClick={resetForm}>
										Cancelar
									</Button>
								</div>
							</form>
						</Card>
					)}

					<div className="space-y-2">
						{bankAccounts.map((account) => (
							<Card key={account.id} className="p-4 bg-card border-border">
								<div className="flex items-center justify-between">
									<div>
										<h4 className="font-semibold text-foreground">{account.name}</h4>
										<p className="text-sm text-muted-foreground">{account.bank}</p>
										<p className="text-sm text-muted-foreground">{account.account_number}</p>
										<Badge variant="secondary" className="mt-2">
											{account.account_type === 'checking' && 'Cuenta Corriente'}
											{account.account_type === 'savings' && 'Caja de Ahorro'}
											{account.account_type === 'other' && 'Otro'}
										</Badge>
									</div>
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleEdit(account)}
											disabled={isAdding}
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDelete(account.id)}
											className="text-destructive"
											disabled={isAdding}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</Card>
						))}

						{bankAccounts.length === 0 && !isAdding && (
							<p className="text-center text-muted-foreground py-8">
								No hay cuentas bancarias registradas
							</p>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cerrar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
