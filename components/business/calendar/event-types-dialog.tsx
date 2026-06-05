'use client';

import { useEffect, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { EventType } from '@/lib/calendar/event-types';
import { createEventType, updateEventType, deleteEventType } from '@/lib/calendar/event-types';
import { toast } from '@/components/ui/use-toast';
import { translateError } from '@/lib/error-translator';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EventTypesDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	eventTypes: EventType[];
	refresh: () => Promise<void>;
}

export function EventTypesDialog({
	open,
	onOpenChange,
	eventTypes,
	refresh,
}: EventTypesDialogProps) {
	const [name, setName] = useState('');
	const [color, setColor] = useState('#3b82f6');
	const [isSaving, setIsSaving] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);

	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		if (!open) {
			resetForm();
		}
	}, [open]);

	const resetForm = () => {
		setName('');
		setColor('#3b82f6');
		setEditingId(null);
	};

	const handleSave = async () => {
		if (isSaving) return;
		if (!name.trim()) {
			toast({
				title: 'Campo requerido',
				description: 'Debes ingresar un nombre para el tipo de evento.',
				variant: 'destructive',
			});
			return;
		}

		try {
			setIsSaving(true);
			if (editingId) {
				const { error } = await updateEventType(editingId, {
					name,
					color,
				});

				if (error) throw error;

				toast({
					title: 'Tipo actualizado',
					description: 'El tipo de evento fue actualizado correctamente.',
				});
			} else {
				const { error } = await createEventType({
					name,
					color,
				});

				if (error) throw error;

				toast({
					title: 'Tipo creado',
					description: 'El tipo de evento fue creado correctamente.',
				});
			}

			await refresh();
			resetForm();
		} catch (error) {
			console.error(error);

			toast({
				title: 'Error',
				description: translateError(error) || 'No se pudo guardar el tipo de evento.',
				variant: 'destructive',
			});
		} finally {
			setIsSaving(false);
		}
	};
	const handleEdit = (eventType: EventType) => {
		setEditingId(eventType.id);
		setName(eventType.name || '');
		setColor(eventType.color || '#767d89');
	};

	const handleDelete = async () => {
		if (!deleteId) return;

		try {
			setIsDeleting(true);

			const { error } = await deleteEventType(deleteId);

			if (error) throw error;

			await refresh();

			if (editingId === deleteId) {
				resetForm();
			}

			toast({
				title: 'Tipo eliminado',
				description: 'El tipo de evento fue eliminado correctamente.',
			});

			setDeleteId(null);
		} catch (error) {
			console.error(error);

			toast({
				title: 'Error',
				description: translateError(error) || 'No se pudo eliminar el tipo de evento.',
				variant: 'destructive',
			});
		} finally {
			setIsDeleting(false);
		}
	};
	const selectedType = eventTypes.find((type) => type.id === deleteId);
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
				{' '}
				<DialogHeader>
					<DialogTitle className="mt-5">Ajustes de eventos</DialogTitle>

					<DialogDescription>
						Gestiona los tipos de evento utilizados en el calendario.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-6 md:grid-cols-2">
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Nombre</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Ej: Reunión, Llamada, etc."
							/>
						</div>

						<div className="space-y-2">
							<Label>Color</Label>

							<div className="flex items-center gap-3">
								<input
									type="color"
									value={color}
									onChange={(e) => setColor(e.target.value)}
									className="h-10 w-16 cursor-pointer rounded border"
								/>

								<Input value={color} onChange={(e) => setColor(e.target.value)} />
							</div>
						</div>

						<div className="flex gap-2">
							<Button onClick={handleSave} className="flex-1" disabled={isSaving}>
								<Plus className="h-4 w-4 mr-2" />

								{editingId ? 'Actualizar tipo de evento' : 'Agregar tipo de evento'}
							</Button>

							{editingId && (
								<Button variant="outline" onClick={resetForm}>
									Cancelar
								</Button>
							)}
						</div>
					</div>

					<div className="space-y-3 max-h-[450px] overflow-y-auto">
						{eventTypes.length === 0 ? (
							<p className="text-sm text-center text-muted-foreground">
								No hay tipos de eventos creados.
							</p>
						) : (
							eventTypes.map((type) => (
								<div
									key={type.id}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div className="flex items-center gap-3">
										<div
											className="h-4 w-4 rounded-full"
											style={{
												backgroundColor: type.color || '#80848a',
											}}
										/>

										<span className="font-medium">{type.name}</span>
									</div>

									<div className="flex gap-1">
										<Button size="icon" variant="ghost" onClick={() => handleEdit(type)}>
											<Pencil className="h-4 w-4" />
										</Button>

										<Button size="icon" variant="ghost" onClick={() => setDeleteId(type.id)}>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</DialogContent>
			<AlertDialog
				open={deleteId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteId(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Eliminar tipo de evento</AlertDialogTitle>

						<AlertDialogDescription>
							¿Estás seguro de que deseas eliminar el tipo de evento{' '}
							<strong>{selectedType?.name}</strong>? Esta acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>

						<AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Dialog>
	);
}
