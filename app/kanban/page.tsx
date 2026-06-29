'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Star, Archive, MoreVertical } from 'lucide-react';
import { useBoards } from '@/components/business/kanban/hooks/use-boards';
import type { Board } from '@/components/business/kanban/types';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getSupabaseClient } from '@/lib/supabase-client';

export default function KanbanPage() {
	const router = useRouter();
	const supabase = getSupabaseClient();
	const [userId, setUserId] = useState<string | null>(null);
	const { boards, loading, error, fetchBoards, addBoard, toggleFavorite, archiveBoard } =
		useBoards();

	useEffect(() => {
		// Get current user UUID from Supabase
		async function getUser() {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user?.id) {
				setUserId(user.id);
			}
		}
		getUser();
	}, [supabase]);

	useEffect(() => {
		if (userId) {
			fetchBoards();
		}
	}, [fetchBoards, userId]);

	const handleCreateBoard = async () => {
		if (!userId) {
			alert('No hay usuario autenticado');
			return;
		}
		// TODO: Open modal to create board
		const name = prompt('Nombre del tablero:');
		if (name) {
			const board = await addBoard({ name }, userId);
			if (board) {
				router.push(`/kanban/${board.id}`);
			}
		}
	};

	const handleBoardClick = (boardId: number) => {
		router.push(`/kanban/${boardId}`);
	};

	return (
		<DashboardLayout>
			<div className="container mx-auto p-6">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-3xl font-bold">Tableros Kanban</h1>
						<p className="text-muted-foreground">
							Gestiona tus proyectos con tableros estilo Trello
						</p>
					</div>
					<Button onClick={handleCreateBoard} className="gap-2">
						<Plus className="h-4 w-4" />
						Crear Tablero
					</Button>
				</div>

				<div className="flex items-center gap-4 mb-6">
					<div className="relative flex-1 max-w-md">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input placeholder="Buscar tableros..." className="pl-10" />
					</div>
				</div>

				{loading ? (
					<div className="text-center py-12">
						<p className="text-muted-foreground">Cargando tableros...</p>
					</div>
				) : error ? (
					<div className="text-center py-12">
						<p className="text-destructive">Error: {error}</p>
					</div>
				) : boards.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-muted-foreground mb-4">No tienes tableros aún</p>
						<Button onClick={handleCreateBoard} variant="outline" className="gap-2">
							<Plus className="h-4 w-4" />
							Crear tu primer tablero
						</Button>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{boards.map((board) => (
							<Card
								key={board.id}
								className="p-4 cursor-pointer hover:shadow-md transition-shadow"
								style={{ borderTop: `4px solid ${board.color}` }}
								onClick={() => handleBoardClick(board.id)}
							>
								<div className="flex items-start justify-between mb-2">
									<h3 className="font-semibold text-lg">{board.name}</h3>
									<div className="flex items-center gap-1">
										{board.is_favorite && (
											<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
										)}
										{board.is_archived && <Archive className="h-4 w-4 text-muted-foreground" />}
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={(e) => {
												e.stopPropagation();
												// TODO: Open context menu
											}}
										>
											<MoreVertical className="h-4 w-4" />
										</Button>
									</div>
								</div>
								{board.description && (
									<p className="text-sm text-muted-foreground mb-3 line-clamp-2">
										{board.description}
									</p>
								)}
								<div className="text-xs text-muted-foreground">
									Creado el {new Date(board.created_at).toLocaleDateString('es-AR')}
								</div>
							</Card>
						))}
					</div>
				)}
			</div>
		</DashboardLayout>
	);
}
