import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Plus } from 'lucide-react';
import { KanbanCard } from './kanban-card';
import { useCards } from './hooks/use-cards';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { List, CardFormData } from './types';

interface KanbanListProps {
	list: List;
	onEditList: (name: string) => void;
	onDeleteList: () => void;
	onCreateCard: (card: CardFormData) => void;
	onCardClick: (cardId: number) => void;
	onCardMove: (cardId: number, newListId: number, newPosition: number) => void;
}

export function KanbanList({
	list,
	onEditList,
	onDeleteList,
	onCreateCard,
	onCardClick,
	onCardMove,
}: KanbanListProps) {
	const { cards, loading, addCard } = useCards(list.id);

	const handleCreateCard = async () => {
		const title = prompt('Título de la tarjeta:');
		if (title) {
			const newCard = await addCard({ title });
			if (newCard) {
				onCreateCard({ title });
			}
		}
	};

	const handleDragEnd = (result: any) => {
		if (!result.destination) return;

		const cardId = Number(result.draggableId);
		const newListId = list.id;
		const newPosition = result.destination.index;

		onCardMove(cardId, newListId, newPosition);
	};

	return (
		<div className="w-72 flex-shrink-0 flex flex-col bg-background rounded-lg shadow-sm border">
			{/* List Header */}
			<div className="p-3 border-b flex items-center justify-between">
				<h3 className="font-semibold">{list.name}</h3>
				<div className="flex items-center gap-1">
					<span className="text-xs text-muted-foreground">{cards.length}</span>
					<Button variant="ghost" size="icon" className="h-6 w-6">
						<MoreVertical className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Cards Container */}
			<Droppable droppableId={`list-${list.id}`} type="card">
				{(provided, snapshot) => (
					<div
						ref={provided.innerRef}
						{...provided.droppableProps}
						className={`flex-1 p-3 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-300px)] ${
							snapshot.isDraggingOver ? 'bg-muted/50' : ''
						}`}
					>
						{loading ? (
							<div className="text-center py-4">
								<p className="text-xs text-muted-foreground">Cargando...</p>
							</div>
						) : cards.length === 0 ? (
							<div className="text-center py-4">
								<p className="text-xs text-muted-foreground">No hay tarjetas</p>
							</div>
						) : (
							cards.map((card, index) => (
								<Draggable key={card.id} draggableId={`card-${card.id}`} index={index}>
									{(provided, snapshot) => (
										<div
											ref={provided.innerRef}
											{...provided.draggableProps}
											{...provided.dragHandleProps}
											className={`${snapshot.isDragging ? 'rotate-3 shadow-lg' : ''}`}
										>
											<KanbanCard card={card} onClick={() => onCardClick(card.id)} />
										</div>
									)}
								</Draggable>
							))
						)}
						{provided.placeholder}
					</div>
				)}
			</Droppable>

			{/* Add Card Button */}
			<div className="p-3 border-t">
				<Button variant="ghost" className="w-full justify-start" onClick={handleCreateCard}>
					<Plus className="h-4 w-4 mr-2" />
					Agregar tarjeta
				</Button>
			</div>
		</div>
	);
}
