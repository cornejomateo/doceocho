import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StockManagement } from '@/components/business/stock/stock-management';

export default function SuppliesPage() {
	return (
		<DashboardLayout>
			<StockManagement />
		</DashboardLayout>
	);
}
