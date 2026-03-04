"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import gsap from "gsap";
import { useBookingStore } from "@/stores/booking-store";
import { StaffCard } from "./staff-card";
import { Skeleton } from "@/components/ui/skeleton";

interface StaffMember {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  specialty: string | null;
}

export function StepStaff({ slug }: { slug: string }) {
  const { serviceId, staffId, setStaff, setStep } = useBookingStore();
  const { data: staffList, isLoading } = useSWR<StaffMember[]>(
    serviceId ? `/api/businesses/${slug}/staff?serviceId=${serviceId}` : null
  );
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current || isLoading) return;
    gsap.fromTo(
      gridRef.current.querySelectorAll(".staff-card-item"),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power3.out" }
    );
  }, [isLoading, staffList]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!staffList || staffList.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay profesionales disponibles para este servicio.</p>;
  }

  const handleSelect = (id: string, name: string) => {
    setStaff(id, name);
    setStep(2);
  };

  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-1">Elegir profesional</h2>
      <p className="text-sm text-muted-foreground mb-6">Selecciona quien te atendera</p>

      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* "Any professional" option */}
        {staffList.length > 1 && (
          <div className="staff-card-item">
            <StaffCard
              id="any"
              name="Cualquier profesional"
              image={null}
              specialty={null}
              bio="Te asignamos al primer profesional disponible"
              isAny
              selected={staffId === staffList[0].id && staffId !== null}
              onClick={() => handleSelect(staffList[0].id, staffList[0].name)}
            />
          </div>
        )}

        {staffList.map((member) => (
          <div key={member.id} className="staff-card-item">
            <StaffCard
              id={member.id}
              name={member.name}
              image={member.image}
              specialty={member.specialty}
              bio={member.bio}
              selected={staffId === member.id}
              onClick={() => handleSelect(member.id, member.name)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
