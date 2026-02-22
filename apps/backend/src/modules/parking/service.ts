import { MedusaService } from "@medusajs/framework/utils"
import ParkingZone from "./models/parking-zone"
import ParkingSession from "./models/parking-session"
import ShuttleRoute from "./models/shuttle-route"
import RideRequest from "./models/ride-request"

class ParkingModuleService extends MedusaService({
  ParkingZone,
  ParkingSession,
  ShuttleRoute,
  RideRequest,
}) {
  /**
   * Find available parking spots in a zone for a given vehicle type.
   */
  async findAvailableSpots(zoneId: string, vehicleType: string): Promise<any[]> {
    const zone = await this.retrieveParkingZone(zoneId)
    const activeSessions = await this.listParkingSessions({
      zone_id: zoneId,
      status: "active",
    }) as any
    const sessionList = Array.isArray(activeSessions) ? activeSessions : [activeSessions].filter(Boolean)
    const totalCapacity = Number(zone.total_spots || 0)
    const occupied = sessionList.length
    const availableCount = Math.max(0, totalCapacity - occupied)
    return Array.from({ length: availableCount }, (_, i) => ({
      zoneId,
      spotNumber: occupied + i + 1,
      vehicleType,
      available: true,
    }))
  }

  /**
   * Reserve a parking spot for a vehicle with a specified duration in hours.
   */
  async reserveSpot(spotId: string, vehicleId: string, duration: number): Promise<any> {
    const fee = await this.calculateFee(spotId, duration)
    const session = await (this as any).createParkingSessions({
      zone_id: spotId,
      vehicle_id: vehicleId,
      status: "active",
      started_at: new Date(),
      duration_hours: duration,
      fee: fee.totalFee,
    })
    return session
  }

  /**
   * Calculate the parking fee for a spot based on duration in hours.
   */
  async calculateFee(spotId: string, duration: number): Promise<{ hourlyRate: number; totalFee: number }> {
    const zone = await this.retrieveParkingZone(spotId)
    const hourlyRate = Number(zone.hourly_rate || 5)
    const totalFee = hourlyRate * duration
    return { hourlyRate, totalFee }
  }

  /**
   * Release a parking spot by ending the active session.
   */
  async releaseSpot(spotId: string): Promise<any> {
    const sessions = await this.listParkingSessions({
      zone_id: spotId,
      status: "active",
    }) as any
    const sessionList = Array.isArray(sessions) ? sessions : [sessions].filter(Boolean)
    if (sessionList.length === 0) {
      throw new Error("No active session found for this spot")
    }
    return await (this as any).updateParkingSessions({
      id: sessionList[0].id,
      status: "completed",
      ended_at: new Date(),
    })
  }

  async checkIn(reservationId: string): Promise<any> {
    const session = await this.retrieveParkingSession(reservationId) as any

    if (session.status === "completed") {
      throw new Error("This session has already been completed")
    }

    if (session.status === "active" && session.checked_in_at) {
      throw new Error("Already checked in")
    }

    return await (this as any).updateParkingSessions({
      id: reservationId,
      status: "active",
      checked_in_at: new Date(),
      actual_start: new Date(),
    })
  }

  async checkOut(reservationId: string): Promise<{
    sessionId: string
    duration: number
    fee: number
    checkedInAt: Date
    checkedOutAt: Date
  }> {
    const session = await this.retrieveParkingSession(reservationId) as any

    if (session.status === "completed") {
      throw new Error("This session has already been completed")
    }

    if (session.status !== "active") {
      throw new Error("Session must be active to check out")
    }

    const checkedOutAt = new Date()
    const startTime = new Date(session.checked_in_at || session.started_at)
    const durationMs = checkedOutAt.getTime() - startTime.getTime()
    const durationHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)))

    const zone = await this.retrieveParkingZone(session.zone_id)
    const hourlyRate = Number(zone.hourly_rate || 5)
    const fee = Math.round(hourlyRate * durationHours * 100) / 100

    await (this as any).updateParkingSessions({
      id: reservationId,
      status: "completed",
      ended_at: checkedOutAt,
      actual_end: checkedOutAt,
      actual_fee: fee,
      actual_duration_hours: durationHours,
    })

    return {
      sessionId: reservationId,
      duration: durationHours,
      fee,
      checkedInAt: startTime,
      checkedOutAt,
    }
  }

  async getAvailableSpots(lotId: string, vehicleType?: string): Promise<{
    lotId: string
    totalSpots: number
    occupiedSpots: number
    availableSpots: number
    vehicleType: string | null
  }> {
    const zone = await this.retrieveParkingZone(lotId)
    const filters: Record<string, any> = { zone_id: lotId, status: "active" }
    if (vehicleType) {
      filters.vehicle_type = vehicleType
    }

    const activeSessions = await this.listParkingSessions(filters) as any
    const sessionList = Array.isArray(activeSessions) ? activeSessions : [activeSessions].filter(Boolean)
    const totalSpots = Number(zone.total_spots || 0)
    const occupiedSpots = sessionList.length
    const availableSpots = Math.max(0, totalSpots - occupiedSpots)

    return {
      lotId,
      totalSpots,
      occupiedSpots,
      availableSpots,
      vehicleType: vehicleType || null,
    }
  }

  async calculateParkingFee(entryTime: Date, exitTime: Date, rateType: string = "hourly"): Promise<{
    entryTime: Date
    exitTime: Date
    durationHours: number
    rateType: string
    rate: number
    totalFee: number
  }> {
    const entry = new Date(entryTime)
    const exit = new Date(exitTime)

    if (exit <= entry) {
      throw new Error("Exit time must be after entry time")
    }

    const durationMs = exit.getTime() - entry.getTime()
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60))
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24))

    const rates: Record<string, number> = {
      hourly: 5,
      daily: 30,
      monthly: 500,
    }

    const rate = rates[rateType] || rates.hourly
    let totalFee: number

    if (rateType === "hourly") {
      totalFee = Math.max(1, durationHours) * rate
    } else if (rateType === "daily") {
      totalFee = Math.max(1, durationDays) * rate
    } else if (rateType === "monthly") {
      const months = Math.max(1, Math.ceil(durationDays / 30))
      totalFee = months * rate
    } else {
      totalFee = Math.max(1, durationHours) * rates.hourly
    }

    return {
      entryTime: entry,
      exitTime: exit,
      durationHours,
      rateType,
      rate,
      totalFee: Math.round(totalFee * 100) / 100,
    }
  }

  async reserveSpotAdvanced(lotId: string, vehicleType: string, startTime: Date, duration: number): Promise<any> {
    if (duration <= 0) {
      throw new Error("Duration must be greater than zero")
    }

    const zone = await this.retrieveParkingZone(lotId) as any
    const totalSpots = Number(zone.total_spots || 0)

    const activeSessions = await this.listParkingSessions({ zone_id: lotId, status: "active" }) as any
    const sessionList = Array.isArray(activeSessions) ? activeSessions : [activeSessions].filter(Boolean)

    if (sessionList.length >= totalSpots) {
      throw new Error("No available parking spots in this lot")
    }

    const hourlyRate = Number(zone.hourly_rate || 5)
    const fee = Math.round(hourlyRate * duration * 100) / 100

    const session = await (this as any).createParkingSessions({
      zone_id: lotId,
      vehicle_type: vehicleType,
      status: "active",
      started_at: new Date(startTime),
      duration_hours: duration,
      fee,
      reserved_at: new Date(),
    })

    return session
  }

  async calculateDynamicFee(lotId: string, durationMinutes: number, vehicleType: string): Promise<{
    lotId: string
    durationMinutes: number
    vehicleType: string
    hourlyRate: number
    vehicleMultiplier: number
    totalFee: number
  }> {
    const zone = await this.retrieveParkingZone(lotId)
    const baseRate = Number(zone.hourly_rate || 5)

    const vehicleMultipliers: Record<string, number> = {
      motorcycle: 0.5,
      compact: 0.8,
      sedan: 1.0,
      suv: 1.3,
      truck: 1.5,
      van: 1.5,
      bus: 3.0,
    }

    const vehicleMultiplier = vehicleMultipliers[vehicleType] || 1.0
    const hours = Math.max(1, Math.ceil(durationMinutes / 60))
    const totalFee = Math.round(baseRate * vehicleMultiplier * hours * 100) / 100

    return {
      lotId,
      durationMinutes,
      vehicleType,
      hourlyRate: baseRate,
      vehicleMultiplier,
      totalFee,
    }
  }
}

export default ParkingModuleService
