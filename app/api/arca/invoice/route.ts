import { NextRequest, NextResponse } from 'next/server';
import { getActiveArcaConfig } from '@/lib/arca/arca-service';
import { createWSFEClient, CurrencyCode, PaymentMethodCode } from '@/lib/arca/wsfe-client';

export const runtime = 'nodejs';

interface InvoiceRequest {
	invoiceType: string;
	totalAmount: number;
	paymentMethod: string;
	invoiceDate?: string;
	clientName?: string;
	clientCuit?: string;
	clientAddress?: string;
}

export async function POST(request: NextRequest) {
	try {
		const body: InvoiceRequest = await request.json();

		// Get ARCA configuration
		const { data: config } = await getActiveArcaConfig();
		if (!config) {
			return NextResponse.json({ error: 'No hay configuración de ARCA activa' }, { status: 400 });
		}

		// Create WSFE client
		const wsfeClient = createWSFEClient({
			cuit: config.cuit,
			certificate: config.certificate,
			privateKey: config.private_key,
			salesPoint: config.sales_point,
			environment: 'homologation', // Use homologation for testing
		});

		await wsfeClient.initialize();

		// Get last authorized invoice number
		const lastNumber = await wsfeClient.getLastAuthorizedInvoiceNumber(body.invoiceType);
		const nextNumber = lastNumber + 1;

		// Format invoice number
		const date = new Date();
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const invoiceNumber = `${year}-${month}-${config.sales_point}-${body.invoiceType}-${String(nextNumber).padStart(8, '0')}`;

		// Request CAE
		const caeResponse = await wsfeClient.requestCAE({
			invoiceType: body.invoiceType,
			salesPoint: config.sales_point,
			invoiceNumber: nextNumber,
			invoiceDate: body.invoiceDate || new Date().toISOString().split('T')[0],
			totalAmount: body.totalAmount,
			currencyCode: CurrencyCode.PES,
			paymentMethodCode: PaymentMethodCode.EFECTIVO,
			clientName: body.clientName,
			clientCuit: body.clientCuit,
			clientAddress: body.clientAddress,
		});

		return NextResponse.json({
			success: true,
			invoiceNumber,
			cae: caeResponse.cae,
			caeDueDate: caeResponse.caeDueDate,
		});
	} catch (error) {
		console.error('Error generating ARCA invoice:', error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Error al generar factura ARCA',
			},
			{ status: 500 }
		);
	}
}
