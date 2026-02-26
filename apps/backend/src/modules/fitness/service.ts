import { MedusaService } from "@medusajs/framework/utils"
import GymMembership from "./models/gym-membership"
import ClassSchedule from "./models/class-schedule"
import TrainerProfile from "./models/trainer-profile"
import ClassBooking from "./models/class-booking"
import WellnessPlan from "./models/wellness-plan"

class FitnessModuleService extends MedusaService({
  GymMembership,
  ClassSchedule,
  TrainerProfile,
  ClassBooking,
  WellnessPlan,
}) {
  async bookClass(classId: string, customerId: string): Promise<any> {
    const schedule = await this.retrieveClassSchedule(classId)
    const existingBookings = await this.listClassBookings({ schedule_id: classId }) as any
    const bookingList = Array.isArray(existingBookings) ? existingBookings : [existingBookings].filter(Boolean)
    if (bookingList.length >= (schedule.max_capacity || 20)) {
      throw new Error("Class is fully booked")
    }
    const alreadyBooked = bookingList.find((b: any) => b.customer_id === customerId && b.status === "booked")
    if (alreadyBooked) {
      throw new Error("You have already booked this class")
    }
    return await (this as any).createClassBookings({
      tenant_id: "default",
      schedule_id: classId,
      customer_id: customerId,
      status: "booked",
      booked_at: new Date(),
    })
  }

  async cancelBooking(bookingId: string): Promise<any> {
    const booking = await this.retrieveClassBooking(bookingId)
    if (booking.status === "cancelled") {
      throw new Error("Booking is already cancelled")
    }
    return await (this as any).updateClassBookings({
      id: bookingId,
      status: "cancelled",
      cancelled_at: new Date(),
    })
  }

  async getSchedule(trainerId: string, date: Date): Promise<any[]> {
    const schedules = await this.listClassSchedules({ instructor_id: trainerId }) as any
    const list = Array.isArray(schedules) ? schedules : [schedules].filter(Boolean)
    const targetDate = new Date(date).toDateString()
    return list.filter((s: any) => new Date(s.start_time).toDateString() === targetDate)
      .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }

  async trackAttendance(classId: string, customerId: string): Promise<any> {
    const bookings = await this.listClassBookings({
      schedule_id: classId,
      customer_id: customerId,
      status: "booked",
    }) as any
    const bookingList = Array.isArray(bookings) ? bookings : [bookings].filter(Boolean)
    if (bookingList.length === 0) {
      throw new Error("No booking found for this class")
    }
    return await (this as any).updateClassBookings({
      id: bookingList[0].id,
      status: "checked_in",
      checked_in_at: new Date(),
    })
  }

  async createMembership(customerId: string, data: {
    membershipType: string
    monthlyFee: number
    currencyCode?: string
    durationMonths?: number
  }): Promise<any> {
    if (!data.membershipType) {
      throw new Error("Membership type is required")
    }
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + (data.durationMonths || 12))

    return await (this as any).createGymMemberships({
      tenant_id: "default",
      customer_id: customerId,
      membership_type: data.membershipType,
      start_date: startDate,
      end_date: endDate,
      monthly_fee: data.monthlyFee,
      currency_code: data.currencyCode || "SAR",
      status: "active",
      auto_renew: true,
    })
  }

  async checkMembershipStatus(customerId: string): Promise<{
    active: boolean
    membership: any | null
    daysRemaining?: number
    expired?: boolean
  }> {
    const memberships = await this.listGymMemberships({ customer_id: customerId }) as any
    const list = Array.isArray(memberships) ? memberships : [memberships].filter(Boolean)

    if (list.length === 0) {
      return { active: false, membership: null }
    }

    const sorted = list.sort((a: any, b: any) =>
      new Date(b.end_date || b.created_at).getTime() - new Date(a.end_date || a.created_at).getTime()
    )
    const latest = sorted[0]
    const now = new Date()
    const endDate = latest.end_date ? new Date(latest.end_date) : null

    if (latest.status !== "active" || (endDate && endDate < now)) {
      return { active: false, membership: latest, expired: true, daysRemaining: 0 }
    }

    const daysRemaining = endDate
      ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : undefined

    return { active: true, membership: latest, daysRemaining }
  }

  async getClassAvailability(classScheduleId: string): Promise<{
    classScheduleId: string
    capacity: number
    booked: number
    available: number
    isFull: boolean
  }> {
    const schedule = await this.retrieveClassSchedule(classScheduleId)
    const capacity = schedule.max_capacity || 20

    const bookings = await this.listClassBookings({
      schedule_id: classScheduleId,
    }) as any
    const bookingList = Array.isArray(bookings) ? bookings : [bookings].filter(Boolean)
    const booked = bookingList.filter((b: any) => ["booked", "checked_in", "completed"].includes(b.status)).length

    return {
      classScheduleId,
      capacity,
      booked,
      available: Math.max(0, capacity - booked),
      isFull: booked >= capacity,
    }
  }

  async cancelClassBooking(bookingId: string, customerId: string): Promise<{
    bookingId: string
    status: string
    lateCancelFee: number
    refundable: boolean
  }> {
    const booking = await this.retrieveClassBooking(bookingId) as any

    if (booking.status === "cancelled") {
      throw new Error("Booking is already cancelled")
    }

    if (booking.customer_id !== customerId) {
      throw new Error("Only the booking owner can cancel this booking")
    }

    const schedule = await this.retrieveClassSchedule(booking.schedule_id) as any
    const classTime = new Date(schedule.start_time)
    const now = new Date()
    const hoursUntilClass = (classTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    let lateCancelFee = 0
    let refundable = true

    if (hoursUntilClass <= 2 && hoursUntilClass > 0) {
      lateCancelFee = 15
      refundable = false
    } else if (hoursUntilClass <= 0) {
      lateCancelFee = 25
      refundable = false
    }

    await (this as any).updateClassBookings({
      id: bookingId,
      status: "cancelled",
      cancelled_at: new Date(),
    })

    return { bookingId, status: "cancelled", lateCancelFee, refundable }
  }

  async recordWorkout(customerId: string, data: {
    exerciseType: string
    duration: number
    caloriesBurned?: number
    notes?: string
  }): Promise<any> {
    if (!data.exerciseType) {
      throw new Error("Exercise type is required")
    }
    if (!data.duration || data.duration <= 0) {
      throw new Error("Duration must be greater than zero")
    }

    return await (this as any).createWellnessPlans({
      tenant_id: "default",
      customer_id: customerId,
      plan_type: "workout_log",
      title: `${data.exerciseType} session`,
      description: data.notes || null,
      status: "active",
      metadata: {
        exercise_type: data.exerciseType,
        duration_minutes: data.duration,
        calories_burned: data.caloriesBurned || null,
        recorded_at: new Date(),
      },
    })
  }
}

export default FitnessModuleService
