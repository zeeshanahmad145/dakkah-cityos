import React, { useState } from 'react'

interface Session {
  id: string
  title: string
  time: string
  endTime: string
  speaker?: string
  room?: string
  track?: string
  description?: string
}

interface EventDay {
  label: string
  date: string
  sessions: Session[]
}

interface EventScheduleBlockProps {
  eventId?: string
  view?: 'timeline' | 'grid' | 'agenda'
  showSpeakers?: boolean
  allowBookmark?: boolean
  days?: EventDay[]
}

const defaultDays: EventDay[] = [
  {
    label: 'Day 1',
    date: 'March 15, 2026',
    sessions: [
      { id: '1', title: 'Opening Keynote', time: '09:00', endTime: '10:00', speaker: 'Dr. Sarah Chen', room: 'Main Hall', track: 'General', description: 'Welcome and vision for the future' },
      { id: '2', title: 'Building Scalable Systems', time: '10:30', endTime: '11:30', speaker: 'James Wilson', room: 'Room A', track: 'Engineering', description: 'Architecture patterns for growth' },
      { id: '3', title: 'Design Thinking Workshop', time: '10:30', endTime: '12:00', speaker: 'Maria Garcia', room: 'Room B', track: 'Design', description: 'Hands-on design sprint' },
      { id: '4', title: 'Lunch Break', time: '12:00', endTime: '13:00', room: 'Atrium', track: 'General' },
      { id: '5', title: 'Panel: Future of AI', time: '13:00', endTime: '14:00', speaker: 'Multiple Speakers', room: 'Main Hall', track: 'AI', description: 'Expert panel discussion' },
      { id: '6', title: 'Networking Session', time: '14:30', endTime: '15:30', room: 'Lounge', track: 'General' },
    ],
  },
  {
    label: 'Day 2',
    date: 'March 16, 2026',
    sessions: [
      { id: '7', title: 'Product Strategy', time: '09:00', endTime: '10:00', speaker: 'Alex Thompson', room: 'Main Hall', track: 'Product', description: 'From idea to market fit' },
      { id: '8', title: 'DevOps Deep Dive', time: '10:30', endTime: '11:30', speaker: 'Priya Patel', room: 'Room A', track: 'Engineering', description: 'CI/CD best practices' },
      { id: '9', title: 'UX Research Methods', time: '10:30', endTime: '11:30', speaker: 'Tom Roberts', room: 'Room B', track: 'Design', description: 'User research techniques' },
      { id: '10', title: 'Closing Keynote', time: '14:00', endTime: '15:00', speaker: 'Dr. Sarah Chen', room: 'Main Hall', track: 'General', description: 'Wrapping up and next steps' },
    ],
  },
]

const trackColors: Record<string, string> = {
  General: 'bg-ds-muted text-ds-muted-foreground',
  Engineering: 'bg-ds-info/15 text-ds-info',
  Design: 'bg-ds-primary/15 text-ds-primary',
  AI: 'bg-ds-success/15 text-ds-success',
  Product: 'bg-ds-warning/15 text-ds-warning',
}

export const EventScheduleBlock: React.FC<EventScheduleBlockProps> = ({
  eventId,
  view = 'timeline',
  showSpeakers = true,
  allowBookmark = true,
  days = defaultDays,
}) => {
  const [activeDay, setActiveDay] = useState(0)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  const currentDay = days[activeDay]

  const SessionCard = ({ session }: { session: Session }) => (
    <div className="bg-ds-card border border-ds-border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trackColors[session.track || 'General']}`}>
              {session.track}
            </span>
            {session.room && (
              <span className="text-xs text-ds-muted-foreground">{session.room}</span>
            )}
          </div>
          <h4 className="font-semibold text-ds-foreground">{session.title}</h4>
        </div>
        {allowBookmark && (
          <button
            onClick={() => toggleBookmark(session.id)}
            className="text-lg hover:scale-110 transition-transform"
          >
            {bookmarkedIds.includes(session.id) ? '★' : '☆'}
          </button>
        )}
      </div>
      <p className="text-sm text-ds-muted-foreground mb-2">{session.time} - {session.endTime}</p>
      {session.description && (
        <p className="text-sm text-ds-muted-foreground mb-3">{session.description}</p>
      )}
      <div className="flex items-center justify-between">
        {showSpeakers && session.speaker && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-ds-muted animate-pulse" />
            <span className="text-sm text-ds-foreground">{session.speaker}</span>
          </div>
        )}
        <button className="text-sm px-3 py-1.5 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
          Register
        </button>
      </div>
    </div>
  )

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ds-foreground mb-2">Event Schedule</h2>
        <p className="text-ds-muted-foreground mb-8">Browse sessions and plan your schedule</p>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {days.map((day, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeDay === i
                  ? 'bg-ds-primary text-ds-primary-foreground'
                  : 'bg-ds-muted text-ds-muted-foreground hover:text-ds-foreground'
              }`}
            >
              {day.label} — {day.date}
            </button>
          ))}
        </div>

        {view === 'timeline' && (
          <div className="relative">
            <div className="absolute start-4 md:start-8 top-0 bottom-0 w-0.5 bg-ds-border" />
            <div className="space-y-6">
              {(currentDay?.sessions || []).map((session) => (
                <div key={session.id} className="relative ps-12 md:ps-20">
                  <div className="absolute start-3 md:start-7 top-4 w-3 h-3 rounded-full bg-ds-primary border-2 border-ds-background" />
                  <div className="text-sm font-medium text-ds-muted-foreground mb-2">{session.time}</div>
                  <SessionCard session={session} />
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(currentDay?.sessions || []).map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}

        {view === 'agenda' && (
          <div className="space-y-3">
            {(currentDay?.sessions || []).map((session) => (
              <div key={session.id} className="flex gap-4 bg-ds-card border border-ds-border rounded-lg p-4">
                <div className="w-20 flex-shrink-0 text-center">
                  <p className="text-sm font-semibold text-ds-foreground">{session.time}</p>
                  <p className="text-xs text-ds-muted-foreground">{session.endTime}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-ds-foreground">{session.title}</h4>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trackColors[session.track || 'General']}`}>
                      {session.track}
                    </span>
                  </div>
                  {session.description && (
                    <p className="text-sm text-ds-muted-foreground mb-2">{session.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-ds-muted-foreground">
                    {showSpeakers && session.speaker && <span>{session.speaker}</span>}
                    {session.room && <span>{session.room}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {allowBookmark && (
                    <button onClick={() => toggleBookmark(session.id)} className="text-lg">
                      {bookmarkedIds.includes(session.id) ? '★' : '☆'}
                    </button>
                  )}
                  <button className="text-sm px-3 py-1.5 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
                    Register
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
