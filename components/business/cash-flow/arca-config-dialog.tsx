'use client';

import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ArcaConfig } from '@/lib/arca/arca-service';
import {
	getArcaConfigPublic,
	createArcaConfig,
	updateArcaConfigNonSensitive,
} from '@/lib/arca/arca-service';

interface ArcaConfigDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfigUpdated: () => void;
}

export function ArcaConfigDialog({ open, onOpenChange, onConfigUpdated }: ArcaConfigDialogProps) {
	const { toast } = useToast();
	const [loading, setLoading] = useState(false);
	const [existingConfig, setExistingConfig] = useState<Pick<
		ArcaConfig,
		| 'id'
		| 'cuit'
		| 'sales_point'
		| 'wsfe_service'
		| 'company_name'
		| 'company_address'
		| 'is_active'
	> | null>(null);

	const [cuit, setCuit] = useState('');
	const [salesPoint, setSalesPoint] = useState('');
	const [certificate, setCertificate] = useState('');
	const [privateKey, setPrivateKey] = useState('');
	const [wsfeService, setWsfeService] = useState('');
	const [companyName, setCompanyName] = useState('');
	const [companyAddress, setCompanyAddress] = useState('');
	const [companyLogoUrl, setCompanyLogoUrl] = useState('');

	useEffect(() => {
		if (open) {
			void loadConfig();
		} else {
			resetForm();
		}
	}, [open]);

	const loadConfig = async () => {
		setLoading(true);
		try {
			const { data } = await getArcaConfigPublic();
			if (data) {
				setExistingConfig(data);
				setCuit(data.cuit);
				setSalesPoint(data.sales_point);
				setWsfeService(data.wsfe_service);
				setCompanyName(data.company_name);
				setCompanyAddress(data.company_address || '');
			} else {
				resetForm();
			}
		} catch (error) {
			console.error('Error loading ARCA config:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!cuit || !salesPoint || !wsfeService || !companyName) {
			toast({
				title: 'Error',
				description: 'Por favor complete todos los campos requeridos.',
				variant: 'destructive',
			});
			return;
		}

		if (!existingConfig && (!certificate || !privateKey)) {
			toast({
				title: 'Error',
				description:
					'Por favor complete el certificado y la clave privada para la configuración inicial.',
				variant: 'destructive',
			});
			return;
		}

		setLoading(true);
		try {
			let error;
			if (existingConfig) {
				// Update non-sensitive fields only when updating existing config
				const nonSensitiveData = {
					cuit,
					sales_point: salesPoint,
					wsfe_service: wsfeService,
					company_name: companyName,
					company_address: companyAddress || null,
					is_active: true,
				};
				const result = await updateArcaConfigNonSensitive(existingConfig.id, nonSensitiveData);
				error = result.error;
			} else {
				// Create new config with all fields (including sensitive ones)
				const configData = {
					cuit,
					sales_point: salesPoint,
					certificate,
					private_key: privateKey,
					wsfe_service: wsfeService,
					company_name: companyName,
					company_address: companyAddress || null,
					is_active: true,
				};
				const result = await createArcaConfig(configData);
				error = result.error;
			}

			if (error) {
				throw error;
			}

			toast({
				title: 'Configuración guardada',
				description: 'La configuración de ARCA se ha guardado correctamente.',
			});
			onOpenChange(false);
			onConfigUpdated();
		} catch (error) {
			toast({
				title: 'Error',
				description: 'No se pudo guardar la configuración.',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setCuit('');
		setSalesPoint('');
		setCertificate('');
		setPrivateKey('');
		setWsfeService('');
		setCompanyName('');
		setCompanyAddress('');
		setCompanyLogoUrl('');
		setExistingConfig(null);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Configuración ARCA</DialogTitle>
					<DialogDescription>
						Configure sus credenciales de ARCA para generar facturas electrónicas
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="companyName">Nombre de la Empresa *</Label>
							<Input
								id="companyName"
								placeholder="Mi Empresa S.A."
								value={companyName}
								onChange={(e) => setCompanyName(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="cuit">CUIT *</Label>
							<Input
								id="cuit"
								placeholder="20-12345678-9"
								value={cuit}
								onChange={(e) => setCuit(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="salesPoint">Punto de Venta *</Label>
							<Input
								id="salesPoint"
								placeholder="0001"
								value={salesPoint}
								onChange={(e) => setSalesPoint(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="wsfeService">Servicio WSFE *</Label>
							<Input
								id="wsfeService"
								placeholder="wsfe"
								value={wsfeService}
								onChange={(e) => setWsfeService(e.target.value)}
								required
							/>
						</div>

						{!existingConfig && (
							<>
								<div className="space-y-2">
									<Label htmlFor="certificate">Certificado Digital *</Label>
									<Textarea
										id="certificate"
										placeholder="Pegue aquí el contenido del certificado .crt o .pem"
										value={certificate}
										onChange={(e) => setCertificate(e.target.value)}
										required
										className="min-h-[100px] font-mono text-xs"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="privateKey">Clave Privada *</Label>
									<Textarea
										id="privateKey"
										placeholder="Pegue aquí el contenido de la clave privada .key"
										value={privateKey}
										onChange={(e) => setPrivateKey(e.target.value)}
										required
										className="min-h-[100px] font-mono text-xs"
									/>
								</div>
							</>
						)}

						{existingConfig && (
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<p className="text-sm text-blue-700">
									Las credenciales (certificado y clave privada) ya están configuradas y no se
									muestran por seguridad. Para actualizarlas, contacte al administrador del sistema.
								</p>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="companyAddress">Dirección de la Empresa (opcional)</Label>
							<Input
								id="companyAddress"
								placeholder="Calle 123, Ciudad"
								value={companyAddress}
								onChange={(e) => setCompanyAddress(e.target.value)}
							/>
						</div>

						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
							<p className="text-sm font-medium text-yellow-800">
								Información requerida del cliente:
							</p>
							<ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
								<li>CUIT de la empresa</li>
								<li>Punto de venta habilitado para Web Services</li>
								<li>Certificado digital (.crt o .pem)</li>
								<li>Clave privada (.key)</li>
								<li>Relación del servicio WSFE</li>
							</ul>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Cancelar
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? 'Guardando...' : existingConfig ? 'Actualizar' : 'Guardar'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
