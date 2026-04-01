"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionnaireDraftInput } from "@/lib/types/forms";

type QuestionnaireData = Awaited<ReturnType<typeof import("@/lib/queries/admin").getQuestionnaires>>;

function createEmptyQuestion(order: number) {
  return {
    code: `q_${order}`,
    label: "",
    description: "",
    type: "rating" as const,
    isRequired: true,
    isActive: true,
    displayOrder: order,
    options: [],
    conditionalRule: undefined,
    criticalRule: undefined
  };
}

export function QuestionnairesManager({ initialData }: { initialData: QuestionnaireData }) {
  const [versions, setVersions] = useState(initialData.versions);
  const [draft, setDraft] = useState<QuestionnaireDraftInput>(
    initialData.activeDraft
      ? {
          title: initialData.activeDraft.title,
          description: "",
          questions: initialData.activeDraft.questions.map((question) => ({
            code: question.code,
            label: question.label,
            description: question.description ?? "",
            type: question.type as QuestionnaireDraftInput["questions"][number]["type"],
            isRequired: question.isRequired,
            isActive: question.isActive,
            displayOrder: question.displayOrder,
            options: question.options,
            conditionalRule: question.conditionalRule as QuestionnaireDraftInput["questions"][number]["conditionalRule"],
            criticalRule: question.criticalRule as QuestionnaireDraftInput["questions"][number]["criticalRule"]
          }))
        }
      : {
          title: "Nova versão",
          description: "",
          questions: [createEmptyQuestion(10)]
        }
  );
  const [draftId, setDraftId] = useState<string | null>(initialData.activeDraft?.id ?? null);
  const sortedQuestions = useMemo(
    () => [...draft.questions].sort((a, b) => a.displayOrder - b.displayOrder),
    [draft.questions]
  );

  async function saveDraft() {
    const response = await fetch(draftId ? `/api/admin/questionnaires/${draftId}` : "/api/admin/questionnaires", {
      method: draftId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error ?? "Falha ao salvar rascunho.");
    }

    const nextDraftId = draftId ?? result.data.questionnaireId;

    if (!draftId) {
      setDraftId(result.data.questionnaireId);
      setVersions((current) => [
        {
          id: result.data.questionnaireId,
          versionNumber: current.length + 1,
          title: draft.title,
          status: "draft",
          publishedAt: null
        },
        ...current
      ]);
    }

    return nextDraftId as string;
  }

  async function publishDraft(finalDraftId: string) {
    const response = await fetch(`/api/admin/questionnaires/${finalDraftId}/publish`, { method: "POST" });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error ?? "Falha ao publicar versão.");
    }

    setVersions((current) =>
      current.map((item) => ({
        ...item,
        status: item.id === finalDraftId ? "published" : item.status === "published" ? "archived" : item.status,
        publishedAt: item.id === finalDraftId ? new Date().toISOString() : item.publishedAt
      }))
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl">Editor do questionário</h2>
            <p className="mt-2 text-sm text-slate-500">
              O histórico é preservado por versão. A publicação substitui a versão ativa sem alterar respostas antigas.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  questions: [...current.questions, createEmptyQuestion(current.questions.length * 10 + 10)]
                }))
              }
            >
              Adicionar pergunta
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await saveDraft();
                  toast.success("Rascunho salvo.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Falha ao salvar.");
                }
              }}
            >
              Salvar rascunho
            </Button>
            <Button
              onClick={async () => {
                try {
                  const finalDraftId = await saveDraft();
                  await publishDraft(finalDraftId);
                  toast.success("Versão publicada.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Falha ao publicar.");
                }
              }}
            >
              Publicar versão
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Título interno</Label>
              <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={draft.description ?? ""}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            {sortedQuestions.map((question, index) => (
              <div key={`${question.code}-${index}`} className="rounded-3xl border p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Código</Label>
                    <Input
                      value={question.code}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          questions: current.questions.map((item) =>
                            item.displayOrder === question.displayOrder ? { ...item, code: event.target.value } : item
                          )
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <NativeSelect
                      value={question.type}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          questions: current.questions.map((item) =>
                            item.displayOrder === question.displayOrder
                              ? {
                                  ...item,
                                  type: event.target.value as QuestionnaireDraftInput["questions"][number]["type"]
                                }
                              : item
                          )
                        }))
                      }
                    >
                      <option value="emoji_rating">Carinhas</option>
                      <option value="rating">Nota 1 a 5</option>
                      <option value="yes_no">Sim/Não</option>
                      <option value="single_choice">Escolha única</option>
                      <option value="text">Texto</option>
                    </NativeSelect>
                  </div>
                </div>

                <div className="mt-4">
                  <Label>Pergunta</Label>
                  <Input
                    value={question.label}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        questions: current.questions.map((item) =>
                          item.displayOrder === question.displayOrder ? { ...item, label: event.target.value } : item
                        )
                      }))
                    }
                  />
                </div>

                <div className="mt-4">
                  <Label>Descrição de apoio</Label>
                  <Textarea
                    value={question.description ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        questions: current.questions.map((item) =>
                          item.displayOrder === question.displayOrder ? { ...item, description: event.target.value } : item
                        )
                      }))
                    }
                  />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div>
                    <Label>Ordem</Label>
                    <Input
                      type="number"
                      value={question.displayOrder}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          questions: current.questions.map((item) =>
                            item.displayOrder === question.displayOrder
                              ? { ...item, displayOrder: Number(event.target.value) }
                              : item
                          )
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Obrigatória</Label>
                    <NativeSelect
                      value={String(question.isRequired)}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          questions: current.questions.map((item) =>
                            item.displayOrder === question.displayOrder
                              ? { ...item, isRequired: event.target.value === "true" }
                              : item
                          )
                        }))
                      }
                    >
                      <option value="true">Sim</option>
                      <option value="false">Não</option>
                    </NativeSelect>
                  </div>
                  <div>
                    <Label>Ativa</Label>
                    <NativeSelect
                      value={String(question.isActive)}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          questions: current.questions.map((item) =>
                            item.displayOrder === question.displayOrder
                              ? { ...item, isActive: event.target.value === "true" }
                              : item
                          )
                        }))
                      }
                    >
                      <option value="true">Sim</option>
                      <option value="false">Não</option>
                    </NativeSelect>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="destructive"
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          questions: current.questions.filter((item) => item.displayOrder !== question.displayOrder)
                        }))
                      }
                    >
                      Remover
                    </Button>
                  </div>
                </div>

                {question.type === "single_choice" ? (
                  <div className="mt-4">
                    <Label>Opções (uma por linha no formato valor|rótulo)</Label>
                    <Textarea
                      value={(question.options ?? []).map((option) => `${option.value}|${option.label}`).join("\n")}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          questions: current.questions.map((item) =>
                            item.displayOrder === question.displayOrder
                              ? {
                                  ...item,
                                  options: event.target.value
                                    .split("\n")
                                    .map((line) => line.trim())
                                    .filter(Boolean)
                                    .map((line) => {
                                      const [value, label] = line.split("|");
                                      return { value: value.trim(), label: (label ?? value).trim() };
                                    })
                                }
                              : item
                          )
                        }))
                      }
                    />
                  </div>
                ) : null}

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-semibold">Regra condicional</p>
                    <div className="grid gap-3">
                      <Input
                        placeholder="Código da pergunta base"
                        value={typeof question.conditionalRule?.dependsOnQuestionCode === "string" ? question.conditionalRule.dependsOnQuestionCode : ""}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            questions: current.questions.map((item) =>
                              item.displayOrder === question.displayOrder
                                ? {
                                    ...item,
                                    conditionalRule: {
                                      dependsOnQuestionCode: event.target.value,
                                      operator: item.conditionalRule?.operator ?? "equals",
                                      value: item.conditionalRule?.value ?? "",
                                      requiredWhenVisible: item.conditionalRule?.requiredWhenVisible ?? false
                                    }
                                  }
                                : item
                            )
                          }))
                        }
                      />
                      <NativeSelect
                        value={question.conditionalRule?.operator ?? "equals"}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            questions: current.questions.map((item) =>
                              item.displayOrder === question.displayOrder
                                ? {
                                    ...item,
                                    conditionalRule: {
                                      dependsOnQuestionCode: item.conditionalRule?.dependsOnQuestionCode ?? "",
                                      operator: event.target.value as "equals" | "not_equals" | "lte" | "gte" | "in",
                                      value: item.conditionalRule?.value ?? "",
                                      requiredWhenVisible: item.conditionalRule?.requiredWhenVisible ?? false
                                    }
                                  }
                                : item
                            )
                          }))
                        }
                      >
                        <option value="equals">Igual a</option>
                        <option value="not_equals">Diferente de</option>
                        <option value="lte">Menor ou igual</option>
                        <option value="gte">Maior ou igual</option>
                      </NativeSelect>
                      <Input
                        placeholder="Valor gatilho"
                        value={String(question.conditionalRule?.value ?? "")}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            questions: current.questions.map((item) =>
                              item.displayOrder === question.displayOrder
                                ? {
                                    ...item,
                                    conditionalRule: {
                                      dependsOnQuestionCode: item.conditionalRule?.dependsOnQuestionCode ?? "",
                                      operator: item.conditionalRule?.operator ?? "equals",
                                      value: Number.isNaN(Number(event.target.value))
                                        ? event.target.value
                                        : Number(event.target.value),
                                      requiredWhenVisible: item.conditionalRule?.requiredWhenVisible ?? false
                                    }
                                  }
                                : item
                            )
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-semibold">Regra crítica</p>
                    <div className="grid gap-3">
                      <NativeSelect
                        value={question.criticalRule?.operator ?? "lte"}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            questions: current.questions.map((item) =>
                              item.displayOrder === question.displayOrder
                                ? {
                                    ...item,
                                    criticalRule: {
                                      operator: event.target.value as "equals" | "lte" | "gte",
                                      value: item.criticalRule?.value ?? ""
                                    }
                                  }
                                : item
                            )
                          }))
                        }
                      >
                        <option value="lte">Menor ou igual</option>
                        <option value="equals">Igual a</option>
                        <option value="gte">Maior ou igual</option>
                      </NativeSelect>
                      <Input
                        placeholder="Valor crítico"
                        value={String(question.criticalRule?.value ?? "")}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            questions: current.questions.map((item) =>
                              item.displayOrder === question.displayOrder
                                ? {
                                    ...item,
                                    criticalRule: {
                                      operator: item.criticalRule?.operator ?? "lte",
                                      value: Number.isNaN(Number(event.target.value))
                                        ? event.target.value
                                        : Number(event.target.value)
                                    }
                                  }
                                : item
                            )
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl">Versões</h2>
        <div className="mt-5 space-y-3">
          {versions.map((version) => (
            <div key={version.id} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">v{version.versionNumber}</p>
                  <p className="text-sm text-slate-500">{version.title}</p>
                </div>
                <Badge
                  tone={
                    version.status === "published"
                      ? "success"
                      : version.status === "draft"
                        ? "warning"
                        : "default"
                  }
                >
                  {version.status === "published"
                    ? "Publicada"
                    : version.status === "draft"
                      ? "Rascunho"
                      : "Arquivada"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
