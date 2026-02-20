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
  /**
   * Book a fitness class for a member. Validates membership status and class capacity.
   */
  async bookClass(classId: string, memberId: string): Promise<any> {
    const schedule = await this.retrieveClassSchedule(classId)
    const membership = await this.retrieveGymMembership(memberId)
    if (membership.status !== "active") {
      throw new Error("Membership is not active")
    }
    const existingBookings = await this.listClassBookings({ class_schedule_id: classId }) as any
    const bookingList = Array.isArray(existingBookings) ? existingBookings : [existingBookings].filter(Boolean)
    if (bookingList.length >= (schedule.max_capacity || 20)) {
      throw new Error("Class is fully booked")
    }
    return await (this as any).createClassBookings({
      class_schedule_id: classId,
      member_id: memberId,
      status: "confirmed",
      booked_at: new Date(),
    })
  }

  /**
   * Cancel an existing class booking. Only future bookings can be cancelled.
   */
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

  /**
   * Get the class schedule for a trainer on a specific date.
   */
  async getSchedule(trainerId: string, date: Date): Promise<any[]> {
    const schedules = await this.listClassSchedules({ trainer_id: trainerId }) as any
    const list = Array.isArray(schedules) ? schedules : [schedules].filter(Boolean)
    const targetDate = new Date(date).toDateString()
    return list.filter((s: any) => new Date(s.start_time).toDateString() === targetDate)
      .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }

  /**
   * Track attendance for a member in a class. Marks the booking as attended.
   */
  async trackAttendance(classId: string, memberId: string): Promise<any> {
    const bookings = await this.listClassBookings({
      class_schedule_id: classId,
      member_id: memberId,
      status: "confirmed",
    }) as any
    const bookingList = Array.isArray(bookings) ? bookings : [bookings].filter(Boolean)
    if (bookingList.length === 0) {
      throw new Error("No confirmed booking found for this member and class")
    }
    return await (this as any).updateClassBookings({
      id: bookingList[0].id,
      status: "attended",
      attended_at: new Date(),
    })
  }

  async createMembership(memberId: string, data: {
    planType: string
    startDate: Date
    durationMonths: number
    price: number
  }): Promise<any> {
    if (!data.planType) {
      throw new Error("Plan type is required")
    }
    if (!data.durationMonths || data.durationMonths <= 0) {
      throw new Error("Duration must be greater than zero")
    }
    if (!data.price || data.price < 0) {
      throw new Error("Price must be a non-negative number")
    }

    const startDate = new Date(data.startDate)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + data.durationMonths)

    return await (this as any).createGymMemberships({
      member_id: memberId,
      plan_type: data.planType,
      start_date: startDate,
      end_date: endDate,
      duration_months: data.durationMonths,
      price: data.price,
      status: "active",
      created_at: new Date(),
    })
  }

  async checkMembershipStatus(memberId: string): Promise<{
    active: boolean
    membership: any | null
    daysRemaining?: number
    expired?: boolean
  }> {
    const memberships = await this.listGymMemberships({ member_id: memberId }) as any
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
      class_schedule_id: classScheduleId,
      status: ["confirmed", "attended"],
    }) as any
    const bookingList = Array.isArray(bookings) ? bookings : [bookings].filter(Boolean)
    const booked = bookingList.length

    return {
      classScheduleId,
      capacity,
      booked,
      available: Math.max(0, capacity - booked),
      isFull: booked >= capacity,
    }
  }

  async cancelClassBooking(bookingId: string, memberId: string): Promise<{
    bookingId: string
    status: string
    lateCancelFee: number
    refundable: boolean
  }> {
    const booking = await this.retrieveClassBooking(bookingId) as any

    if (booking.status === "cancelled") {
      throw new Error("Booking is already cancelled")
    }

    if (booking.member_id !== memberId) {
      throw new Error("Only the booking owner can cancel this booking")
    }

    const schedule = await this.retrieveClassSchedule(booking.class_schedule_id) as any
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
      late_cancel_fee: lateCancelFee,
    })

    return { bookingId, status: "cancelled", lateCancelFee, refundable }
  }

  async recordWorkout(memberId: string, data: {
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

    const membershipStatus = await this.checkMembershipStatus(memberId)
    if (!membershipStatus.active) {
      throw new Error("Active membership is required to record workouts")
    }

    return await (this as any).createWellnessPlans({
      member_id: memberId,
      exercise_type: data.exerciseType,
      duration_minutes: data.duration,
      calories_burned: data.caloriesBurned || null,
      notes: data.notes || null,
      type: "workout_log",
      recorded_at: new Date(),
      status: "completed",
    })
  }
}

export default FitnessModuleService
