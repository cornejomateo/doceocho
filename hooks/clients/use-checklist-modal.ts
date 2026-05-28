import { useState } from 'react';
import { Work } from '@/lib/works/works';
import { Checklist } from '@/lib/checklists/checklists';

export function useChecklistModal() {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedWork, setSelectedWork] = useState<Work | null>(null);

	const openChecklist = (work: Work) => {
		setSelectedWork(work);
		setIsOpen(true);
	};

	const closeChecklist = () => {
		setIsOpen(false);
		setSelectedWork(null);
	};

	const [checklist, setChecklist] = useState<{
		name: string | null;
		description: string | null;
		items: { name: string; completed: boolean }[];
	}>({
		name: null,
		description: null,
		items: [],
	});

	const initializeChecklist = (checklistToEdit: Checklist) => {
		setChecklist({
			name: checklistToEdit.name || null,
			description: checklistToEdit.description || null,
			items: (checklistToEdit.items || []).map((item) => ({
				name: item.name,
				completed: item.done || false,
			})),
		});
	};

	const resetForm = () => {
		setChecklist({
			name: null,
			description: null,
			items: [],
		});
	};

	const updateField = (field: string, value: any) => {
		setChecklist((prev) => ({
			...prev,
			[field]: value === '' ? null : value,
		}));
	};

	const addItem = (name: string) => {
		if (!name.trim()) return;

		setChecklist((prev) => ({
			...prev,
			items: [...prev.items, { name: name.trim(), completed: false }],
		}));
	};

	const removeItem = (index: number) => {
		setChecklist((prev) => ({
			...prev,
			items: prev.items.filter((_, i) => i !== index),
		}));
	};

	return {
		isOpen,
		selectedWork,
		openChecklist,
		closeChecklist,
		checklist,
		updateField,
		addItem,
		removeItem,
		resetForm,
		initializeChecklist,
	};
}
