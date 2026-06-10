import { useState } from 'react';
import { Package, Edit, Trash2, Plus, Minus } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/provider/auth-provider';
import { toast } from '@/components/ui/use-toast';
import type { SupplyItemStock } from '@/lib/stock/supplies-stock';
import ImageViewer from '@/components/ui/image-viewer';
import { formatCurrency } from '@/utils/formats-money';

interface SuppliesTableProps {
	filteredStock: SupplyItemStock[];
	onEdit: (id: number) => void;
	onDelete: (id: number) => void;
	onUpdateQuantity: (id: number, newQuantity: number) => Promise<void>;
}

export function SuppliesTable({
	filteredStock,
	onEdit,
	onDelete,
	onUpdateQuantity,
}: SuppliesTableProps) {
	const { user } = useAuth();
	const isAuthorized = user?.role === 'Admin';
	const [showQuantityDialog, setShowQuantityDialog] = useState(false);
	const [quantityDialogType, setQuantityDialogType] = useState<'increase' | 'decrease' | null>(
		null
	);
	const [quantityChange, setQuantityChange] = useState<number | ''>('');
	const [currentItemId, setCurrentItemId] = useState<number | null>(null);
	const [currentItemTotal, setCurrentItemTotal] = useState<number>(0);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [imageViewerOpen, setImageViewerOpen] = useState(false);
	const [imageLoading, setImageLoading] = useState(false);

	const openQuantityDialog = (id: number, type: 'increase' | 'decrease', currentQty: number) => {
		setCurrentItemId(id);
		setCurrentItemTotal(currentQty);
		setQuantityDialogType(type);
		setQuantityChange('');
		setShowQuantityDialog(true);
	};

	const confirmQuantityUpdate = async () => {
		if (!currentItemId || quantityChange === '' || !quantityDialogType) {
			toast({ title: 'Error', description: 'Ingrese una cantidad válida', variant: 'destructive' });
			return;
		}

		const adjustment = Number(quantityChange);
		if (adjustment < 0) {
			toast({
				title: 'Error',
				description: 'La cantidad debe ser positiva',
				variant: 'destructive',
			});
			return;
		}

		const nextQuantity =
			quantityDialogType === 'increase'
				? currentItemTotal + adjustment
				: currentItemTotal - adjustment;
		if (nextQuantity < 0) {
			toast({
				title: 'Error',
				description: `No puede disminuir ${adjustment} unidades. Solo tiene ${currentItemTotal} disponibles`,
				variant: 'destructive',
			});
			return;
		}

		await onUpdateQuantity(currentItemId, nextQuantity);
		toast({
			title: 'Éxito',
			description: `Cantidad ${quantityDialogType === 'increase' ? 'aumentada' : 'disminuida'} correctamente`,
		});
		setShowQuantityDialog(false);
		setCurrentItemId(null);
		setCurrentItemTotal(0);
		setQuantityChange('');
		setQuantityDialogType(null);
	};

	const openImageViewer = async (item: SupplyItemStock) => {
		try {
			setSelectedImage(null);
			setImageViewerOpen(true);
			setImageLoading(true);
			const params = new URLSearchParams({ name_code: item.supply_code });
			const res = await fetch(`/api/gallery/list?${params.toString()}`);
			const data = await res.json();

			if (!data.success) {
				setImageViewerOpen(false);
				toast({
					title: 'Error',
					description: data.error || 'No se pudo cargar la imagen',
					variant: 'destructive',
				});
				return;
			}

			const imageUrl = data.images?.[0]?.image_url;
			if (!imageUrl) {
				setImageViewerOpen(false);
				toast({
					title: 'Sin imagen',
					description: 'No se encontró una imagen para este insumo',
					variant: 'destructive',
				});
				return;
			}

			setSelectedImage(imageUrl);
			setImageViewerOpen(true);
		} catch {
			setImageViewerOpen(false);
			toast({
				title: 'Error',
				description: 'No se pudo cargar la imagen',
				variant: 'destructive',
			});
		} finally {
			setImageLoading(false);
		}
	};

	return (
		<Card className="overflow-hidden border-border bg-card">
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="border-b border-border bg-secondary">
						<tr>
							<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Categoría
							</th>
							<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Línea
							</th>
							<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Marca
							</th>
							<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Código
							</th>
							<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Descripción
							</th>
							<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Color
							</th>
							<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Cant x bulto
							</th>
							<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Bultos
							</th>
							<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Total
							</th>
							<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Ubicación
							</th>
							{isAuthorized && (
								<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Precio
								</th>
							)}
							<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Fecha de creación
							</th>
							<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Acciones
							</th>
							<th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Imagen
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{filteredStock.length === 0 ? (
							<tr>
								<td colSpan={isAuthorized ? 14 : 13} className="px-6 py-12 text-center">
									<div className="flex flex-col items-center gap-2 text-muted-foreground">
										<Package className="h-12 w-12 opacity-50" />
										<p className="text-lg font-medium">No hay insumos</p>
									</div>
								</td>
							</tr>
						) : (
							filteredStock.map((item) => {
								return (
									<tr
										key={item.id}
										className={
											item.supply_quantity === 0
												? 'bg-red-300'
												: 'transition-colors hover:bg-secondary/50'
										}
									>
										<td className="px-2 py-2 text-center text-sm text-foreground">
											{item.supply_category || '—'}
										</td>
										<td className="px-2 py-2 text-center text-sm text-foreground">
											{item.supply_line || '-'}
										</td>
										<td className="px-2 py-2 text-center text-sm text-foreground">
											{item.supply_brand || '-'}
										</td>
										<td className="px-2 py-2 text-center text-sm text-foreground">
											{item.supply_code || '-'}
										</td>
										<td className="max-w-[380px] px-2 py-2 text-sm text-foreground">
											<p className="break-words whitespace-pre-line text-justify">
												{item.supply_description || '-'}
											</p>
										</td>
										<td className="px-2 py-2 text-center text-sm text-foreground">
											{item.supply_color || ''}
										</td>
										<td className="px-2 py-2 text-center text-sm text-foreground">
											{item.supply_quantity_for_lump ?? 0}
										</td>
										<td className="px-2 py-2 text-center text-sm text-foreground">
											{item.supply_quantity_lump ?? 0}
										</td>
										<td className="px-2 py-2 text-center">
											<div className="flex items-center justify-center gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														openQuantityDialog(item.id, 'decrease', item.supply_quantity || 0)
													}
												>
													<Minus className="h-4 w-4" />
												</Button>
												<span className="text-sm text-foreground">{item.supply_quantity ?? 0}</span>
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														openQuantityDialog(item.id, 'increase', item.supply_quantity || 0)
													}
												>
													<Plus className="h-4 w-4" />
												</Button>
											</div>
										</td>
										<td className="px-2 py-2 text-center text-sm text-foreground">
											{item.supply_site || '-'}
										</td>
										{isAuthorized && (
											<td className="px-2 py-2 text-center text-sm text-foreground">
												{formatCurrency(item.supply_price) || '-'}
											</td>
										)}
										<td className="px-2 py-2 text-center text-sm text-foreground">
											{item.created_at?.split('T')[0] || '-'}
										</td>
										<td className="px-2 py-2 text-center">
											<div className="flex items-center justify-center gap-2">
												<Button variant="ghost" size="icon" onClick={() => onEdit(item.id)}>
													<Edit className="h-4 w-4" />
												</Button>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button variant="ghost" size="icon">
															<Trash2 className="h-4 w-4" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>Eliminar insumo</AlertDialogTitle>
															<AlertDialogDescription>
																Esta acción no se puede deshacer.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Cancelar</AlertDialogCancel>
															<AlertDialogAction onClick={() => onDelete(item.id)}>
																Eliminar
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</div>
										</td>
										<td className="px-2 py-2 text-center">
											{item.image_id ? (
												<button
													type="button"
													onClick={() => openImageViewer(item)}
													disabled={imageLoading}
													className="mx-auto block"
												>
													<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-muted">
														<span className="text-xs text-foreground">Ver</span>
													</div>
												</button>
											) : (
												<div className="text-center text-sm text-foreground">-</div>
											)}
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			<Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{quantityDialogType === 'increase' ? 'Aumentar cantidad' : 'Disminuir cantidad'}
						</DialogTitle>
						<DialogDescription>
							{quantityDialogType === 'increase'
								? '¿Cuántas unidades desea aumentar?'
								: '¿Cuántas unidades desea disminuir?'}
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Input
							type="number"
							value={quantityChange}
							onChange={(e) => setQuantityChange(e.target.value ? Number(e.target.value) : '')}
							placeholder="Ingrese la cantidad"
							min="0"
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowQuantityDialog(false)}>
							Cancelar
						</Button>
						<Button onClick={confirmQuantityUpdate}>
							{quantityDialogType === 'increase' ? 'Aumentar' : 'Disminuir'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ImageViewer
				open={imageViewerOpen}
				onOpenChange={setImageViewerOpen}
				src={selectedImage}
				loading={imageLoading}
				alt="Imagen del insumo"
			/>
		</Card>
	);
}
