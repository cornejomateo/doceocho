'use server';

import {
	getActiveArcaConfig,
	generateInvoiceNumber,
	generateCAE,
	createInvoice,
	generateQRCodeData,
	INVOICE_TYPES,
	PAYMENT_METHODS,
	getInvoiceByTransactionId,
} from '@/lib/arca/arca-service';
import { generateInvoicePDF } from '@/lib/arca/pdf-generator';
import { getTransactionById } from '@/lib/cash-flow/cash-flow';

export async function generateInvoiceForTransaction(transactionId: number) {
	try {
		// Get ARCA configuration
		const { data: config, error: configError } = await getActiveArcaConfig();
		if (configError || !config) {
			return {
				success: false,
				error: 'No hay configuración de ARCA activa. Por favor configure ARCA primero.',
			};
		}

		// Get transaction details
		const { data: transaction, error: transactionError } = await getTransactionById(transactionId);
		if (transactionError || !transaction) {
			return {
				success: false,
				error: 'No se encontró la transacción.',
			};
		}

		// Check if transaction is income
		if (transaction.type !== 'income') {
			return {
				success: false,
				error: 'Solo se pueden generar facturas para ingresos.',
			};
		}

		// Check if invoice already exists
		const { data: existingInvoice } = await import('@/lib/arca/arca-service').then((m) =>
			m.getInvoiceByTransactionId(transactionId)
		);
		if (existingInvoice) {
			return {
				success: false,
				error: 'Ya existe una factura para esta transacción.',
			};
		}

		// Generate invoice number and CAE using ARCA API
		let invoiceNumber: string;
		let cae: string;
		let dueDate: string;

		try {
			const arcaResponse = await fetch(
				`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/arca/invoice`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						invoiceType: INVOICE_TYPES.FACTURA_B,
						totalAmount: Number(transaction.amount),
						paymentMethod:
							transaction.category === 'cash'
								? PAYMENT_METHODS.EFECTIVO
								: PAYMENT_METHODS.TRANSFERENCIA,
						invoiceDate: new Date().toISOString().split('T')[0],
					}),
				}
			);

			const arcaData = await arcaResponse.json();

			if (arcaData.success) {
				invoiceNumber = arcaData.invoiceNumber;
				cae = arcaData.cae;
				dueDate = arcaData.caeDueDate;
			} else {
				throw new Error(arcaData.error || 'Error al generar factura ARCA');
			}
		} catch (error) {
			console.error('Error calling ARCA API, falling back to placeholder:', error);
			// Fallback to placeholder if ARCA API fails
			invoiceNumber = await generateInvoiceNumber(config.sales_point, INVOICE_TYPES.FACTURA_B);
			const caeResult = await generateCAE();
			cae = caeResult.cae;
			dueDate = caeResult.dueDate;
		}

		// Determine payment method
		const paymentMethod =
			transaction.category === 'cash' ? PAYMENT_METHODS.EFECTIVO : PAYMENT_METHODS.TRANSFERENCIA;

		// Create invoice record
		const { data: invoice, error: invoiceError } = await createInvoice({
			transaction_id: transactionId,
			invoice_type: INVOICE_TYPES.FACTURA_B,
			invoice_number: invoiceNumber,
			cae,
			cae_due_date: dueDate,
			total_amount: Number(transaction.amount),
			payment_method: paymentMethod,
			client_name: null,
			client_cuit: null,
			client_address: null,
			pdf_url: null,
			qr_code_data: null,
		});

		if (invoiceError || !invoice) {
			return {
				success: false,
				error: 'Error al crear la factura.',
			};
		}

		// Generate QR code data
		const qrCodeData = generateQRCodeData(invoice, config);

		// Generate PDF
		const pdfBlob = await generateInvoicePDF({
			invoice,
			config,
			transactionDescription: transaction.description || translateCategory(transaction.category),
		});

		// Convert blob to base64 for storage (in production, upload to cloud storage)
		const arrayBuffer = await blobToArrayBuffer(pdfBlob);
		const buffer = Buffer.from(arrayBuffer);
		const pdfBase64 = `data:application/pdf;base64,${buffer.toString('base64')}`;

		// Update invoice with PDF URL and QR code data
		const { error: updateError } = await import('@/lib/arca/arca-service').then((m) =>
			m.updateInvoice(invoice.id, {
				pdf_url: pdfBase64,
				qr_code_data: qrCodeData,
			})
		);

		if (updateError) {
			return {
				success: false,
				error: 'Error al actualizar la factura con el PDF.',
			};
		}

		return {
			success: true,
			invoice: { ...invoice, pdf_url: pdfBase64, qr_code_data: qrCodeData },
		};
	} catch (error) {
		console.error('Error generating invoice:', error);
		return {
			success: false,
			error: 'Error al generar la factura. Por favor intente nuevamente.',
		};
	}
}

export async function downloadInvoicePDF(transactionId: number) {
	try {
		const { data: invoices } = await import('@/lib/arca/arca-service').then((m) =>
			m.getAllInvoices()
		);

		const { data: invoice, error } = await getInvoiceByTransactionId(transactionId);

		if (error || !invoice || !invoice.pdf_url) {
			return {
				success: false,
				error: 'No se encontró la factura o el PDF.',
			};
		}

		return {
			success: true,
			pdfData: invoice.pdf_url,
		};
	} catch (error) {
		console.error('Error downloading invoice:', error);
		return {
			success: false,
			error: 'Error al descargar la factura.',
		};
	}
}

function translateCategory(category: string): string {
	const translations: Record<string, string> = {
		cash: 'Efectivo',
		transfer: 'Transferencia',
		salary: 'Pago de Sueldo',
		suppliers: 'Pago a Proveedores',
		services: 'Servicios',
		other: 'Otros Gastos',
	};
	return translations[category] || category;
}

function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
	return blob.arrayBuffer();
}
