"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import type { SettingsInput } from "@/lib/types/forms";

export function SettingsForm({ initialSettings }: { initialSettings: SettingsInput }) {
  const [values, setValues] = useState(initialSettings);

  async function save() {
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error ?? "Falha ao salvar configurações.");
    }
  }

  return (
    <Card className="max-w-4xl p-5">
      <h2 className="text-xl">Configurações</h2>
      <div className="mt-6 grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Formulário público</Label>
            <NativeSelect
              value={String(values.publicFormEnabled)}
              onChange={(event) => setValues({ ...values, publicFormEnabled: event.target.value === "true" })}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </NativeSelect>
          </div>
          <div>
            <Label>Limite crítico da nota</Label>
            <Input
              type="number"
              min={1}
              max={5}
              step={0.5}
              value={values.criticalThresholdNumber}
              onChange={(event) =>
                setValues({ ...values, criticalThresholdNumber: Number(event.target.value) })
              }
            />
          </div>
        </div>

        <div>
          <Label>E-mails de alerta</Label>
          <Textarea
            value={values.notificationEmails.join("\n")}
            onChange={(event) =>
              setValues({
                ...values,
                notificationEmails: event.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean)
              })
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Nome da marca</Label>
            <Input value={values.brandName || ""} onChange={(event) => setValues({ ...values, brandName: event.target.value })} />
          </div>
          <div>
            <Label>Link do WhatsApp</Label>
            <Input
              value={values.whatsappLink || ""}
              onChange={(event) => setValues({ ...values, whatsappLink: event.target.value })}
            />
          </div>
        </div>

        <div>
          <Label>Título da landing</Label>
          <Input
            value={values.landingTitle || ""}
            onChange={(event) => setValues({ ...values, landingTitle: event.target.value })}
          />
        </div>

        <div>
          <Label>Subtítulo da landing</Label>
          <Textarea
            value={values.landingSubtitle || ""}
            onChange={(event) => setValues({ ...values, landingSubtitle: event.target.value })}
          />
        </div>

        <div>
          <Button
            onClick={async () => {
              try {
                await save();
                toast.success("Configurações atualizadas.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Falha ao salvar.");
              }
            }}
          >
            Salvar configurações
          </Button>
        </div>
      </div>
    </Card>
  );
}
