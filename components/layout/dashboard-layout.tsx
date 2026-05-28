'use client';

import type React from 'react';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
	LayoutDashboard,
	Package,
	Users,
	FileText,
	ClipboardCheck,
	Calendar,
	BarChart3,
	Menu,
	X,
	Lock,
	AlertCircle,
	DollarSign,
} from 'lucide-react';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/provider/auth-provider';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { cn } from '@/lib/utils';

const navigation = [
	{ name: 'Panel', href: '/', icon: LayoutDashboard, disabled: false },
	{ name: 'Insumos', href: '/supplies', icon: Package, disabled: false },
	{ name: 'Clientes', href: '/clients', icon: Users, disabled: false },
	{ name: 'Obras', href: '/works', icon: ClipboardCheck, disabled: false },
	{ name: 'Calendario', href: '/calendar', icon: Calendar, disabled: false },
	{ name: 'Ajustes y Diario', href: '/claims', icon: AlertCircle, disabled: false },
	{ name: 'Reportes de Presupuestos', href: '/budgets', icon: FileText, disabled: false },
	{ name: 'Reportes', href: '/reports', icon: BarChart3, disabled: false },
	{ name: 'Flujo de Fondos', href: '/flujo-fondos', icon: DollarSign, disabled: false },
] as const;

export function DashboardLayout({ children }: { children: React.ReactNode }) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const pathname = usePathname();
	const router = useRouter();
	const { user, loading, signOutUser } = useAuth();

	const allowedByRole = useMemo(() => {
		return {
			Admin: ['Panel', 'Insumos', 'Clientes', 'Calendario', 'Flujo de Fondos'],
			Fabrica: ['Insumos'],
			Ventas: ['Panel', 'Insumos', 'Clientes', 'Calendario', 'Flujo de Fondos'],
			Marketing: ['Panel', 'Calendario', 'Clientes'],
			Colocador: ['Clientes'],
		} as Record<string, string[]>;
	}, []);

	const filteredNavigation = useMemo(() => {
		if (!user?.role) return navigation;
		const allowedNames = allowedByRole[user.role] ?? [];
		return navigation.filter((item) => allowedNames.includes(item.name));
	}, [user?.role, allowedByRole]);

	const isRouteAllowed = (href: string) => {
		if (!user?.role) return false;
		const allowedNames = allowedByRole[user.role] ?? [];
		const mainItem = navigation.find((item) => item.href === href);
		return Boolean(mainItem && allowedNames.includes(mainItem.name));
	};

	useEffect(() => {
		if (!loading && typeof window !== 'undefined') {
			if (!user) {
				router.push('/login');
				return;
			}

			if (pathname === '/' && user.role === 'Fabrica') {
				router.replace('/supplies');
				return;
			}

			if (pathname === '/' && user.role === 'Colocador') {
				router.replace('/works');
			}
		}
	}, [loading, user, pathname, router]);

	useEffect(() => {
		if (loading || !user?.role) return;

		if (!isRouteAllowed(pathname)) {
			const allowedNames = allowedByRole[user.role] ?? [];
			const firstAllowed = navigation.find((item) => allowedNames.includes(item.name));
			if (firstAllowed) {
				router.replace(firstAllowed.href);
			}
		}
	}, [loading, user?.role, pathname, router, allowedByRole]);

	if (loading || !user) {
		return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
	}

	if (!user.role) {
		return null;
	}

	return (
		<div className="min-h-screen bg-background">
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			<aside
				className={cn(
					'fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform duration-200 ease-in-out lg:translate-x-0',
					sidebarOpen ? 'translate-x-0' : '-translate-x-full'
				)}
			>
				<div className="flex h-full flex-col">
					<div className="flex h-16 items-center justify-between border-b border-border px-6">
						<div className="flex items-center gap-2">
							<Image
								src="/logo-doce8.png"
								alt="Logo"
								width={60}
								height={60}
								style={{ height: 'auto' }}
							/>
							<span className="font-semibold text-foreground">Doce ocho</span>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="lg:hidden"
							onClick={() => setSidebarOpen(false)}
						>
							<X className="h-5 w-5" />
						</Button>
					</div>

					<nav className="flex-1 space-y-1 px-3 py-4">
						{filteredNavigation.map((item) => {
							const isActive = pathname === item.href;

							return (
								<div key={item.name}>
									<div
										className={cn(
											'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
											isActive
												? 'bg-primary text-primary-foreground'
												: item.disabled
													? 'cursor-not-allowed text-muted-foreground/40'
													: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
											{ 'opacity-60': item.disabled }
										)}
									>
										{item.disabled ? (
											<>
												<item.icon className="h-5 w-5" />
												<span className="flex items-center gap-1">
													{item.name}
													<Lock className="ml-1 h-3.5 w-3.5" />
												</span>
											</>
										) : (
											<Link
												href={item.href}
												className="flex w-full items-center gap-3"
												onClick={() => setSidebarOpen(false)}
											>
												<item.icon className="h-5 w-5" />
												{item.name}
											</Link>
										)}
									</div>
								</div>
							);
						})}
					</nav>

					<div className="border-t border-border p-4">
						<div className="flex items-center gap-3">
							<div className="min-w-0 flex-1">
								<p className="truncate text-xs text-muted-foreground">{user?.role ?? ''}</p>
							</div>
							<div className="ml-2">
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button variant="ghost" size="sm">
											Cerrar sesión
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>¿Seguro que querés cerrar sesión?</AlertDialogTitle>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancelar</AlertDialogCancel>
											<AlertDialogAction asChild>
												<Button variant="destructive" size="sm" onClick={() => signOutUser()}>
													Sí, cerrar sesión
												</Button>
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</div>
					</div>
				</div>
			</aside>

			<div className="lg:pl-64">
				<header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
					<Button
						variant="ghost"
						size="icon"
						className="lg:hidden"
						onClick={() => setSidebarOpen(true)}
					>
						<Menu className="h-5 w-5" />
					</Button>
					<div className="flex-1">
						<h1 className="text-lg font-semibold text-foreground">Sistema de Gestión</h1>
					</div>
					<div className="flex items-center gap-2">
						<ThemeToggle />
					</div>
				</header>

				<main className="p-4 lg:p-6">{children}</main>
			</div>
		</div>
	);
}
