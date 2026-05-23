'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { UserRole } from '@/constants/users/user-role';
import { getUser } from '@/lib/users/users';
import { getSupabaseClient } from '@/lib/supabase-client';

type SessionUser = {
	username: string;
	role: UserRole;
};

type AuthContextType = {
	user: SessionUser | null;
	loading: boolean;
	signIn: (username: string, password: string) => Promise<void>;
	signOutUser: () => Promise<void>;
};

const SESSION_STORAGE_KEY = 'sessionUser';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<SessionUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [isMounted, setIsMounted] = useState(false);
	const supabase = getSupabaseClient();

	const router = useRouter();

	useEffect(() => {
		setIsMounted(true);

		const restoreSession = async () => {
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();

				if (!session) {
					localStorage.removeItem(SESSION_STORAGE_KEY);
					setUser(null);
					return;
				}

				const raw = localStorage.getItem(SESSION_STORAGE_KEY);

				if (raw) {
					const parsed: SessionUser = JSON.parse(raw);
					setUser(parsed);
				}
			} catch (error) {
				console.error(error);
				localStorage.removeItem(SESSION_STORAGE_KEY);
				setUser(null);
			} finally {
				setLoading(false);
			}
		};

		restoreSession();
	}, []);

	async function signIn(username: string, password: string) {
		setLoading(true);

		try {
			// Search user in DB to get email for Supabase login
			const res = await getUser(username);

			if (!res.data) {
				throw new Error('Usuario no encontrado');
			}

			// sign in REAL
			const { error } = await supabase.auth.signInWithPassword({
				email: res.data.mail || '',
				password,
			});

			if (error) {
				throw new Error('Usuario o contraseña incorrectos');
			}

			const sessionUser: SessionUser = {
				username: res.data.username,
				role: res.data.role as UserRole,
			};

			setUser(sessionUser);

			localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));

			router.refresh();
		} finally {
			setLoading(false);
		}
	}

	async function signOutUser() {
		setLoading(true);

		try {
			await supabase.auth.signOut();

			setUser(null);

			localStorage.removeItem(SESSION_STORAGE_KEY);

			router.push('/login');
			router.refresh();
		} finally {
			setLoading(false);
		}
	}

	if (!isMounted) {
		return null;
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				signIn,
				signOutUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);

	if (!ctx) {
		throw new Error('useAuth must be used within AuthProvider');
	}

	return ctx;
}
