import React, { useState } from "react"

interface VehicleListingBlockProps {
  heading?: string
  vehicleType?: string
  layout?: "grid" | "list" | "detailed"
  showComparison?: boolean
}

interface Vehicle {
  id: string
  title: string
  make: string
  model: string
  year: number
  price: string
  mileage: string
  fuelType: string
  transmission: string
  engine: string
  color: string
}

const placeholderVehicles: Vehicle[] = [
  {
    id: "1",
    title: "2024 Tesla Model 3",
    make: "Tesla",
    model: "Model 3",
    year: 2024,
    price: "$42,990",
    mileage: "1,200 mi",
    fuelType: "Electric",
    transmission: "Automatic",
    engine: "Dual Motor",
    color: "White",
  },
  {
    id: "2",
    title: "2023 Toyota Camry",
    make: "Toyota",
    model: "Camry",
    year: 2023,
    price: "$28,500",
    mileage: "15,400 mi",
    fuelType: "Hybrid",
    transmission: "CVT",
    engine: "2.5L 4-Cyl",
    color: "Silver",
  },
  {
    id: "3",
    title: "2024 BMW X5",
    make: "BMW",
    model: "X5",
    year: 2024,
    price: "$65,900",
    mileage: "3,200 mi",
    fuelType: "Gasoline",
    transmission: "Automatic",
    engine: "3.0L Turbo I6",
    color: "Black",
  },
  {
    id: "4",
    title: "2023 Honda Civic",
    make: "Honda",
    model: "Civic",
    year: 2023,
    price: "$24,800",
    mileage: "22,100 mi",
    fuelType: "Gasoline",
    transmission: "CVT",
    engine: "1.5L Turbo",
    color: "Blue",
  },
  {
    id: "5",
    title: "2024 Ford F-150",
    make: "Ford",
    model: "F-150",
    year: 2024,
    price: "$55,200",
    mileage: "8,500 mi",
    fuelType: "Gasoline",
    transmission: "Automatic",
    engine: "3.5L EcoBoost V6",
    color: "Red",
  },
  {
    id: "6",
    title: "2023 Mercedes C-Class",
    make: "Mercedes",
    model: "C-Class",
    year: 2023,
    price: "$48,300",
    mileage: "11,800 mi",
    fuelType: "Gasoline",
    transmission: "Automatic",
    engine: "2.0L Turbo I4",
    color: "Gray",
  },
]

export const VehicleListingBlock: React.FC<VehicleListingBlockProps> = ({
  heading = "Vehicle Listings",
  vehicleType,
  layout: initialLayout = "grid",
  showComparison = false,
}) => {
  const [activeLayout, setActiveLayout] = useState(initialLayout)
  const [selectedMake, setSelectedMake] = useState("All")
  const [compareIds, setCompareIds] = useState<string[]>([])

  const makes = [
    "All",
    ...Array.from(new Set(placeholderVehicles.map((v) => v.make))),
  ]

  const filteredVehicles =
    selectedMake === "All"
      ? placeholderVehicles
      : placeholderVehicles.filter((v) => v.make === selectedMake)

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => (
    <div className="bg-ds-card border border-ds-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video bg-ds-muted animate-pulse relative">
        {showComparison && (
          <label className="absolute top-2 end-2 flex items-center gap-1 bg-ds-background/80 rounded px-2 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={compareIds.includes(vehicle.id)}
              onChange={() => toggleCompare(vehicle.id)}
              className="rounded"
            />
            <span className="text-xs text-ds-foreground">Compare</span>
          </label>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-ds-muted text-ds-muted-foreground">
            {vehicle.fuelType}
          </span>
          <span className="text-lg font-bold text-ds-foreground">
            {vehicle.price}
          </span>
        </div>
        <h3 className="font-semibold text-ds-foreground mb-2">
          {vehicle.title}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-sm text-ds-muted-foreground">
          <span>{vehicle.year}</span>
          <span>·</span>
          <span>{vehicle.mileage}</span>
          <span>·</span>
          <span>{vehicle.transmission}</span>
        </div>
      </div>
    </div>
  )

  const VehicleListItem = ({ vehicle }: { vehicle: Vehicle }) => (
    <div className="bg-ds-card border border-ds-border rounded-lg overflow-hidden hover:shadow-md transition-shadow flex">
      <div className="w-48 md:w-64 bg-ds-muted animate-pulse flex-shrink-0 relative">
        {showComparison && (
          <label className="absolute top-2 start-2 flex items-center gap-1 bg-ds-background/80 rounded px-2 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={compareIds.includes(vehicle.id)}
              onChange={() => toggleCompare(vehicle.id)}
              className="rounded"
            />
            <span className="text-xs text-ds-foreground">Compare</span>
          </label>
        )}
      </div>
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-ds-foreground text-lg">
            {vehicle.title}
          </h3>
          <span className="text-xl font-bold text-ds-foreground">
            {vehicle.price}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-ds-muted-foreground">
          <span>{vehicle.year}</span>
          <span>·</span>
          <span>{vehicle.mileage}</span>
          <span>·</span>
          <span>{vehicle.fuelType}</span>
          <span>·</span>
          <span>{vehicle.transmission}</span>
          <span>·</span>
          <span>{vehicle.engine}</span>
        </div>
      </div>
    </div>
  )

  const compareVehicles = placeholderVehicles.filter((v) =>
    compareIds.includes(v.id),
  )

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ds-foreground">
            {heading}
          </h2>
          <div className="flex items-center gap-2">
            {(["grid", "list"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setActiveLayout(l)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeLayout === l
                    ? "bg-ds-primary text-ds-primary-foreground"
                    : "bg-ds-muted text-ds-muted-foreground hover:text-ds-foreground"
                }`}
              >
                {l === "grid" ? "Grid" : "List"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {makes.map((make) => (
            <button
              key={make}
              onClick={() => setSelectedMake(make)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMake === make
                  ? "bg-ds-primary text-ds-primary-foreground"
                  : "bg-ds-muted text-ds-muted-foreground hover:text-ds-foreground"
              }`}
            >
              {make}
            </button>
          ))}
        </div>

        {activeLayout === "list" ? (
          <div className="flex flex-col gap-4">
            {filteredVehicles.map((vehicle) => (
              <VehicleListItem key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}

        {showComparison && compareVehicles.length >= 2 && (
          <div className="mt-8 bg-ds-card border border-ds-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-ds-border">
              <h3 className="font-semibold text-ds-foreground">
                Compare Vehicles ({compareVehicles.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ds-border">
                    <th className="text-left px-4 py-2 text-ds-muted-foreground font-medium">
                      Spec
                    </th>
                    {compareVehicles.map((v) => (
                      <th
                        key={v.id}
                        className="text-center px-4 py-2 text-ds-foreground font-medium"
                      >
                        {v.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    "price",
                    "year",
                    "mileage",
                    "fuelType",
                    "transmission",
                    "engine",
                    "color",
                  ].map((spec) => (
                    <tr
                      key={spec}
                      className="border-b border-ds-border last:border-0"
                    >
                      <td className="px-4 py-2 text-ds-muted-foreground capitalize">
                        {spec.replace(/([A-Z])/g, " $1")}
                      </td>
                      {compareVehicles.map((v) => (
                        <td
                          key={v.id}
                          className="px-4 py-2 text-center text-ds-foreground"
                        >
                          {String((v as any)[spec])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
