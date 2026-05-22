import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { buildEventEmail } from '../templates/email.js';

dotenv.config({ path: '.env.development' });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT),
	secure: false,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

async function run() {
	const today = new Date().toLocaleDateString('es-AR', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	const { data: events, error } = await supabase
		.from('events')
		.select('*')
		.eq('date', new Date().toISOString().slice(0, 10))
		.ilike('title', '%Cumpleaños%');

	if (error) throw error;
	if (!events || events.length === 0) return;

	for (const event of events) {
		const { subject, html, text } = buildEventEmail([event], today);

		await transporter.sendMail({
			from: `"Recordatorios" <${process.env.SMTP_USER}>`,
			to: process.env.EMAIL_TO,
			subject,
			html,
			text,
		});
	}
}

run().catch(console.error);
