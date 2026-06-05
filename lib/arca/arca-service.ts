import { getSupabaseClient } from '../supabase-client';

export type ArcaConfig = {
	id: number;
	created_at?: string;
	cuit: string;
	sales_point: string;
	certificate: string;
	private_key: string;
	wsfe_service: string;
	company_name: string;
	company_address: string | null;
	is_active: boolean;
};

export type Invoice = {
	id: number;
	created_at?: string;
	transaction_id: number;
	invoice_type: string;
	invoice_number: string;
	cae: string;
	cae_due_date: string;
	total_amount: number;
	payment_method: string;
	client_name: string | null;
	client_cuit: string | null;
	client_address: string | null;
	pdf_url: string | null;
	qr_code_data: string | null;
};

const ARCA_CONFIG_TABLE = 'arca_config';
const INVOICES_TABLE = 'invoices';

// Get active ARCA configuration
export async function getActiveArcaConfig(): Promise<{
	data: ArcaConfig | null;
	error: any;
}> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(ARCA_CONFIG_TABLE)
		.select('*')
		.eq('is_active', true)
		.maybeSingle();

	return { data, error };
}

// Create ARCA configuration
export async function createArcaConfig(
	config: Omit<ArcaConfig, 'id' | 'created_at'>
): Promise<{ data: ArcaConfig | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(ARCA_CONFIG_TABLE).insert(config).select().single();
	return { data, error };
}

// Update ARCA configuration
export async function updateArcaConfig(
	id: number,
	changes: Partial<Omit<ArcaConfig, 'id' | 'created_at'>>
): Promise<{ data: ArcaConfig | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(ARCA_CONFIG_TABLE)
		.update(changes)
		.eq('id', id)
		.select()
		.single();
	return { data, error };
}

// Update ARCA configuration non-sensitive fields only (for client-side updates)
export async function updateArcaConfigNonSensitive(
	id: number,
	changes: Pick<
		ArcaConfig,
		'cuit' | 'sales_point' | 'wsfe_service' | 'company_name' | 'company_address' | 'is_active'
	>
): Promise<{ data: ArcaConfig | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(ARCA_CONFIG_TABLE)
		.update(changes)
		.eq('id', id)
		.select()
		.single();
	return { data, error };
}

// Get ARCA config without sensitive fields (for client-side display)
export async function getArcaConfigPublic(): Promise<{
	data: Pick<
		ArcaConfig,
		| 'id'
		| 'cuit'
		| 'sales_point'
		| 'wsfe_service'
		| 'company_name'
		| 'company_address'
		| 'is_active'
	> | null;
	error: any;
}> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(ARCA_CONFIG_TABLE)
		.select('id, cuit, sales_point, wsfe_service, company_name, company_address, is_active')
		.eq('is_active', true)
		.maybeSingle();
	return { data, error };
}

// Generate invoice number (simplified version - in production this should use ARCA WSFE)
export async function generateInvoiceNumber(
	salesPoint: string,
	invoiceType: string
): Promise<string> {
	// This is a simplified version. In production, you should:
	// 1. Call ARCA WSFE service to get the next authorized number
	// 2. Handle the SOAP request/response with the certificate
	// 3. Store the authorized number

	// For now, we'll generate a placeholder format
	const date = new Date();
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');

	// Format: YYYY-MM-XXXX-XXXX (sales_point-invoice_type-sequence)
	return `${year}-${month}-${salesPoint}-${invoiceType}-0001`;
}

// Generate CAE (Código de Autorización Electrónico)
// This is a simplified version - in production this should call ARCA WSFE
export async function generateCAE(): Promise<{ cae: string; dueDate: string }> {
	// This is a simplified version. In production, you should:
	// 1. Prepare the invoice data according to ARCA specifications
	// 2. Sign the request with the certificate
	// 3. Call the FECAESolicitar service
	// 4. Parse the response to get CAE and due date

	// For now, we'll generate a placeholder
	const date = new Date();
	const cae = String(Math.floor(Math.random() * 10000000000000000)).padStart(14, '0');
	const dueDate = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from now

	return {
		cae,
		dueDate: dueDate.toISOString().split('T')[0],
	};
}

// Create invoice
export async function createInvoice(
	invoice: Omit<Invoice, 'id' | 'created_at'>
): Promise<{ data: Invoice | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(INVOICES_TABLE).insert(invoice).select().single();
	return { data, error };
}

// Get invoice by transaction ID
export async function getInvoiceByTransactionId(
	transactionId: number
): Promise<{ data: Invoice | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(INVOICES_TABLE)
		.select('*')
		.eq('transaction_id', transactionId)
		.maybeSingle();

	return { data, error };
}

// Get all invoices
export async function getAllInvoices(): Promise<{ data: Invoice[] | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(INVOICES_TABLE).select('*');

	return { data, error };
}

// Get all invoice transaction IDs (for client-side indexing)
export async function getInvoiceTransactionIds(): Promise<{ data: number[] | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(INVOICES_TABLE).select('transaction_id');

	const transactionIds = data?.map((inv: { transaction_id: number }) => inv.transaction_id) || null;
	return { data: transactionIds, error };
}

// Update invoice
export async function updateInvoice(
	id: number,
	changes: Partial<Omit<Invoice, 'id' | 'created_at'>>
): Promise<{ data: Invoice | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(INVOICES_TABLE)
		.update(changes)
		.eq('id', id)
		.select()
		.maybeSingle();
	return { data, error };
}

// Generate QR code data for ARCA invoice
export function generateQRCodeData(invoice: Invoice, config: ArcaConfig): string {
	// ARCA QR code format specification
	// Format: https://www.afip.gob.ar/fe/qr/especificaciones.asp

	const data = {
		fecha: invoice.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
		cuit: config.cuit,
		ptoVta: config.sales_point,
		tipoCmp: invoice.invoice_type,
		nroCmp: invoice.invoice_number,
		importe: invoice.total_amount,
		moneda: 'ARS',
		ctz: 1,
		tipoDocRec: 80, // CUIT
		nroDocRec: invoice.client_cuit || '00000000000',
		tipoCodAut: 'E', // CAE
		codAut: invoice.cae,
	};

	return JSON.stringify(data);
}

// Invoice types according to ARCA
export const INVOICE_TYPES = {
	FACTURA_A: '01',
	FACTURA_B: '06',
	FACTURA_C: '11',
	NOTA_DEBITO_A: '02',
	NOTA_DEBITO_B: '07',
	NOTA_DEBITO_C: '12',
	NOTA_CREDITO_A: '03',
	NOTA_CREDITO_B: '08',
	NOTA_CREDITO_C: '13',
};

export const PAYMENT_METHODS = {
	EFECTIVO: '01',
	TARJETA_CREDITO: '02',
	TARJETA_DEBITO: '03',
	TRANSFERENCIA: '04',
	CHEQUE: '05',
};
