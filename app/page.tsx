'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DashboardHome } from '@/components/layout/dashboard-home';
import { useAuth } from '@/components/provider/auth-provider';

export default function HomePage() {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading && !user) {
			router.push('/login');
		}
	}, [user, loading, router]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-900">
				<div className="text-white text-lg">Cargando...</div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	switch (user.role) {
		case 'Admin':
			return (
				<DashboardLayout>
					<DashboardHome />
				</DashboardLayout>
			);
	}
}
