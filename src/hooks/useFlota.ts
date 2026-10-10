import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useWalletContext } from "@/contexts/WalletContext";

/** Gestión de Flota: vehículos, choferes, viajes, combustible, seguros. v2 · P3 */
export type VehicleStatus = "activo" | "en_mantenimiento" | "fuera_servicio" | "vendido";
export type FuelType = "nafta" | "diesel" | "gnc" | "electrico" | "hibrido";

export interface Vehicle {
  id: string;
  code: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  fuelType: FuelType;
  status: VehicleStatus;
  purchaseDate: string;
  purchasePrice: number;
  currentKm: number;
  insuranceExpiry: string;
  technicalReviewExpiry: string;
  notes?: string;
  createdAt: string;
}

export interface VehicleTrip {
  id: string;
  vehicleId: string;
  date: string;
  driver: string;
  origin: string;
  destination: string;
  distanceKm: number;
  fuelCost: number;
  tolls: number;
  purpose: string;
  notes?: string;
  createdAt: string;
}

const VEHICLES_KEY = "cap-finanzas-flota-vehiculos";
const TRIPS_KEY = "cap-finanzas-flota-viajes";

function scoped(base: string, profile?: string, wallet?: string) {
  if (!profile || profile === "profile-default") return `${base}${wallet && wallet !== "wallet-default" ? `-${wallet}` : ""}`;
  return wallet && wallet !== "wallet-default" ? `${base}-${profile}-${wallet}` : `${base}-${profile}-default`;
}

function two(n: number) { return Math.round(n * 100) / 100; }

export function useFlota() {
  const { activeProfileId, activeWalletId } = useWalletContext();
  const vehiclesKey = scoped(VEHICLES_KEY, activeProfileId, activeWalletId);
  const tripsKey = scoped(TRIPS_KEY, activeProfileId, activeWalletId);

  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>(vehiclesKey, []);
  const [trips, setTrips] = useLocalStorage<VehicleTrip[]>(tripsKey, []);

  const addVehicle = useCallback((data: Omit<Vehicle, "id" | "createdAt">) => {
    const v = { ...data, id: `veh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setVehicles(v => [...v, v]);
    return v;
  }, [setVehicles]);

  const updateVehicle = useCallback((id: string, patch: Partial<Vehicle>) => {
    setVehicles(v => v.map(x => x.id === id ? { ...x, ...patch } : x));
  }, [setVehicles]);

  const deleteVehicle = useCallback((id: string) => {
    setVehicles(v => v.filter(x => x.id !== id));
    setTrips(v => v.filter(t => t.vehicleId !== id));
  }, [setVehicles, setTrips]);

  const addTrip = useCallback((data: Omit<VehicleTrip, "id" | "createdAt">) => {
    const t = { ...data, id: `trp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    setTrips(v => [...v, t]);
    return t;
  }, [setTrips]);

  const deleteTrip = useCallback((id: string) => {
    setTrips(v => v.filter(t => t.id !== id));
  }, [setTrips]);

  const stats = useMemo(() => {
    let totalDistance = 0, totalFuel = 0, totalTolls = 0;
    for (const t of trips) { totalDistance += t.distanceKm; totalFuel += t.fuelCost; totalTolls += t.tolls; }
    return {
      totalDistance: Math.round(totalDistance), totalFuel: two(totalFuel), totalTolls: two(totalTolls),
      tripCount: trips.length, activeVehicles: vehicles.filter(v => v.status === "activo").length,
      totalVehicles: vehicles.length,
    };
  }, [trips, vehicles]);

  const byVehicle = useMemo(() => {
    const map = new Map<string, { trips: number; distance: number; cost: number }>();
    for (const t of trips) {
      const s = map.get(t.vehicleId);
      if (s) { s.trips++; s.distance += t.distanceKm; s.cost += t.fuelCost + t.tolls; }
      else map.set(t.vehicleId, { trips: 1, distance: t.distanceKm, cost: t.fuelCost + t.tolls });
    }
    return map;
  }, [trips]);

  return { vehicles, addVehicle, updateVehicle, deleteVehicle, trips, addTrip, deleteTrip, stats, byVehicle };
}
