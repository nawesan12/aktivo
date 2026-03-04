import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface BookingState {
  step: number;
  businessId: string | null;
  businessSlug: string | null;
  serviceId: string | null;
  serviceName: string | null;
  serviceDuration: number | null;
  servicePrice: number | null;
  staffId: string | null;
  staffName: string | null;
  date: string | null; // ISO string
  time: string | null; // "HH:mm"
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  notes: string | null;

  setStep: (step: number) => void;
  setBusiness: (id: string, slug: string) => void;
  setService: (id: string, name: string, duration: number, price: number) => void;
  setStaff: (id: string, name: string) => void;
  setDateTime: (date: string, time: string) => void;
  setGuestInfo: (name: string, phone: string, email?: string) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
}

const initialState = {
  step: 0,
  businessId: null,
  businessSlug: null,
  serviceId: null,
  serviceName: null,
  serviceDuration: null,
  servicePrice: null,
  staffId: null,
  staffName: null,
  date: null,
  time: null,
  guestName: null,
  guestPhone: null,
  guestEmail: null,
  notes: null,
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      ...initialState,
      setStep: (step) => set({ step }),
      setBusiness: (id, slug) => set({ businessId: id, businessSlug: slug }),
      setService: (id, name, duration, price) =>
        set({
          serviceId: id,
          serviceName: name,
          serviceDuration: duration,
          servicePrice: price,
        }),
      setStaff: (id, name) => set({ staffId: id, staffName: name }),
      setDateTime: (date, time) => set({ date, time }),
      setGuestInfo: (name, phone, email) =>
        set({ guestName: name, guestPhone: phone, guestEmail: email || null }),
      setNotes: (notes) => set({ notes }),
      reset: () => set(initialState),
    }),
    {
      name: "aktivo-booking",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
