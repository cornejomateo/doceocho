import { BUDGET_STATUS } from '@/constants/budgets/budgets-report';

export function formatBudgetStatus(
	accepted: boolean | null | undefined,
	sold: boolean | null | undefined
) {
	if (sold) return BUDGET_STATUS.SOLD;
	if (accepted) return BUDGET_STATUS.ACCEPTED;
	return BUDGET_STATUS.PENDING;
}
