import crypto from 'crypto';
import forge from 'node-forge';

// ARCA WSFE URLs
const WSFE_HOMOLOGATION_URL = 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL';
const WSFE_PRODUCTION_URL = 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL';

// Invoice types according to ARCA specification
export enum InvoiceType {
	FACTURA_A = '01',
	NOTA_DEBITO_A = '02',
	NOTA_CREDITO_A = '03',
	RECIBO_A = '04',
	FACTURA_B = '06',
	NOTA_DEBITO_B = '07',
	NOTA_CREDITO_B = '08',
	RECIBO_B = '09',
	FACTURA_C = '11',
	NOTA_DEBITO_C = '12',
	NOTA_CREDITO_C = '13',
}

// Currency codes
export enum CurrencyCode {
	PES = 'PES', // Pesos Argentinos
	DOL = 'DOL', // Dólar Estadounidense
	EUR = 'EUR', // Euro
}

// Payment method codes
export enum PaymentMethodCode {
	EFECTIVO = '01',
	CHEQUE = '02',
	TARJETA_CREDITO = '03',
	TARJETA_DEBITO = '04',
	OTROS = '99',
}

interface WSFEConfig {
	cuit: string;
	certificate: string;
	privateKey: string;
	salesPoint: string;
	environment?: 'homologation' | 'production';
}

interface InvoiceRequest {
	invoiceType: string;
	salesPoint: string;
	invoiceNumber: number;
	invoiceDate: string;
	totalAmount: number;
	currencyCode: string;
	paymentMethodCode: string;
	clientName?: string;
	clientCuit?: string;
	clientAddress?: string;
}

interface CAEResponse {
	cae: string;
	caeDueDate: string;
	invoiceNumber: number;
	authorizationCode?: string;
}

export class WSFEClient {
	private config: WSFEConfig;
	private wsdlUrl: string;
	private soapClient: any;

	constructor(config: WSFEConfig) {
		this.config = config;
		this.wsdlUrl =
			config.environment === 'production' ? WSFE_PRODUCTION_URL : WSFE_HOMOLOGATION_URL;
	}

	async initialize(): Promise<void> {
		try {
			const soap = (await import('soap')).default;
			this.soapClient = await soap.createClientAsync(this.wsdlUrl);
		} catch (error) {
			throw new Error(`Error creating SOAP client: ${error}`);
		}
	}

	/**
	 * Validate PEM format
	 */
	private validatePEM(pemData: string, type: 'certificate' | 'privateKey'): void {
		if (!pemData || typeof pemData !== 'string') {
			throw new Error(`${type} is empty or invalid`);
		}

		// Check if it has PEM headers
		const expectedHeader =
			type === 'certificate' ? '-----BEGIN CERTIFICATE-----' : '-----BEGIN PRIVATE KEY-----';
		const expectedFooter =
			type === 'certificate' ? '-----END CERTIFICATE-----' : '-----END PRIVATE KEY-----';

		if (!pemData.includes(expectedHeader) || !pemData.includes(expectedFooter)) {
			throw new Error(
				`Invalid PEM format for ${type}. Expected format:\n${expectedHeader}\n[content]\n${expectedFooter}`
			);
		}
	}

	/**
	 * Sign XML with digital certificate using node-forge
	 */
	private signXML(xml: string): string {
		try {
			// Validate PEM format before parsing
			this.validatePEM(this.config.certificate, 'certificate');
			this.validatePEM(this.config.privateKey, 'privateKey');

			// Parse the certificate
			const cert = forge.pki.certificateFromPem(this.config.certificate);
			const privateKey = forge.pki.privateKeyFromPem(this.config.privateKey);

			// Create a simple signature (this is a simplified implementation)
			// In production, you would need proper XML-DSIG implementation
			const md = forge.md.sha1.create();
			md.update(xml, 'utf8');
			const signature = privateKey.sign(md);
			const signatureBase64 = forge.util.encode64(signature);

			// Add signature to XML (simplified)
			const signedXml = xml.replace(
				'</loginTicketRequest>',
				`<Signature>
					<SignedInfo>
						<CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
						<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
						<Reference URI="">
							<Transforms>
								<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
							</Transforms>
							<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
							<DigestValue>${signatureBase64}</DigestValue>
						</Reference>
					</SignedInfo>
					<SignatureValue>${signatureBase64}</SignatureValue>
					<KeyInfo>
						<X509Data>
							<X509Certificate>${forge.util.encode64(cert.raw)}</X509Certificate>
						</X509Data>
					</KeyInfo>
				</Signature>
				</loginTicketRequest>`
			);

			return signedXml;
		} catch (error) {
			console.error('Error signing XML:', error);
			throw new Error(`Error signing XML: ${error}`);
		}
	}

	/**
	 * Get the last authorized invoice number for a given type and sales point
	 */
	async getLastAuthorizedInvoiceNumber(invoiceType: string): Promise<number> {
		try {
			if (!this.soapClient) {
				await this.initialize();
			}

			const authRequest = this.createAuthRequest();
			const signedAuth = this.signXML(authRequest);

			const args = {
				Auth: { FeAuthReq: signedAuth },
				CompTipo: invoiceType,
				PtoVta: this.config.salesPoint,
			};

			const result = await this.soapClient.FECompUltimoAutorizadoAsync(args);
			const lastNumber = result[0].FECompUltimoAutorizadoResult.CbteNro;

			return parseInt(lastNumber, 10);
		} catch (error) {
			console.error('Error getting last authorized invoice number:', error);
			throw new Error(`Error getting last authorized invoice number: ${error}`);
		}
	}

	/**
	 * Request CAE (Código de Autorización Electrónico) for an invoice
	 */
	async requestCAE(invoiceRequest: InvoiceRequest): Promise<CAEResponse> {
		try {
			if (!this.soapClient) {
				await this.initialize();
			}

			const authRequest = this.createAuthRequest();
			const signedAuth = this.signXML(authRequest);

			const feDetReq = this.createInvoiceDetailRequest(invoiceRequest);
			const signedFeDet = this.signXML(feDetReq);

			const args = {
				Auth: { FeAuthReq: signedAuth },
				FeCAEReq: {
					Fecr: {
						FeCabReq: {
							CantReg: 1,
							PtoVta: this.config.salesPoint,
							CbteTipo: invoiceRequest.invoiceType,
						},
						FeDetReq: [signedFeDet],
					},
				},
			};

			const result = await this.soapClient.FECAESolicitarAsync(args);
			const caeResult = result[0].FECAESolicitarResult.FeCabResp;

			return {
				cae: caeResult.Cae,
				caeDueDate: caeResult.FchVto,
				invoiceNumber: parseInt(invoiceRequest.invoiceNumber.toString(), 10),
				authorizationCode: caeResult.CbtDesde,
			};
		} catch (error) {
			console.error('Error requesting CAE:', error);
			throw new Error(`Error requesting CAE: ${error}`);
		}
	}

	/**
	 * Create authentication request for ARCA WSFE
	 */
	private createAuthRequest(): string {
		const timestamp = new Date().toISOString();
		const uniqueId = crypto.randomBytes(16).toString('hex');

		return `
			<loginTicketRequest version="1.0">
				<header>
					<uniqueId>${uniqueId}</uniqueId>
					<generationTime>${timestamp}</generationTime>
					<expirationTime>${new Date(Date.now() + 3600000).toISOString()}</expirationTime>
				</header>
				<service>wsfe</service>
			</loginTicketRequest>
		`;
	}

	/**
	 * Create invoice detail request for CAE
	 */
	private createInvoiceDetailRequest(invoiceRequest: InvoiceRequest): string {
		return `
			<FECAEDetRequest>
				<Concepto>1</Concepto>
				<DocTipo>80</DocTipo>
				<DocNro>${invoiceRequest.clientCuit || this.config.cuit}</DocNro>
				<CbteDesde>${invoiceRequest.invoiceNumber}</CbteDesde>
				<CbteHasta>${invoiceRequest.invoiceNumber}</CbteHasta>
				<CbteFch>${invoiceRequest.invoiceDate}</CbteFch>
				<ImpTotal>${invoiceRequest.totalAmount}</ImpTotal>
				<ImpTotConc>0.00</ImpTotConc>
				<ImpNeto>${invoiceRequest.totalAmount}</ImpNeto>
				<ImpOpEx>0.00</ImpOpEx>
				<ImpTrib>0.00</ImpTrib>
				<ImpIVA>${invoiceRequest.totalAmount * 0.21}</ImpIVA>
				<FchServDesde></FchServDesde>
				<FchServHasta></FchServHasta>
				<FchVtoPago></FchVtoPago>
				<MonId>${invoiceRequest.currencyCode}</MonId>
				<Cotiz>1.0000</Cotiz>
				<Iva>
					<AlicIva>
						<Id>5</Id>
						<BaseImp>${invoiceRequest.totalAmount}</BaseImp>
						<Importe>${invoiceRequest.totalAmount * 0.21}</Importe>
					</AlicIva>
				</Iva>
			</FECAEDetRequest>
		`;
	}
}

/**
 * Create WSFE client instance
 */
export function createWSFEClient(config: WSFEConfig): WSFEClient {
	return new WSFEClient(config);
}
