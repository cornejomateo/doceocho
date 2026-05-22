import { Card } from '@/components/ui/card';
import { PackagePlus, Layers } from 'lucide-react';
import type { SupplyItemStock } from '@/lib/stock/supplies-stock';

interface StockStatsProps {
	totalItems: number;
	lowStockCount: number;
	lastAddedItem?: SupplyItemStock | null;
}

export function StockStats({ totalItems, lastAddedItem }: StockStatsProps) {
	const getItemDisplay = () => {
		if (!lastAddedItem && !totalItems) return null;

		return {
			line: lastAddedItem?.supply_line || 'Sin código',
			code: lastAddedItem?.supply_code || 'Sin código',
			color: lastAddedItem?.supply_color,
			extra: '',
		};
	};

	const displayItem = getItemDisplay();

	return (
		<div className="flex justify-start">
			<Card className="bg-card border-border w-100 h-32 mr-4 p-4">
				<div className="flex items-center p-2">
					<div className="mr-3 rounded-lg bg-secondary p-2 text-chart-2">
						<PackagePlus className="h-5 w-5" />
					</div>
					<div>
						<p className="text-xs font-medium text-muted-foreground">Último agregado</p>
						{displayItem ? (
							<div className="space-y-0.5">
								<p className="text-lg font-medium text-foreground">
									{displayItem.line}, {displayItem.code}
								</p>
								{displayItem.color && (
									<p className="text-sm text-muted-foreground">
										{displayItem.color}
										{displayItem.extra ? ` • ${displayItem.extra}` : ''}
									</p>
								)}
							</div>
						) : (
							<p className="text-xs text-muted-foreground">No hay registros</p>
						)}
					</div>
				</div>
			</Card>
			<Card className="bg-card border-border w-100 h-32 mr-4 p-4">
				<div className="flex items-center p-2">
					<div className="mr-3 rounded-lg bg-secondary p-2 text-chart-2">
						<Layers className="h-5 w-5" />
					</div>
					<div>
						<p className="text-xs font-medium text-muted-foreground">Total de insumos</p>
						<p className="text-lg font-medium text-foreground">{totalItems}</p>
					</div>
				</div>
			</Card>
		</div>
	);
}
