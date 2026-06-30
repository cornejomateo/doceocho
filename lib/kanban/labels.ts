import { getSupabaseClient } from '../supabase-client';
import type { Label, LabelFormData, CardLabel } from '@/components/business/kanban/types';

const TABLE = 'kanban_labels';
const CARD_LABELS_TABLE = 'kanban_card_labels';

export async function getLabelsByBoardId(
	boardId: number
): Promise<{ data: Label[] | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select('*')
		.eq('board_id', boardId)
		.order('created_at', { ascending: true });
	return { data, error };
}

export async function getLabelById(id: number): Promise<{ data: Label | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
	return { data, error };
}

export async function createLabel(
	label: LabelFormData,
	boardId: number
): Promise<{ data: Label | null; error: any }> {
	const supabase = getSupabaseClient();
	const payload = {
		...label,
		board_id: boardId,
	};
	const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
	return { data, error };
}

export async function updateLabel(
	id: number,
	changes: Partial<Omit<Label, 'id' | 'created_at' | 'board_id'>>
): Promise<{ data: Label | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(TABLE).update(changes).eq('id', id).select().single();
	return { data, error };
}

export async function deleteLabel(id: number): Promise<{ data: null; error: any }> {
	const supabase = getSupabaseClient();
	const { error } = await supabase.from(TABLE).delete().eq('id', id);
	return { data: null, error };
}

export async function getCardLabels(
	cardId: number
): Promise<{ data: CardLabel[] | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(CARD_LABELS_TABLE)
		.select(
			`
			*,
			label:kanban_labels(*)
		`
		)
		.eq('card_id', cardId);
	return { data, error };
}

export async function addLabelToCard(
	cardId: number,
	labelId: number
): Promise<{ data: CardLabel | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(CARD_LABELS_TABLE)
		.insert({ card_id: cardId, label_id: labelId })
		.select()
		.single();
	return { data, error };
}

export async function removeLabelFromCard(
	cardId: number,
	labelId: number
): Promise<{ data: null; error: any }> {
	const supabase = getSupabaseClient();
	const { error } = await supabase
		.from(CARD_LABELS_TABLE)
		.delete()
		.eq('card_id', cardId)
		.eq('label_id', labelId);
	return { data: null, error };
}
