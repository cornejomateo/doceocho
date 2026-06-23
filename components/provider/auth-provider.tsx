'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { UserRole } from '@/constants/users/user-role';
import { getSupabaseClient } from '@/lib/supabase-client';

type SessionUser = {
	username: string;
	role: UserRole;
};

type AuthContextType = {
	user: SessionUser | null;
	loading: boolean;
	signIn: (username: string, password: string) => Promise<SessionUser>;
	signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(): Promise<SessionUser | null> {
	const supabase = getSupabaseClient();
	const { data } = await supabase.auth.getSession();
	const token = data.session?.access_token;
	if (!token) return null;

	const res = await fetch('/api/me', {
		headers: { Authorization: `Bearer ${token}` },
	});

	if (!res.ok) return null;

	const json = await res.json();
	if (!json.data) return null;

	return {
		username: json.data.username,
		role: json.data.role as UserRole,
	};
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<SessionUser | null>(null);
	const [loading, setLoading] = useState(true);
	const supabase = getSupabaseClient();

	const router = useRouter();

	useEffect(() => {
		const init = async () => {
			const profile = await fetchProfile();
			if (profile) setUser(profile);
			setLoading(false);
		};

		init();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			if (!session) {
				setUser(null);
				return;
			}

			const profile = await fetchProfile();
			if (profile) setUser(profile);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	async function signIn(username: string, password: string): Promise<SessionUser> {
		setLoading(true);

		try {
			const response = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username }),
			});

			const res = await response.json();

			if (!response.ok || !res.data) {
				throw new Error(res.error || 'Usuario o contraseña incorrectos');
			}

			const { error } = await supabase.auth.signInWithPassword({
				email: res.data.mail,
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

			return sessionUser;
		} catch (err: any) {
			throw err;
		} finally {
			setLoading(false);
		}
	}

	async function signOutUser() {
		setLoading(true);

		try {
			await supabase.auth.signOut();

			setUser(null);

			router.push('/login');
			router.refresh();
		} finally {
			setLoading(false);
		}
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
