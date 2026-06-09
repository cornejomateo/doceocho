import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const statusOptionsEvents = [
	{ value: 'pending', label: 'Pendiente', icon: Clock, color: 'text-gray-400' },
	{ value: 'in_progress', label: 'En progreso', icon: AlertCircle, color: 'text-yellow-500' },
	{ value: 'completed', label: 'Completado', icon: CheckCircle, color: 'text-green-500' },
];
