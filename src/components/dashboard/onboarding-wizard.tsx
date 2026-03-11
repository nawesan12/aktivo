"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Loader2, Check, ArrowRight, SkipForward } from "lucide-react";
import { toast } from "sonner";

interface OnboardingWizardProps {
  businessName: string;
  businessId: string;
}

const steps = [
  { title: "Perfil del negocio", desc: "Contanos sobre tu negocio" },
  { title: "Primer servicio", desc: "Agrega un servicio que ofrezcas" },
  { title: "Tu equipo", desc: "Agrega al menos un profesional" },
  { title: "Listo!", desc: "Tu negocio esta configurado" },
];

export function OnboardingWizard({ businessName, businessId }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Step 1: Profile
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Step 2: Service
  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [savingService, setSavingService] = useState(false);
  const [createdServiceId, setCreatedServiceId] = useState<string | null>(null);

  // Step 3: Staff
  const [staffName, setStaffName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [savingStaff, setSavingStaff] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, x: 40 },
        { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [step]);

  function markSeen() {
    try { localStorage.setItem(`jiku_onboarding_${businessId}`, "1"); } catch {}
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/panel/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business: { description, phone } }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast.success("Perfil guardado");
      setStep(1);
    } catch {
      toast.error("Error al guardar el perfil");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveService() {
    if (!serviceName.trim()) { toast.error("Nombre del servicio requerido"); return; }
    setSavingService(true);
    try {
      const res = await fetch("/api/panel/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: serviceName, duration, price, isActive: true }),
      });
      if (!res.ok) throw new Error("Error al crear servicio");
      const data = await res.json();
      setCreatedServiceId(data.id);
      toast.success("Servicio creado");
      setStep(2);
    } catch {
      toast.error("Error al crear el servicio");
    } finally {
      setSavingService(false);
    }
  }

  async function saveStaff() {
    if (!staffName.trim()) { toast.error("Nombre del profesional requerido"); return; }
    setSavingStaff(true);
    try {
      const res = await fetch("/api/panel/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: staffName,
          specialty,
          phone: staffPhone,
          serviceIds: createdServiceId ? [createdServiceId] : [],
        }),
      });
      if (!res.ok) throw new Error("Error al crear profesional");
      toast.success("Profesional creado");
      markSeen();
      setStep(3);
    } catch {
      toast.error("Error al crear el profesional");
    } finally {
      setSavingStaff(false);
    }
  }

  const progress = ((step) / (steps.length - 1)) * 100;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-heading font-bold">
          Bienvenido a <span className="brand-text">Jiku</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configuremos {businessName} en unos pasos
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? "brand-gradient text-white" :
                i === step ? "border-2 border-primary text-primary" :
                "border border-border text-muted-foreground"
              }`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full brand-gradient rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div ref={contentRef} className="glass rounded-2xl p-8">
        <h2 className="text-lg font-heading font-semibold mb-1">{steps[step].title}</h2>
        <p className="text-muted-foreground text-sm mb-6">{steps[step].desc}</p>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Descripción del negocio</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Ej: Barberia premium en Palermo, especializada en cortes modernos y barba..."
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Teléfono</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
                className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="flex-1 h-10 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Continuar
              </button>
              <button onClick={() => setStep(1)} className="h-10 px-4 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted flex items-center gap-1">
                <SkipForward className="w-3 h-3" /> Saltar
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nombre del servicio</label>
              <input
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Ej: Corte de pelo"
                className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Duracion (min)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                  min={5}
                  className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Precio ($)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                  min={0}
                  step={100}
                  className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveService}
                disabled={savingService}
                className="flex-1 h-10 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingService ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Continuar
              </button>
              <button onClick={() => setStep(2)} className="h-10 px-4 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted flex items-center gap-1">
                <SkipForward className="w-3 h-3" /> Saltar
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nombre</label>
              <input
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Ej: Juan Perez"
                className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Especialidad</label>
                <input
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ej: Barbero"
                  className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Teléfono</label>
                <input
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveStaff}
                disabled={savingStaff}
                className="flex-1 h-10 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingStaff ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Finalizar
              </button>
              <button onClick={() => { markSeen(); setStep(3); }} className="h-10 px-4 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted flex items-center gap-1">
                <SkipForward className="w-3 h-3" /> Saltar
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full brand-gradient flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-lg font-heading font-bold">Tu negocio esta listo!</p>
              <p className="text-muted-foreground text-sm mt-1">
                Ya podes empezar a recibir reservas y gestionar tu equipo.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/panel")}
                className="h-10 px-6 rounded-lg brand-gradient text-white font-medium text-sm flex items-center justify-center gap-2"
              >
                Ir al panel <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
