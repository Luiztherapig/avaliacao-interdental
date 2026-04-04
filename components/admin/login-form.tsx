"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha.")
});

type LoginValues = z.infer<typeof loginSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

export function LoginForm() {
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  async function onSubmit(values: LoginValues) {
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });

      if (error) {
        toast.error("E-mail ou senha inválidos.");
        setLoading(false);
        return;
      }

      window.location.href = "/admin";
    } catch {
      toast.error("Erro ao tentar entrar.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
          Painel Interdental
        </p>
        <h1 className="mt-3 text-3xl">Entrar</h1>
        <p className="mt-3 text-slate-600">
          Acesso exclusivo para administradores da clínica.
        </p>
      </div>

      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" {...form.register("password")} />
          <FieldError message={form.formState.errors.password?.message} />
        </div>

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </Card>
  );
}
