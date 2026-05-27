'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	DollarSign,
	ArrowUpCircle,
	ArrowDownCircle,
	Plus,
	RefreshCw,
	History,
	Building2,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
	CashBox,
	Transaction,
	BankAccount,
	getOpenCashBox,
	listCashBoxes,
	getCashBoxWithTransactions,
	getCashBoxSummary,
	createCashBox,
	closeCashBox,
	createTransaction,
	deleteTransaction,
	listActiveBankAccounts,
	translateCategory,
} from '@/lib/cash-flow/cash-flow';
import { CashBoxSummaryCard } from '@/components/business/cash-flow/cash-box-summary-card';
import { TransactionDialog } from '@/components/business/cash-flow/transaction-dialog';
import { CashBoxHistory } from '@/components/business/cash-flow/cash-box-history';
import { BankAccountsDialog } from '@/components/business/cash-flow/bank-accounts-dialog';
import { CloseCashBoxDialog } from '@/components/business/cash-flow/close-cash-box-dialog';
import { formatCurrency } from '@/lib/utils';

export function CashFlowManagement() {
	const { toast } = useToast();
	const [activeTab, setActiveTab] = useState('current');

	const [openCashBox, setOpenCashBox] = useState<CashBox | null>(null);
	const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [loadingOpenBox, setLoadingOpenBox] = useState(false);
	const [loadingCashBoxes, setLoadingCashBoxes] = useState(false);
	const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);

	const [cashBoxSummary, setCashBoxSummary] = useState<any>(null);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
	const [isBankAccountsDialogOpen, setIsBankAccountsDialogOpen] = useState(false);
	const [isCloseCashBoxDialogOpen, setIsCloseCashBoxDialogOpen] = useState(false);
	const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');

	useEffect(() => {
		loadOpenCashBox();
		loadCashBoxes();
		loadBankAccounts();
	}, []);

	useEffect(() => {
		if (openCashBox?.id) {
			loadCashBoxData(openCashBox.id);
		} else {
			setCashBoxSummary(null);
			setTransactions([]);
		}
	}, [openCashBox]);

	const loadOpenCashBox = async () => {
		setLoadingOpenBox(true);
		try {
			const { data } = await getOpenCashBox();
			setOpenCashBox(data);
		} catch (error) {
			console.error('Error loading open cash box:', error);
		} finally {
			setLoadingOpenBox(false);
		}
	};

	const loadCashBoxes = async () => {
		setLoadingCashBoxes(true);
		try {
			const { data } = await listCashBoxes();
			setCashBoxes(data || []);
		} catch (error) {
			console.error('Error loading cash boxes:', error);
		} finally {
			setLoadingCashBoxes(false);
		}
	};

	const loadBankAccounts = async () => {
		setLoadingBankAccounts(true);
		try {
			const { data } = await listActiveBankAccounts();
			setBankAccounts(data || []);
		} catch (error) {
			console.error('Error loading bank accounts:', error);
		} finally {
			setLoadingBankAccounts(false);
		}
	};

	const loadCashBoxData = async (cashBoxId: number) => {
		const { data: summary } = await getCashBoxSummary(cashBoxId);
		const { data: boxWithTransactions } = await getCashBoxWithTransactions(cashBoxId);
		setCashBoxSummary(summary);
		setTransactions(boxWithTransactions?.transactions || []);
	};

	const handleCreateCashBox = async () => {
		try {
			const today = new Date().toISOString().split('T')[0];
			const { data, error } = await createCashBox({
				date: today,
				opening_balance: 0,
				closing_balance: null,
				is_closed: false,
				closed_at: null,
				notes: null,
			});
			if (error) throw error;
			toast({
				title: 'Caja creada',
				description: 'Se ha creado una nueva caja para hoy.',
			});
			await loadOpenCashBox();
			await loadCashBoxes();
		} catch (error) {
			toast({
				title: 'Error',
				description: 'No se pudo crear la caja.',
				variant: 'destructive',
			});
		}
	};

	const handleAddTransaction = (type: 'income' | 'expense') => {
		setTransactionType(type);
		setIsTransactionDialogOpen(true);
	};

	const handleTransactionCreated = async () => {
		setIsTransactionDialogOpen(false);
		if (openCashBox?.id) {
			await loadCashBoxData(openCashBox.id);
		}
	};

	const handleDeleteTransaction = async (id: number) => {
		try {
			const { error } = await deleteTransaction(id);
			if (error) throw error;
			toast({
				title: 'Transacción eliminada',
				description: 'La transacción ha sido eliminada correctamente.',
			});
			if (openCashBox?.id) {
				await loadCashBoxData(openCashBox.id);
			}
		} catch (error) {
			toast({
				title: 'Error',
				description: 'No se pudo eliminar la transacción.',
				variant: 'destructive',
			});
		}
	};

	const handleCloseCashBox = async (closingBalance: number, notes?: string) => {
		if (!openCashBox?.id) return;
		try {
			const { error } = await closeCashBox(openCashBox.id, closingBalance, notes);
			if (error) throw error;
			toast({
				title: 'Caja cerrada',
				description: 'La caja ha sido cerrada correctamente.',
			});
			setIsCloseCashBoxDialogOpen(false);
			await loadOpenCashBox();
			await loadCashBoxes();
		} catch (error) {
			toast({
				title: 'Error',
				description: 'No se pudo cerrar la caja.',
				variant: 'destructive',
			});
		}
	};

	const handleBankAccountsUpdated = async () => {
		setIsBankAccountsDialogOpen(false);
		await loadBankAccounts();
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="text-2xl font-bold text-foreground text-balance">Flujo de Fondos</h2>
					<p className="text-muted-foreground mt-1">Gestión de ingresos, egresos y cajas diarias</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => setIsBankAccountsDialogOpen(true)}
						className="gap-2"
					>
						<Building2 className="h-4 w-4" />
						Cuentas Bancarias
					</Button>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList>
					<TabsTrigger value="current">Caja Actual</TabsTrigger>
					<TabsTrigger value="history">Historial</TabsTrigger>
				</TabsList>

				<TabsContent value="current" className="space-y-6">
					{!openCashBox ? (
						<Card className="p-12 bg-card border-border text-center">
							<div className="flex flex-col items-center gap-4">
								<div className="rounded-full bg-secondary p-4">
									<DollarSign className="h-8 w-8 text-muted-foreground" />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-foreground">No hay caja abierta</h3>
									<p className="text-muted-foreground mt-1">
										Crea una nueva caja para comenzar a registrar movimientos
									</p>
								</div>
								<Button onClick={handleCreateCashBox} className="gap-2">
									<Plus className="h-4 w-4" />
									Crear Caja
								</Button>
							</div>
						</Card>
					) : (
						<>
							{/* Summary Card */}
							{cashBoxSummary && <CashBoxSummaryCard summary={cashBoxSummary} />}

							{/* Action Buttons */}
							<div className="grid gap-4 md:grid-cols-2">
								<Button onClick={() => handleAddTransaction('income')} className="gap-2 h-12">
									<ArrowUpCircle className="h-5 w-5" />
									Registrar Ingreso
								</Button>
								<Button
									onClick={() => handleAddTransaction('expense')}
									variant="outline"
									className="gap-2 h-12"
								>
									<ArrowDownCircle className="h-5 w-5" />
									Registrar Egreso
								</Button>
							</div>

							{/* Close Cash Box Button */}
							<div className="flex justify-end">
								<Button
									onClick={() => setIsCloseCashBoxDialogOpen(true)}
									variant="destructive"
									className="gap-2"
								>
									<RefreshCw className="h-4 w-4" />
									Cerrar y Reiniciar Caja
								</Button>
							</div>

							{/* Transactions List */}
							<Card className="bg-card border-border">
								<div className="p-6">
									<h3 className="text-lg font-semibold text-foreground mb-4">
										Movimientos del día
									</h3>
									{transactions.length === 0 ? (
										<p className="text-muted-foreground text-center py-8">
											No hay movimientos registrados hoy
										</p>
									) : (
										<div className="space-y-3">
											{transactions.map((transaction) => (
												<div
													key={transaction.id}
													className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
												>
													<div className="flex items-center gap-4">
														<div
															className={`rounded-full p-2 ${
																transaction.type === 'income'
																	? 'bg-green-500/10 text-green-500'
																	: 'bg-red-500/10 text-red-500'
															}`}
														>
															{transaction.type === 'income' ? (
																<ArrowUpCircle className="h-5 w-5" />
															) : (
																<ArrowDownCircle className="h-5 w-5" />
															)}
														</div>
														<div>
															<p className="font-medium text-foreground">
																{transaction.description || translateCategory(transaction.category)}
															</p>
															<p className="text-sm text-muted-foreground">
																{translateCategory(transaction.category)}
															</p>
															{transaction.bank_account_id && (
																<p className="text-xs text-muted-foreground mt-1">
																	Transferencia a cuenta
																</p>
															)}
														</div>
													</div>
													<div className="flex items-center gap-4">
														<p
															className={`font-semibold ${
																transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
															}`}
														>
															{transaction.type === 'income' ? '+' : '-'}
															{formatCurrency(Number(transaction.amount))}
														</p>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleDeleteTransaction(transaction.id)}
															className="text-destructive hover:text-destructive"
														>
															Eliminar
														</Button>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</Card>
						</>
					)}
				</TabsContent>

				<TabsContent value="history">
					<CashBoxHistory
						cashBoxes={cashBoxes}
						loading={loadingCashBoxes}
						onRefresh={loadCashBoxes}
					/>
				</TabsContent>
			</Tabs>

			{/* Dialogs */}
			<TransactionDialog
				open={isTransactionDialogOpen}
				onOpenChange={setIsTransactionDialogOpen}
				type={transactionType}
				cashBoxId={openCashBox?.id || 0}
				bankAccounts={bankAccounts}
				onTransactionCreated={handleTransactionCreated}
			/>

			<BankAccountsDialog
				open={isBankAccountsDialogOpen}
				onOpenChange={setIsBankAccountsDialogOpen}
				bankAccounts={bankAccounts}
				onBankAccountsUpdated={handleBankAccountsUpdated}
			/>

			<CloseCashBoxDialog
				open={isCloseCashBoxDialogOpen}
				onOpenChange={setIsCloseCashBoxDialogOpen}
				currentBalance={cashBoxSummary?.current_balance || 0}
				onCloseCashBox={handleCloseCashBox}
			/>
		</div>
	);
}
