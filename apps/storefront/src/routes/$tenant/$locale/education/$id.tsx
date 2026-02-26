// @ts-nocheck
import { useState } from "react"
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { useToast } from "@/components/ui/toast"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { CourseCurriculumBlock } from '@/components/blocks/course-curriculum-block'
import { ReviewListBlock } from '@/components/blocks/review-list-block'

function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {})
  return { ...meta, ...item,
    thumbnail: item.thumbnail || item.image_url || item.photo_url || item.banner_url || item.logo_url || meta.thumbnail || (meta.images && meta.images[0]) || null,
    images: meta.images || [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: item.price ?? meta.price ?? null,
    rating: item.rating ?? item.avg_rating ?? meta.rating ?? null,
    review_count: item.review_count ?? meta.review_count ?? null,
    location: item.location || item.city || item.address || meta.location || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/education/$id")({
  component: EducationDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Course Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/education/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function EducationDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const toast = useToast()
  const [enrollLoading, setEnrollLoading] = useState(false)

  const loaderData = Route.useLoaderData()
  const course = loaderData?.item

  const handleEnroll = async () => {
    setEnrollLoading(true)
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetch(`${baseUrl}/store/education/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": getMedusaPublishableKey() },
        credentials: "include",
        body: JSON.stringify({ course_id: id })
      })
      if (resp.ok) toast.success("Enrollment request submitted!")
      else toast.error("Something went wrong. Please try again.")
    } catch { toast.error("Network error. Please try again.") }
    finally { setEnrollLoading(false) }
  }

  const handleWishlist = () => {
    toast.success("Added to your wishlist!")
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Course Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This course or program may have been removed or is no longer available.</p>
            <Link to={`${prefix}/education` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/education` as any} className="hover:text-ds-foreground transition-colors">Education</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{course.title || course.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {course.thumbnail || course.image ? (
                <img loading="lazy" src={course.thumbnail || course.image} alt={course.title || course.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
              {course.level && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary text-ds-primary-foreground">{course.level}</span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{course.title || course.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {course.instructor && (
                  <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span>{course.instructor}</span>
                  </div>
                )}
                {course.duration && (
                  <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{course.duration}</span>
                  </div>
                )}
                {course.rating && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-ds-warning" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span className="text-sm font-medium text-ds-foreground">{course.rating}</span>
                    {course.student_count && <span className="text-sm text-ds-muted-foreground">({course.student_count} students)</span>}
                  </div>
                )}
                {course.category && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-ds-muted text-ds-muted-foreground">{course.category}</span>
                )}
              </div>
            </div>

            {course.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">About This Course</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{course.description}</p>
              </div>
            )}

            {course.what_you_learn && course.what_you_learn.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">What You'll Learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {course.what_you_learn.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4 mt-0.5 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(course.curriculum || course.syllabus) && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Curriculum</h2>
                <div className="space-y-3">
                  {(course.curriculum || course.syllabus).map((section: any, idx: number) => (
                    <div key={idx} className="border border-ds-border rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-ds-muted/30">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-ds-foreground text-sm">
                            {typeof section === "string" ? section : section.title || section.name}
                          </h3>
                          {section.duration && (
                            <span className="text-xs text-ds-muted-foreground">{section.duration}</span>
                          )}
                        </div>
                      </div>
                      {section.lessons && (
                        <div className="px-4 py-2 space-y-1">
                          {section.lessons.map((lesson: any, lIdx: number) => (
                            <div key={lIdx} className="flex items-center justify-between py-1.5 text-sm">
                              <span className="text-ds-muted-foreground">{typeof lesson === "string" ? lesson : lesson.title}</span>
                              {lesson.duration && <span className="text-xs text-ds-muted-foreground">{lesson.duration}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {course.reviews && course.reviews.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Student Reviews</h2>
                <div className="space-y-4">
                  {course.reviews.map((review: any, idx: number) => (
                    <div key={idx} className="pb-4 border-b border-ds-border last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? "text-ds-warning" : "text-ds-muted"}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-ds-foreground">{review.author}</span>
                      </div>
                      <p className="text-sm text-ds-muted-foreground">{review.comment || review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                <p className="text-3xl font-bold text-ds-foreground text-center">
                  {course.price != null ? (course.price === 0 ? "Free" : `$${Number(course.price || 0).toLocaleString()}`) : t(locale, 'verticals.contact_pricing')}
                </p>

                <button onClick={handleEnroll} disabled={enrollLoading} className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors disabled:opacity-50">
                  {enrollLoading ? "Enrolling..." : "Enroll Now"}
                </button>

                <button onClick={handleWishlist} className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors">
                  Add to Wishlist
                </button>

                <div className="space-y-3 pt-2 border-t border-ds-border text-sm">
                  {course.duration && (
                    <div className="flex items-center gap-2 text-ds-muted-foreground">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>{course.duration}</span>
                    </div>
                  )}
                  {course.level && (
                    <div className="flex items-center gap-2 text-ds-muted-foreground">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span>{course.level}</span>
                    </div>
                  )}
                  {course.language && (
                    <div className="flex items-center gap-2 text-ds-muted-foreground">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                      <span>{course.language}</span>
                    </div>
                  )}
                  {course.certificate && (
                    <div className="flex items-center gap-2 text-ds-muted-foreground">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                      <span>{t(locale, "education.certificate_of_completion", "Certificate of Completion")}</span>
                    </div>
                  )}
                </div>
              </div>

              {course.instructor_info && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Instructor</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-ds-primary/10 rounded-full flex items-center justify-center text-ds-primary font-semibold">
                      {(course.instructor_info.name || course.instructor || "I").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-ds-foreground">{course.instructor_info.name || course.instructor}</p>
                      {course.instructor_info.title && (
                        <p className="text-sm text-ds-muted-foreground">{course.instructor_info.title}</p>
                      )}
                    </div>
                  </div>
                  {course.instructor_info.bio && (
                    <p className="text-sm text-ds-muted-foreground mt-3">{course.instructor_info.bio}</p>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseCurriculumBlock courseId={course.id} />
        <ReviewListBlock productId={course.id} />
      </div>
    </div>
  )
}
