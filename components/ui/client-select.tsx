'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Client, listClients } from '@/lib/clients/clients';

interface ClientSelectProps {
	value?: number | null;
	onValueChange: (clientId: number | null, clientName: string | null) => void;
	onManualInput?: () => void;
	placeholder?: string;
	disabled?: boolean;
}

export function ClientSelect({
	value,
	onValueChange,
	onManualInput,
	placeholder = 'Seleccionar cliente...',
	disabled = false,
}: ClientSelectProps) {
	const [open, setOpen] = useState(false);
	const [clients, setClients] = useState<Client[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');

	useEffect(() => {
		const loadClients = async () => {
			setLoading(true);
			const { data, error } = await listClients();
			if (!error && data) {
				setClients(data);
			}
			setLoading(false);
		};
		loadClients();
	}, []);

	const selectedClient = clients.find((client) => client.id === value);

	const filteredClients = clients.filter(
		(client) =>
			client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			client.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
					disabled={disabled}
				>
					{selectedClient ? `${selectedClient.last_name} ${selectedClient.name}` : placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command>
					<CommandInput placeholder="Buscar cliente..." onValueChange={setSearchTerm} />
					<CommandList>
						{loading ? (
							<CommandEmpty>Cargando clientes...</CommandEmpty>
						) : filteredClients.length === 0 ? (
							<CommandEmpty>
								{searchTerm ? 'No se encontraron clientes' : 'No hay clientes disponibles'}
							</CommandEmpty>
						) : (
							<>
								<CommandGroup>
									{filteredClients.map((client) => (
										<CommandItem
											key={client.id}
											value={client.id.toString()}
											onSelect={() => {
												onValueChange(client.id, `${client.last_name} ${client.name}`);
												setOpen(false);
											}}
										>
											{client.last_name} {client.name}
											<Check
												className={cn(
													'ml-auto h-4 w-4',
													value === client.id ? 'opacity-100' : 'opacity-0'
												)}
											/>
										</CommandItem>
									))}
								</CommandGroup>
								{onManualInput && (
									<CommandGroup>
										<CommandItem
											value="manual"
											onSelect={() => {
												onManualInput();
												setOpen(false);
											}}
										>
											<Plus className="mr-2 h-4 w-4" />
											Otro (ingresar manualmente)
										</CommandItem>
									</CommandGroup>
								)}
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
