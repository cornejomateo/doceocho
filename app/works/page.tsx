import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { WorksOpenings } from '@/components/business/works/works-progress';

export default function WorksPage() {
	return (
		<DashboardLayout>
			<WorksOpenings />
		</DashboardLayout>
	);
}
