import React, { useState } from 'react'

interface Provider {
  id: string
  name: string
  specialty: string
  rating: number
  reviewCount: number
  nextAvailability: string
  insurance: string[]
  location: string
}

interface HealthcareProviderBlockProps {
  heading?: string
  specialties?: string[]
  showAvailability?: boolean
  showRating?: boolean
  layout?: 'grid' | 'list' | 'cards'
}

const placeholderProviders: Provider[] = [
  { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Family Medicine', rating: 4.9, reviewCount: 124, nextAvailability: 'Tomorrow, 10:00 AM', insurance: ['Blue Cross', 'Aetna', 'United'], location: 'Downtown Clinic' },
  { id: '2', name: 'Dr. Michael Chen', specialty: 'Cardiology', rating: 4.8, reviewCount: 89, nextAvailability: 'Wed, 2:00 PM', insurance: ['Blue Cross', 'Cigna'], location: 'Heart Center' },
  { id: '3', name: 'Dr. Emily Williams', specialty: 'Dermatology', rating: 4.7, reviewCount: 156, nextAvailability: 'Thu, 9:30 AM', insurance: ['Aetna', 'United', 'Humana'], location: 'Skin & Wellness' },
  { id: '4', name: 'Dr. James Martinez', specialty: 'Orthopedics', rating: 4.9, reviewCount: 201, nextAvailability: 'Mon, 11:00 AM', insurance: ['Blue Cross', 'Aetna', 'Cigna', 'United'], location: 'Sports Medicine Center' },
  { id: '5', name: 'Dr. Lisa Patel', specialty: 'Pediatrics', rating: 4.8, reviewCount: 178, nextAvailability: 'Tomorrow, 3:00 PM', insurance: ['United', 'Humana'], location: 'Children\'s Health Clinic' },
  { id: '6', name: 'Dr. Robert Kim', specialty: 'Family Medicine', rating: 4.6, reviewCount: 92, nextAvailability: 'Fri, 1:00 PM', insurance: ['Blue Cross', 'Cigna', 'Humana'], location: 'Eastside Medical' },
]

const allSpecialties = ['All', 'Family Medicine', 'Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics']

export const HealthcareProviderBlock: React.FC<HealthcareProviderBlockProps> = ({
  heading = 'Find a Provider',
  specialties,
  showAvailability = true,
  showRating = true,
  layout = 'grid',
}) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState('All')

  const filterOptions = specialties ? ['All', ...specialties] : allSpecialties

  const filteredProviders = selectedSpecialty === 'All'
    ? placeholderProviders
    : placeholderProviders.filter((p) => p.specialty === selectedSpecialty)

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '')
  }

  const ProviderCard = ({ provider }: { provider: Provider }) => (
    <div className="bg-ds-card border border-ds-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-ds-muted animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ds-foreground">{provider.name}</h3>
          <p className="text-sm text-ds-muted-foreground">{provider.specialty}</p>
          <p className="text-xs text-ds-muted-foreground">{provider.location}</p>
        </div>
      </div>

      {showRating && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-ds-warning">{renderStars(provider.rating)}</span>
          <span className="text-sm font-medium text-ds-foreground">{provider.rating}</span>
          <span className="text-xs text-ds-muted-foreground">({provider.reviewCount} reviews)</span>
        </div>
      )}

      {showAvailability && (
        <div className="mb-3">
          <p className="text-xs text-ds-muted-foreground">Next Available</p>
          <p className="text-sm font-medium text-ds-success">{provider.nextAvailability}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-4">
        {(provider.insurance || []).map((ins) => (
          <span key={ins} className="text-xs px-2 py-0.5 rounded-full bg-ds-muted text-ds-muted-foreground">
            {ins}
          </span>
        ))}
      </div>

      <button className="w-full px-4 py-2 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
        Book Appointment
      </button>
    </div>
  )

  const ProviderListItem = ({ provider }: { provider: Provider }) => (
    <div className="bg-ds-card border border-ds-border rounded-lg p-4 hover:shadow-md transition-shadow flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-ds-muted animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-ds-foreground">{provider.name}</h3>
        <p className="text-sm text-ds-muted-foreground">{provider.specialty} · {provider.location}</p>
        <div className="flex items-center gap-3 mt-1">
          {showRating && (
            <span className="text-xs text-ds-muted-foreground">
              <span className="text-ds-warning">★</span> {provider.rating} ({provider.reviewCount})
            </span>
          )}
          {showAvailability && (
            <span className="text-xs text-ds-success">{provider.nextAvailability}</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {provider.insurance.slice(0, 2).map((ins) => (
          <span key={ins} className="text-xs px-2 py-0.5 rounded-full bg-ds-muted text-ds-muted-foreground">{ins}</span>
        ))}
        {provider.insurance.length > 2 && (
          <span className="text-xs text-ds-muted-foreground">+{provider.insurance.length - 2}</span>
        )}
      </div>
      <button className="px-4 py-2 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex-shrink-0">
        Book Appointment
      </button>
    </div>
  )

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ds-foreground mb-8">{heading}</h2>

        <div className="flex flex-wrap gap-2 mb-8">
          {filterOptions.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSpecialty === spec
                  ? 'bg-ds-primary text-ds-primary-foreground'
                  : 'bg-ds-muted text-ds-muted-foreground hover:text-ds-foreground'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>

        {layout === 'list' ? (
          <div className="space-y-3">
            {filteredProviders.map((provider) => (
              <ProviderListItem key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
