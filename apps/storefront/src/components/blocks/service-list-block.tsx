import React from 'react'
import { Rating } from '../ui/rating'
import { t } from '@/lib/i18n'

interface Service {
  id: string
  title: string
  description?: string
  price?: {
    amount: number
    currency?: string
    unit?: string
  }
  duration?: string
  image?: string
  rating?: number
  bookingUrl?: string
}

interface ServiceListBlockProps {
  heading?: string
  description?: string
  services: Service[]
  layout?: 'grid' | 'list' | 'carousel'
  columns?: 2 | 3 | 4
  showBooking?: boolean
  showPricing?: boolean
  locale?: string
}

const columnClasses: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export const ServiceListBlock: React.FC<ServiceListBlockProps> = ({
  heading,
  description,
  services,
  layout = 'grid',
  columns = 3,
  showBooking = false,
  showPricing = true,
  locale = 'en',
}) => {
  if (!services || !services.length) return null

  const formatPrice = (price: Service['price']) => {
    if (!price) return null
    const currency = price.currency || 'USD'
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price.amount)
    return price.unit ? `${formatted}/${price.unit}` : formatted
  }

  const renderServiceCard = (service: Service) => (
    <div
      key={service.id}
      className="rounded-lg border border-ds-border bg-ds-card overflow-hidden transition-shadow hover:shadow-md"
    >
      {service.image && (
        <div className="aspect-video overflow-hidden">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-ds-foreground mb-1">{service.title}</h3>
        {service.description && (
          <p className="text-sm text-ds-muted-foreground mb-3 line-clamp-2">
            {service.description}
          </p>
        )}

        <div className="flex items-center gap-3 mb-3">
          {showPricing && service.price && (
            <span className="text-sm font-semibold text-ds-primary">
              {formatPrice(service.price ?? 0)}
            </span>
          )}
          {service.duration && (
            <span className="text-xs text-ds-muted-foreground">{service.duration}</span>
          )}
        </div>

        {service.rating !== undefined && (
          <div className="mb-3">
            <Rating value={service.rating} size="sm" showValue />
          </div>
        )}

        {showBooking && service.bookingUrl && (
          <a
            href={service.bookingUrl}
            className="block w-full text-center py-2 px-4 rounded-md bg-ds-primary text-ds-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t(locale, 'blocks.book_now')}
          </a>
        )}
      </div>
    </div>
  )

  const renderServiceListItem = (service: Service) => (
    <div
      key={service.id}
      className="flex gap-4 p-4 rounded-lg border border-ds-border bg-ds-card transition-shadow hover:shadow-md"
    >
      {service.image && (
        <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-md overflow-hidden">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-ds-foreground mb-1">{service.title}</h3>
        {service.description && (
          <p className="text-sm text-ds-muted-foreground mb-2 line-clamp-2">
            {service.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {showPricing && service.price && (
            <span className="text-sm font-semibold text-ds-primary">
              {formatPrice(service.price ?? 0)}
            </span>
          )}
          {service.duration && (
            <span className="text-xs text-ds-muted-foreground">{service.duration}</span>
          )}
          {service.rating !== undefined && (
            <Rating value={service.rating} size="sm" showValue />
          )}
        </div>
      </div>

      {showBooking && service.bookingUrl && (
        <div className="flex-shrink-0 self-center">
          <a
            href={service.bookingUrl}
            className="inline-block py-2 px-4 rounded-md bg-ds-primary text-ds-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t(locale, 'blocks.book_now')}
          </a>
        </div>
      )}
    </div>
  )

  return (
    <section className="w-full py-12 px-4">
      <div className="container mx-auto">
        {heading && (
          <h2 className="text-3xl font-bold text-ds-foreground mb-2">{heading}</h2>
        )}
        {description && (
          <p className="text-ds-muted-foreground mb-8 max-w-2xl">{description}</p>
        )}

        {layout === 'list' ? (
          <div className="flex flex-col gap-4">
            {services.map(renderServiceListItem)}
          </div>
        ) : layout === 'carousel' ? (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {services.map((service) => (
              <div key={service.id} className="min-w-[280px] snap-start flex-shrink-0">
                {renderServiceCard(service)}
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid gap-4 ${columnClasses[columns]}`}>
            {services.map(renderServiceCard)}
          </div>
        )}
      </div>
    </section>
  )
}
