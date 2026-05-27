import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CashFlowManagement } from '@/components/business/cash-flow/cash-flow-management';

export default function FlujoFondosPage() {
	return (
		<DashboardLayout>
			<CashFlowManagement />
		</DashboardLayout>
	);
}
