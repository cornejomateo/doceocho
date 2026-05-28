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
import { Textarea } from '@/components/ui/textarea';
import { BankAccount } from '@/lib/cash-flow/cash-flow';
import { translateError } from '@/lib/error-translator';

interface TransactionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	type: 'income' | 'expense';
	cashBoxId: number;
	bankAccounts: BankAccount[];
	onTransactionCreated: () => void;
}

interface CategoryOption {
	value: string;
	label: string;
}

const INCOME_CATEGORIES: CategoryOption[] = [
	{ value: 'cash', label: 'Efectivo' },
	{ value: 'transfer', label: 'Transferencia' },
];
const EXPENSE_CATEGORIES: CategoryOption[] = [
	{ value: 'salary', label: 'Pago de Sueldo' },
	{ value: 'suppliers', label: 'Pago a Proveedores' },
	{ value: 'services', label: 'Servicios' },
	{ value: 'other', label: 'Otros Gastos' },
];

export function TransactionDialog({
	open,
	onOpenChange,
	type,
	cashBoxId,
	bankAccounts,
	onTransactionCreated,
}: TransactionDialogProps) {
	const [amount, setAmount] = useState('');
	const [category, setCategory] = useState('');
	const [description, setDescription] = useState('');
	const [bankAccountId, setBankAccountId] = useState<string>('');
	const [reference, setReference] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!amount || !category) return;
		const parsedAmount = Number(amount);
		if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

		setLoading(true);
		try {
			const { createTransaction } = await import('@/lib/cash-flow/cash-flow');

			const transactionData: any = {
				cash_box_id: cashBoxId,
				type,
				amount: parsedAmount,
				category,
				description: description || null,
				bank_account_id: category === 'transfer' && bankAccountId ? parseInt(bankAccountId) : null,
				reference: reference || null,
			};

			const { error } = await createTransaction(transactionData);
			if (error) throw error;

			onTransactionCreated();
			resetForm();
		} catch (error) {
			translateError(error);
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setAmount('');
		setCategory('');
		setDescription('');
		setBankAccountId('');
		setReference('');
	};

	const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{type === 'income' ? 'Registrar Ingreso' : 'Registrar Egreso'}</DialogTitle>
					<DialogDescription>
						{type === 'income'
							? 'Registra un nuevo ingreso a la caja actual'
							: 'Registra un nuevo egreso de la caja actual'}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="amount">Monto</Label>
							<Input
								id="amount"
								type="number"
								step="0.01"
								min="0"
								placeholder="0.00"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="category">Categoría</Label>
							<Select value={category} onValueChange={setCategory} required>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona una categoría" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((cat) => (
										<SelectItem key={cat.value} value={cat.value}>
											{cat.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{category === 'transfer' && (
							<div className="space-y-2">
								<Label htmlFor="bankAccount">Cuenta Bancaria</Label>
								<Select value={bankAccountId} onValueChange={setBankAccountId}>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona una cuenta" />
									</SelectTrigger>
									<SelectContent>
										{bankAccounts.map((account) => (
											<SelectItem key={account.id} value={String(account.id)}>
												{account.bank} - {account.name} ({account.account_number})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="description">Descripción (opcional)</Label>
							<Input
								id="description"
								placeholder="Descripción del movimiento"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>

						{category === 'transfer' && (
							<div className="space-y-2">
								<Label htmlFor="reference">Referencia (opcional)</Label>
								<Input
									id="reference"
									placeholder="Número de referencia o comprobante"
									value={reference}
									onChange={(e) => setReference(e.target.value)}
								/>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Cancelar
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? 'Guardando...' : 'Guardar'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
