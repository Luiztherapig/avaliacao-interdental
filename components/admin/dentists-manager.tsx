"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select-native";
import { dentistFormSchema, type DentistFormInput } from "@/lib/types/forms";

type Dentist = {
  id: string;
  name: string;
  specialty: string | null;
  isActive: boolean;
  displayOrder: number;
  updatedAt: string;
};

export function DentistsManager({ initialDentists }: { initialDentists: Dentist[] }) {
  const [dentists, setDentists] = useState(initialDentists);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<DentistFormInput>({
    resolver: zodResolver(dentistFormSchema),
    defaultValues: {
      name: "",
      specialty: "",
      isActive: true,
      displayOrder: dentists.length * 10 + 10
    }
  });

  async function submit(values: DentistFormInput) {
    const url = editingId ? `/api/admin/dentists/${editingId}` : "/api/admin/dentists";
    const method = editingId ? "PATCH" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error ?? "Falha ao salvar dentista.");
    }

    const nextItem = {
      id: result.data.dentist.id,
      name: values.name,
      specialty: values.specialty || null,
      isActive: values.isActive,
      displayOrder: values.displayOrder,
      updatedAt: new Date().toISOString()
    };

    setDentists((current) => {
      const exists = current.some((item) => item.id === nextItem.id);
      return exists ? current.map((item) => (item.id === nextItem.id ? nextItem : item)) : [...current, nextItem];
    });

    setEditingId(null);
    form.reset({
      name: "",
      specialty: "",
      isActive: true,
      displayOrder: dentists.length * 10 + 20
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="p-5">
        <h2 className="text-xl">Cadastrar ou editar dentista</h2>
        <form
          className="mt-5 space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await submit(values);
              toast.success(editingId ? "Dentista atualizado." : "Dentista criado.");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Falha ao salvar.");
            }
          })}
        >
          <div>
            <Label>Nome</Label>
            <Input {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div>
            <Label>Especialidade</Label>
            <Input {...form.register("specialty")} />
          </div>
          <div>
            <Label>Ordem de exibição</Label>
            <Input type="number" {...form.register("displayOrder")} />
          </div>
          <div>
            <Label>Status</Label>
            <NativeSelect
              value={String(form.watch("isActive"))}
              onChange={(event) => form.setValue("isActive", event.target.value === "true")}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </NativeSelect>
          </div>
          <div className="flex gap-3">
            <Button type="submit">{editingId ? "Salvar alterações" : "Adicionar dentista"}</Button>
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  form.reset({
                    name: "",
                    specialty: "",
                    isActive: true,
                    displayOrder: dentists.length * 10 + 10
                  });
                }}
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl">Dentistas cadastrados</h2>
          <Badge>{dentists.length} registros</Badge>
        </div>
        <div className="space-y-3">
          {dentists
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((dentist) => (
              <div key={dentist.id} className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{dentist.name}</p>
                  <p className="text-sm text-slate-500">{dentist.specialty || "Especialidade não informada"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={dentist.isActive ? "success" : "warning"}>{dentist.isActive ? "Ativo" : "Inativo"}</Badge>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(dentist.id);
                      form.reset({
                        name: dentist.name,
                        specialty: dentist.specialty || "",
                        isActive: dentist.isActive,
                        displayOrder: dentist.displayOrder
                      });
                    }}
                  >
                    Editar
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
