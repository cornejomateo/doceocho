import { getSupabaseClient } from '../supabase-client';
import type { Card, CardWithRelations, CardFormData } from '@/components/business/kanban/types';

const TABLE = 'kanban_cards';

export async function getCardsByListId(
	listId: number
): Promise<{ data: Card[] | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select('*')
		.eq('list_id', listId)
		.eq('is_archived', false)
		.order('position', { ascending: true });
	return { data, error };
}

export async function getCardById(id: number): Promise<{ data: Card | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
	return { data, error };
}

export async function getCardWithRelations(
	id: number
): Promise<{ data: CardWithRelations | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select(
			`
			*,
			list:kanban_lists(*),
			labels:kanban_card_labels(
				*,
				label:kanban_labels(*)
			),
			members:kanban_card_members(*),
			attachments:kanban_attachments(*),
			crm_links:kanban_card_crm_links(*),
			custom_field_values:kanban_custom_field_values(
				*,
				field:kanban_custom_fields(*)
			)
		`
		)
		.eq('id', id)
		.single();

	if (error) return { data: null, error };

	const card = data as any;
	const transformedCard: CardWithRelations = {
		...card,
		labels: card.labels?.map((cl: any) => cl.label) || [],
		members: card.members || [],
		attachments: card.attachments || [],
		crm_links: card.crm_links || [],
		custom_field_values: card.custom_field_values || [],
	};

	return { data: transformedCard, error: null };
}

export async function createCard(
	card: CardFormData,
	listId: number
): Promise<{ data: Card | null; error: any }> {
	const supabase = getSupabaseClient();

	// Get the highest position
	const { data: maxPos } = await supabase
		.from(TABLE)
		.select('position')
		.eq('list_id', listId)
		.order('position', { ascending: false })
		.limit(1)
		.single();

	const nextPosition = maxPos ? maxPos.position + 1 : 0;

	const payload = {
		...card,
		list_id: listId,
		position: nextPosition,
	};

	const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
	return { data, error };
}

export async function updateCard(
	id: number,
	changes: Partial<Omit<Card, 'id' | 'created_at' | 'list_id'>>
): Promise<{ data: Card | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(TABLE).update(changes).eq('id', id).select().single();
	return { data, error };
}

export async function moveCard(
	id: number,
	newListId: number,
	newPosition: number
): Promise<{ data: Card | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.update({ list_id: newListId, position: newPosition })
		.eq('id', id)
		.select()
		.single();
	return { data, error };
}

export async function updateCardPosition(
	id: number,
	newPosition: number
): Promise<{ data: Card | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.update({ position: newPosition })
		.eq('id', id)
		.select()
		.single();
	return { data, error };
}

export async function deleteCard(id: number): Promise<{ data: null; error: any }> {
	const supabase = getSupabaseClient();

	// First, delete all references to this card
	await supabase.from('kanban_card_labels').delete().eq('card_id', id);
	await supabase.from('kanban_card_members').delete().eq('card_id', id);
	await supabase.from('kanban_attachments').delete().eq('card_id', id);
	await supabase.from('kanban_card_crm_links').delete().eq('card_id', id);
	await supabase.from('kanban_custom_field_values').delete().eq('card_id', id);

	// Then delete the card itself
	const { error } = await supabase.from(TABLE).delete().eq('id', id);
	return { data: null, error };
}

export async function archiveCard(
	id: number,
	isArchived: boolean
): Promise<{ data: Card | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.update({ is_archived: isArchived })
		.eq('id', id)
		.select()
		.single();
	return { data, error };
}

export async function completeCard(id: number): Promise<{ data: Card | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.update({ completed_at: new Date().toISOString() })
		.eq('id', id)
		.select()
		.single();
	return { data, error };
}

export async function uncompleteCard(id: number): Promise<{ data: Card | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.update({ completed_at: null })
		.eq('id', id)
		.select()
		.single();
	return { data, error };
}
