import React, { useState } from 'react'

interface Lesson {
  title: string
  duration: string
  type: 'video' | 'text' | 'quiz'
  completed?: boolean
}

interface Module {
  title: string
  lessons: Lesson[]
  progress?: number
}

interface CourseCurriculumBlockProps {
  courseId?: string
  showProgress?: boolean
  expandAll?: boolean
  variant?: 'tree' | 'list' | 'cards'
}

const typeIcons: Record<string, string> = {
  video: '▶',
  text: '📄',
  quiz: '❓',
}

const placeholderModules: Module[] = [
  {
    title: 'Module 1: Getting Started',
    progress: 100,
    lessons: [
      { title: 'Welcome & Course Overview', duration: '5 min', type: 'video', completed: true },
      { title: 'Setting Up Your Environment', duration: '12 min', type: 'video', completed: true },
      { title: 'Core Concepts', duration: '8 min', type: 'text', completed: true },
      { title: 'Module 1 Quiz', duration: '5 min', type: 'quiz', completed: true },
    ],
  },
  {
    title: 'Module 2: Fundamentals',
    progress: 60,
    lessons: [
      { title: 'Basic Principles', duration: '15 min', type: 'video', completed: true },
      { title: 'Hands-on Exercise', duration: '20 min', type: 'text', completed: true },
      { title: 'Advanced Techniques', duration: '18 min', type: 'video', completed: false },
      { title: 'Best Practices Guide', duration: '10 min', type: 'text', completed: false },
      { title: 'Module 2 Quiz', duration: '10 min', type: 'quiz', completed: false },
    ],
  },
  {
    title: 'Module 3: Advanced Topics',
    progress: 0,
    lessons: [
      { title: 'Deep Dive: Architecture', duration: '25 min', type: 'video', completed: false },
      { title: 'Case Study Analysis', duration: '15 min', type: 'text', completed: false },
      { title: 'Performance Optimization', duration: '20 min', type: 'video', completed: false },
      { title: 'Final Assessment', duration: '15 min', type: 'quiz', completed: false },
    ],
  },
  {
    title: 'Module 4: Final Project',
    progress: 0,
    lessons: [
      { title: 'Project Requirements', duration: '10 min', type: 'text', completed: false },
      { title: 'Implementation Walkthrough', duration: '30 min', type: 'video', completed: false },
      { title: 'Final Submission', duration: '5 min', type: 'text', completed: false },
    ],
  },
]

export const CourseCurriculumBlock: React.FC<CourseCurriculumBlockProps> = ({
  courseId,
  showProgress = true,
  expandAll = false,
  variant = 'tree',
}) => {
  const [expandedModules, setExpandedModules] = useState<number[]>(
    expandAll ? placeholderModules.map((_, i) => i) : [0]
  )

  const toggleModule = (index: number) => {
    setExpandedModules((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const totalLessons = placeholderModules.reduce((sum, m) => sum + m.lessons.length, 0)
  const completedLessons = placeholderModules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.completed).length,
    0
  )
  const totalDuration = placeholderModules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + parseInt(l.duration), 0),
    0
  )

  if (variant === 'cards') {
    return (
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-ds-foreground mb-1">Course Curriculum</h2>
              <p className="text-sm text-ds-muted-foreground">{totalLessons} lessons · {totalDuration} min total</p>
            </div>
            <button className="px-6 py-3 bg-ds-primary text-ds-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Start Learning
            </button>
          </div>
          {showProgress && (
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-ds-muted-foreground">Overall Progress</span>
                <span className="font-medium text-ds-foreground">{completedLessons}/{totalLessons} lessons</span>
              </div>
              <div className="w-full bg-ds-muted rounded-full h-2">
                <div className="bg-ds-primary h-2 rounded-full transition-all" style={{ width: `${(completedLessons / totalLessons) * 100}%` }} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {placeholderModules.map((mod, i) => (
              <div key={i} className="bg-ds-card border border-ds-border rounded-lg p-6 hover:shadow-sm transition-shadow">
                <h3 className="font-semibold text-ds-foreground mb-2">{mod.title}</h3>
                <p className="text-sm text-ds-muted-foreground mb-3">{mod.lessons.length} lessons</p>
                {showProgress && mod.progress !== undefined && (
                  <div className="w-full bg-ds-muted rounded-full h-1.5 mb-3">
                    <div className="bg-ds-primary h-1.5 rounded-full transition-all" style={{ width: `${mod.progress}%` }} />
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {(mod.lessons || []).map((l, j) => (
                    <span key={j} className="text-xs text-ds-muted-foreground">{typeIcons[l.type]}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (variant === 'list') {
    return (
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-ds-foreground mb-1">Course Curriculum</h2>
              <p className="text-sm text-ds-muted-foreground">{totalLessons} lessons · {totalDuration} min total</p>
            </div>
            <button className="px-6 py-3 bg-ds-primary text-ds-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Start Learning
            </button>
          </div>
          <div className="space-y-2">
            {placeholderModules.flatMap((mod, mi) =>
              (mod.lessons || []).map((lesson, li) => (
                <div key={`${mi}-${li}`} className="flex items-center gap-3 p-3 rounded-lg bg-ds-card border border-ds-border">
                  <span className="text-lg">{typeIcons[lesson.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ds-foreground truncate">{lesson.title}</p>
                    <p className="text-xs text-ds-muted-foreground">{mod.title}</p>
                  </div>
                  <span className="text-xs text-ds-muted-foreground">{lesson.duration}</span>
                  {showProgress && lesson.completed && (
                    <span className="text-xs text-ds-success font-medium">✓</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-ds-foreground mb-1">Course Curriculum</h2>
            <p className="text-sm text-ds-muted-foreground">{totalLessons} lessons · {totalDuration} min total</p>
          </div>
          <button className="px-6 py-3 bg-ds-primary text-ds-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Start Learning
          </button>
        </div>

        {showProgress && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-ds-muted-foreground">Overall Progress</span>
              <span className="font-medium text-ds-foreground">{Math.round((completedLessons / totalLessons) * 100)}%</span>
            </div>
            <div className="w-full bg-ds-muted rounded-full h-2">
              <div className="bg-ds-primary h-2 rounded-full transition-all" style={{ width: `${(completedLessons / totalLessons) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="space-y-3">
          {placeholderModules.map((mod, i) => (
            <div key={i} className="bg-ds-card border border-ds-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleModule(i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-ds-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-ds-foreground">{mod.title}</h3>
                  <p className="text-xs text-ds-muted-foreground mt-0.5">{mod.lessons.length} lessons</p>
                </div>
                {showProgress && mod.progress !== undefined && (
                  <div className="w-20 me-4">
                    <div className="w-full bg-ds-muted rounded-full h-1.5">
                      <div className="bg-ds-primary h-1.5 rounded-full transition-all" style={{ width: `${mod.progress}%` }} />
                    </div>
                  </div>
                )}
                <span className="text-ds-muted-foreground text-sm">{expandedModules.includes(i) ? '▲' : '▼'}</span>
              </button>
              {expandedModules.includes(i) && (
                <div className="border-t border-ds-border">
                  {(mod.lessons || []).map((lesson, j) => (
                    <div key={j} className="flex items-center gap-3 px-4 py-3 border-b border-ds-border last:border-0 hover:bg-ds-muted/30 transition-colors">
                      <span className="text-base">{typeIcons[lesson.type]}</span>
                      <span className="flex-1 text-sm text-ds-foreground">{lesson.title}</span>
                      <span className="text-xs text-ds-muted-foreground">{lesson.duration}</span>
                      {showProgress && lesson.completed && (
                        <span className="text-xs text-ds-success font-medium">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
