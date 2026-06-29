import { getSupabaseClient } from '../supabase-client';
import type { List, ListWithCards, ListFormData } from '@/components/business/kanban/types';

const TABLE = 'kanban_lists';

export async function getListsByBoardId(
	boardId: number
): Promise<{ data: List[] | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select('*')
		.eq('board_id', boardId)
		.eq('is_archived', false)
		.order('position', { ascending: true });
	return { data, error };
}

export async function getListById(id: number): Promise<{ data: List | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
	return { data, error };
}

export async function getListWithCards(
	id: number
): Promise<{ data: ListWithCards | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select(
			`
			*,
			cards:kanban_cards(*)
		`
		)
		.eq('id', id)
		.single();

	if (error) return { data: null, error };

	const list = data as any;
	const transformedList: ListWithCards = {
		...list,
		cards: list.cards || [],
	};

	return { data: transformedList, error: null };
}

export async function createList(
	list: ListFormData,
	boardId: number
): Promise<{ data: List | null; error: any }> {
	const supabase = getSupabaseClient();

	// Get the highest position
	const { data: maxPos } = await supabase
		.from(TABLE)
		.select('position')
		.eq('board_id', boardId)
		.order('position', { ascending: false })
		.limit(1)
		.single();

	const nextPosition = maxPos ? maxPos.position + 1 : 0;

	const payload = {
		...list,
		board_id: boardId,
		position: nextPosition,
	};

	const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
	return { data, error };
}

export async function updateList(
	id: number,
	changes: Partial<Omit<List, 'id' | 'created_at' | 'board_id'>>
): Promise<{ data: List | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(TABLE).update(changes).eq('id', id).select().single();
	return { data, error };
}

export async function deleteList(id: number): Promise<{ data: null; error: any }> {
	const supabase = getSupabaseClient();
	const { error } = await supabase.from(TABLE).delete().eq('id', id);
	return { data: null, error };
}

export async function archiveList(
	id: number,
	isArchived: boolean
): Promise<{ data: List | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.update({ is_archived: isArchived })
		.eq('id', id)
		.select()
		.single();
	return { data, error };
}

export async function updateListPosition(
	id: number,
	newPosition: number
): Promise<{ data: List | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.update({ position: newPosition })
		.eq('id', id)
		.select()
		.single();
	return { data, error };
}
