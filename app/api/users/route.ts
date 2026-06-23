import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
	try {
		const { username, password, role } = await req.json();

		if (!username || !password || !role) {
			return NextResponse.json(
				{ error: 'Faltan campos requeridos: username, password, role' },
				{ status: 400 }
			);
		}

		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);

		const email = `${username}@gmail.com`;

		const { data: authData, error: authError } = await supabase.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
		});

		if (authError) {
			return NextResponse.json({ error: authError.message }, { status: 400 });
		}

		const { error: dbError } = await supabase.from('users').insert({
			uid_user: authData.user.id,
			username,
			role,
			mail: email,
		});

		if (dbError) {
			await supabase.auth.admin.deleteUser(authData.user.id);
			return NextResponse.json({ error: dbError.message }, { status: 400 });
		}

		return NextResponse.json({ success: true });
	} catch (err: any) {
		console.error('Error creating user:', err);
		return NextResponse.json(
			{ error: err.message || 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}

export async function PUT(req: Request) {
	try {
		const { uid_user, password } = await req.json();

		if (!uid_user) {
			return NextResponse.json({ error: 'Falta uid_user' }, { status: 400 });
		}

		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);

		const updates: Record<string, string> = {};
		if (password) updates.password = password;

		if (Object.keys(updates).length > 0) {
			const { error: authError } = await supabase.auth.admin.updateUserById(uid_user, updates);

			if (authError) {
				return NextResponse.json({ error: authError.message }, { status: 400 });
			}
		}

		return NextResponse.json({ success: true });
	} catch (err: any) {
		console.error('Error updating user:', err);
		return NextResponse.json(
			{ error: err.message || 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}

export async function DELETE(req: Request) {
	try {
		const { uid_user } = await req.json();

		if (!uid_user) {
			return NextResponse.json({ error: 'Falta uid_user' }, { status: 400 });
		}

		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);

		const { error: authError } = await supabase.auth.admin.deleteUser(uid_user);

		if (authError) {
			return NextResponse.json({ error: authError.message }, { status: 400 });
		}

		const { error: dbError } = await supabase.from('users').delete().eq('uid_user', uid_user);

		if (dbError) {
			return NextResponse.json({ error: dbError.message }, { status: 400 });
		}

		return NextResponse.json({ success: true });
	} catch (err: any) {
		console.error('Error deleting user:', err);
		return NextResponse.json(
			{ error: err.message || 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
