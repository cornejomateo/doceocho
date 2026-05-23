import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { BudgetManagement } from '@/components/business/reports/budgets/budget-management';

export default function BudgetsPage() {
	return (
		<DashboardLayout>
			<BudgetManagement />
		</DashboardLayout>
	);
}
