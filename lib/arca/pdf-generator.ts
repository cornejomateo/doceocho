import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Invoice, ArcaConfig, generateQRCodeData } from './arca-service';
import { formatCurrency } from '@/utils/formats-money';

export interface InvoiceData {
	invoice: Invoice;
	config: ArcaConfig;
	transactionDescription: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
	const { invoice, config, transactionDescription } = data;
	const doc = new jsPDF();

	// Page dimensions
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 15;

	// Colors
	const primaryColor: [number, number, number] = [41, 128, 185]; // Blue
	const textColor: [number, number, number] = [51, 51, 51];
	const grayColor: [number, number, number] = [128, 128, 128];

	// Format invoice date
	const invoiceDate = invoice.created_at ? new Date(invoice.created_at) : new Date();
	const formattedDate = isNaN(invoiceDate.getTime())
		? new Date().toLocaleDateString('es-AR')
		: invoiceDate.toLocaleDateString('es-AR');

	// Header section
	doc.setFillColor(...primaryColor);
	doc.rect(0, 0, pageWidth, 40, 'F');

	// Company name
	doc.setTextColor(255, 255, 255);
	doc.setFontSize(16);
	doc.setFont('helvetica', 'bold');
	doc.text(config.company_name, margin, 15);

	// Invoice title
	doc.setFontSize(12);
	doc.setFont('helvetica', 'normal');
	doc.text('COMPROBANTE ELECTRÓNICO', margin, 22);

	// Invoice type and number
	doc.setFontSize(10);
	doc.text(`Tipo: ${invoice.invoice_type} | N°: ${invoice.invoice_number}`, margin, 30);

	// Fiscal information section
	let yPosition = 50;

	// Company fiscal data
	doc.setTextColor(...textColor);
	doc.setFontSize(10);
	doc.setFont('helvetica', 'bold');
	doc.text('DATOS DEL EMISOR', margin, yPosition);

	yPosition += 7;
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	doc.text(`Razón Social: ${config.company_name}`, margin, yPosition);
	yPosition += 5;
	doc.text(`CUIT: ${formatCUIT(config.cuit)}`, margin, yPosition);
	yPosition += 5;
	if (config.company_address) {
		doc.text(`Domicilio: ${config.company_address}`, margin, yPosition);
		yPosition += 5;
	}
	doc.text(`Punto de Venta: ${config.sales_point}`, margin, yPosition);

	// Client fiscal data
	yPosition += 10;
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10);
	doc.text('DATOS DEL CLIENTE', margin, yPosition);

	yPosition += 7;
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	if (invoice.client_name) {
		doc.text(`Nombre: ${invoice.client_name}`, margin, yPosition);
		yPosition += 5;
	}
	if (invoice.client_cuit) {
		doc.text(`CUIT: ${formatCUIT(invoice.client_cuit)}`, margin, yPosition);
		yPosition += 5;
	}
	if (invoice.client_address) {
		doc.text(`Domicilio: ${invoice.client_address}`, margin, yPosition);
		yPosition += 5;
	}

	// Invoice details
	yPosition += 10;
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10);
	doc.text('DATOS DE LA FACTURA', margin, yPosition);

	yPosition += 7;
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	doc.text(`Fecha: ${formattedDate}`, margin, yPosition);
	yPosition += 5;
	doc.text(`CAE: ${invoice.cae}`, margin, yPosition);
	yPosition += 5;
	doc.text(
		`Vencimiento CAE: ${new Date(invoice.cae_due_date).toLocaleDateString('es-AR')}`,
		margin,
		yPosition
	);
	yPosition += 5;

	const paymentMethodText = getPaymentMethodText(invoice.payment_method);
	doc.text(`Medio de Pago: ${paymentMethodText}`, margin, yPosition);

	// Products/Services table
	yPosition += 10;

	autoTable(doc, {
		startY: yPosition,
		head: [['Descripción', 'Monto']],
		body: [[transactionDescription, formatCurrency(invoice.total_amount)]],
		theme: 'striped',
		headStyles: {
			fillColor: primaryColor,
			textColor: [255, 255, 255],
			fontSize: 9,
			fontStyle: 'bold',
		},
		bodyStyles: {
			fontSize: 9,
			textColor: textColor,
		},
		columnStyles: {
			0: { cellWidth: 100 },
			1: { cellWidth: 40, halign: 'right' },
		},
		margin: { left: margin, right: margin },
	});

	// Total
	const finalY = (doc as any).lastAutoTable.finalY + 10;
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(12);
	doc.text(`TOTAL: ${formatCurrency(invoice.total_amount)}`, pageWidth - margin - 50, finalY);

	// QR Code
	const qrData = generateQRCodeData(invoice, config);
	const qrCodeDataURL = await QRCode.toDataURL(qrData, {
		width: 100,
		margin: 1,
	});

	const qrY = finalY + 20;
	const qrX = pageWidth - margin - 50;
	doc.addImage(qrCodeDataURL, 'PNG', qrX, qrY, 40, 40);

	// QR Code label
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.setTextColor(...grayColor);
	doc.text('Escaneé para verificar', qrX + 20, qrY + 45, { align: 'center' });

	// Footer
	doc.setFontSize(8);
	doc.setTextColor(...grayColor);
	doc.text(
		'Este comprobante es un documento electrónico válido según normativa ARCA',
		pageWidth / 2,
		pageHeight - 10,
		{ align: 'center' }
	);

	return doc.output('blob');
}

function formatCUIT(cuit: string): string {
	// Format CUIT as XX-XXXXXXXX-X
	if (cuit.length === 11) {
		return `${cuit.substring(0, 2)}-${cuit.substring(2, 10)}-${cuit.substring(10)}`;
	}
	return cuit;
}

function getPaymentMethodText(code: string): string {
	const methods: Record<string, string> = {
		'01': 'Efectivo',
		'02': 'Tarjeta de Crédito',
		'03': 'Tarjeta de Débito',
		'04': 'Transferencia',
		'05': 'Cheque',
	};
	return methods[code] || code;
}
