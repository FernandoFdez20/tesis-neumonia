import type { FormEvent } from "react"
import { useId, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type NewPatientDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PatientFormState = {
  fullName: string
  dni: string
  age: string
  sex: string
}

const initialFormState: PatientFormState = {
  fullName: "",
  dni: "",
  age: "",
  sex: "",
}

export function NewPatientDialog({
  open,
  onOpenChange,
}: NewPatientDialogProps) {
  const formId = useId()
  const [form, setForm] = useState<PatientFormState>(initialFormState)

  const canSave = useMemo(
    () =>
      form.fullName.trim().length > 0 &&
      form.dni.trim().length > 0 &&
      form.age.trim().length > 0 &&
      form.sex.length > 0,
    [form]
  )

  function updateField(field: keyof PatientFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      setForm(initialFormState)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      return
    }

    console.info("Paciente registrado temporalmente", form)
    
    // Disparar toast de confirmación clínica premium
    toast.success("Paciente registrado correctamente", {
      description: `${form.fullName} (DNI ${form.dni}) ha sido añadido al registro temporal.`,
      className: "rounded-xl border border-border/40 bg-popover text-popover-foreground shadow-lg",
    })

    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader className="px-5 pt-5 pb-1">
          <DialogTitle>Nuevo registro de paciente</DialogTitle>
          <DialogDescription className="mt-1">
            Captura los datos mínimos del paciente para iniciar la evaluación clínica respiratoria.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="grid gap-4.5 px-5 pb-5">
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-full-name`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">
              Nombres y Apellidos completos
            </Label>
            <Input
              id={`${formId}-full-name`}
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Ej. María Elena Vargas Ruiz"
              autoComplete="name"
              className="h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_112px]">
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-dni`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">
                DNI / Documento
              </Label>
              <Input
                id={`${formId}-dni`}
                value={form.dni}
                onChange={(event) => updateField("dni", event.target.value)}
                placeholder="Ej. 70451298"
                inputMode="numeric"
                maxLength={8}
                autoComplete="off"
                className="h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${formId}-age`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">
                Edad (Años)
              </Label>
              <Input
                id={`${formId}-age`}
                value={form.age}
                onChange={(event) => updateField("age", event.target.value)}
                placeholder="45"
                type="number"
                min={18}
                max={120}
                className="h-10 bg-background/50 px-3.5 rounded-xl border border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/45 tabular-nums"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${formId}-sex`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">
              Sexo biológico
            </Label>
            <Select
              value={form.sex}
              onValueChange={(value) => updateField("sex", value)}
              required
            >
              <SelectTrigger id={`${formId}-sex`} className="rounded-xl border-border/60">
                <SelectValue placeholder="Selecciona el sexo biológico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="femenino" className="rounded-lg">Femenino</SelectItem>
                <SelectItem value="masculino" className="rounded-lg">Masculino</SelectItem>
                <SelectItem value="no-especificado" className="rounded-lg">No especificado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter className="px-5 py-4 border-t border-border/40 bg-muted/10">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer rounded-xl font-bold h-10 border border-border/50 hover:bg-accent/80 transition-all duration-200">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" form={formId} disabled={!canSave} className="cursor-pointer rounded-xl font-bold h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200">
            Guardar registro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
