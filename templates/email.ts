import { Event } from '@/lib/calendar/events'

export function buildEventEmail(events: Event[], today: string) {
  const subject = `📅 Recordatorio de eventos para ${today}`

  const eventsHtml = events.map(event => `
    <div style="border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; background-color: #f8fafc; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 8px 0; color: #1e40af; font-size: 18px;">
        ${event.title || 'Sin título'}
      </h3>
      <div style="color: #64748b; font-size: 14px; line-height: 1.6;">
        ${event.type ? `<p><strong>Tipo:</strong> ${event.type}</p>` : ''}
        ${event.client ? `<p><strong>Cliente:</strong> ${event.client}</p>` : ''}
        ${event.location ? `<p><strong>Ubicación:</strong> ${event.location}</p>` : ''}
        ${event.address ? `<p><strong>Dirección:</strong> ${event.address}</p>` : ''}
        ${event.description ? `<p>${event.description}</p>` : ''}
        <p><strong>Estado:</strong>
          <span style="color: ${event.status === 'Pendiente' ? '#f59e0b' : '#10b981'};">
            ${event.status || 'Pendiente'}
          </span>
        </p>
      </div>
    </div>
  `).join('')

  const html = `<!DOCTYPE html>...${eventsHtml}...`

  const text = `Recordatorio de Eventos - ${today} ...`

  return { subject, html, text }
}
