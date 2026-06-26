import { NextResponse } from 'next/server';

export function handleAuthError(err: any) {
	if (err.message === 'UNAUTHORIZED') {
		return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
	}

	if (err.message === 'FORBIDDEN') {
		return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
	}

	return null;
}
