import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
	X,
	Clock,
	AlertTriangle,
	CheckCircle,
	MoreVertical,
	Paperclip,
	MessageSquare,
	Users,
} from 'lucide-react';
import { useCard } from './hooks/use-card';
import type { CardWithRelations } from './types';

interface CardDetailModalProps {
	cardId: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: string; // UUID
	onCardDeleted?: () => void;
}

export function CardDetailModal({
	cardId,
	open,
	onOpenChange,
	userId,
	onCardDeleted,
}: CardDetailModalProps) {
	const { card, loading, error, updateCard, addLabel, removeLabel, uploadFile, removeCard } =
		useCard(cardId);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [dueDate, setDueDate] = useState('');
	const [priority, setPriority] = useState('none');
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	useEffect(() => {
		if (card) {
			setTitle(card.title);
			setDescription(card.description || '');
			setDueDate(card.due_date?.split('T')[0] || '');
			setPriority(card.priority || 'none');
			setHasUnsavedChanges(false);
		}
	}, [card]);

	const handleTitleChange = (value: string) => {
		setTitle(value);
		setHasUnsavedChanges(true);
	};

	const handleDescriptionChange = (value: string) => {
		setDescription(value);
		setHasUnsavedChanges(true);
	};

	const handleDueDateChange = (value: string) => {
		setDueDate(value);
		setHasUnsavedChanges(true);
	};

	const handlePriorityChange = (value: string) => {
		setPriority(value);
		setHasUnsavedChanges(true);
	};

	const handleSave = async () => {
		await updateCard({
			title,
			description,
			due_date: dueDate || null,
			priority: priority as any,
		});
		setHasUnsavedChanges(false);
	};

	const handleClose = () => {
		if (hasUnsavedChanges) {
			if (confirm('Tienes cambios sin guardar. ¿Deseas cerrar sin guardar?')) {
				onOpenChange(false);
			}
		} else {
			onOpenChange(false);
		}
	};

	const handleDeleteCard = async () => {
		console.log('Intentando eliminar tarjeta con ID:', cardId);
		await removeCard();
		console.log('Eliminación completada, cerrando modal');
		onOpenChange(false);
		if (onCardDeleted) {
			onCardDeleted();
		}
	};

	if (!cardId) return null;

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<VisuallyHidden>
						<DialogTitle>Detalles de tarjeta</DialogTitle>
					</VisuallyHidden>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<Input
								value={title}
								onChange={(e) => handleTitleChange(e.target.value)}
								className="text-2xl font-bold border-none p-0 focus-visible:ring-0 bg-transparent"
							/>
							<div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
								<span>En lista: {card?.list?.name || 'Sin asignar'}</span>
								<span>•</span>
								<span>
									Creado el {card ? new Date(card.created_at).toLocaleDateString('es-AR') : ''}
								</span>
							</div>
						</div>
						{hasUnsavedChanges && (
							<Button onClick={handleSave} size="sm">
								Guardar
							</Button>
						)}
					</div>
				</DialogHeader>

				{loading ? (
					<div className="text-center py-8">
						<p className="text-muted-foreground">Cargando tarjeta...</p>
					</div>
				) : error ? (
					<div className="text-center py-8">
						<p className="text-destructive">Error: {error}</p>
					</div>
				) : !card ? (
					<div className="text-center py-8">
						<p className="text-muted-foreground">Tarjeta no encontrada</p>
					</div>
				) : (
					<div className="grid grid-cols-3 gap-6">
						{/* Left Column - Main Content */}
						<div className="col-span-2 space-y-6">
							{/* Labels */}
							{card.labels && card.labels.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{card.labels.map((label) => (
										<Badge
											key={label.id}
											variant="secondary"
											className="cursor-pointer"
											style={{ backgroundColor: label.color, color: 'white' }}
										>
											{label.name}
										</Badge>
									))}
								</div>
							)}

							{/* Description */}
							<div>
								<h3 className="font-semibold mb-2">Descripción</h3>
								<Textarea
									value={description}
									onChange={(e) => handleDescriptionChange(e.target.value)}
									placeholder="Agregar una descripción más detallada..."
									className="min-h-[100px]"
								/>
							</div>

							{/* Due Date */}
							<div>
								<h3 className="font-semibold mb-2 flex items-center gap-2">
									<Clock className="h-4 w-4" />
									Fecha límite
								</h3>
								<Input
									type="date"
									value={dueDate}
									onChange={(e) => handleDueDateChange(e.target.value)}
								/>
							</div>

							{/* Attachments */}
							<div>
								<h3 className="font-semibold mb-2 flex items-center gap-2">
									<Paperclip className="h-4 w-4" />
									Archivos adjuntos ({card.attachments?.length || 0})
								</h3>
								<div className="border-2 border-dashed rounded-lg p-4 text-center">
									<p className="text-sm text-muted-foreground mb-2">
										Arrastra archivos aquí o haz clic para subir
									</p>
									<Button variant="outline" size="sm">
										Subir archivo
									</Button>
								</div>
								{card.attachments && card.attachments.length > 0 && (
									<div className="mt-2 space-y-2">
										{card.attachments.map((attachment) => (
											<div
												key={attachment.id}
												className="flex items-center justify-between p-2 border rounded"
											>
												<span className="text-sm">{attachment.file_name}</span>
												<Button variant="ghost" size="icon" className="h-6 w-6">
													<X className="h-3 w-3" />
												</Button>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Right Column - Sidebar */}
						<div className="space-y-6">
							{/* Add to Card */}
							<div>
								<Button variant="outline" className="w-full justify-start gap-2">
									<Users className="h-4 w-4" />
									Miembros
								</Button>
								<Button variant="outline" className="w-full justify-start gap-2 mt-2">
									<Paperclip className="h-4 w-4" />
									Adjuntos
								</Button>
								<Button variant="outline" className="w-full justify-start gap-2 mt-2">
									<Clock className="h-4 w-4" />
									Fechas
								</Button>
							</div>

							{/* Priority */}
							<div>
								<h3 className="font-semibold mb-2">Prioridad</h3>
								<select
									value={priority}
									onChange={(e) => handlePriorityChange(e.target.value)}
									className="w-full p-2 border rounded"
								>
									<option value="none">Sin prioridad</option>
									<option value="low">Baja</option>
									<option value="medium">Media</option>
									<option value="high">Alta</option>
									<option value="very_high">Muy alta</option>
								</select>
							</div>

							{/* Actions */}
							<div className="border-t pt-4">
								{showDeleteConfirm ? (
									<div className="space-y-2">
										<p className="text-sm text-muted-foreground">
											¿Estás seguro de eliminar esta tarjeta?
										</p>
										<div className="flex gap-2">
											<Button
												variant="destructive"
												className="flex-1"
												size="sm"
												onClick={handleDeleteCard}
											>
												Eliminar
											</Button>
											<Button
												variant="outline"
												className="flex-1"
												size="sm"
												onClick={() => setShowDeleteConfirm(false)}
											>
												Cancelar
											</Button>
										</div>
									</div>
								) : (
									<Button
										variant="destructive"
										className="w-full"
										size="sm"
										onClick={() => setShowDeleteConfirm(true)}
									>
										Eliminar tarjeta
									</Button>
								)}
							</div>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
