"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NovaPerguntaPage() {
  const supabase = createClient();

  const [nome, setNome] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [descricao, setDescricao] = useState("");

  async function salvar() {
    await supabase.from("questions").insert({
      label: pergunta,
      help_text: descricao,
      code: "nome_paciente",
      type: "text",
      required: true
    });

    window.location.href = "/admin/perguntas-simples";
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Nova Pergunta</h1>

      <input placeholder="Nome do campo (ex: Nome do paciente)" onChange={(e) => setNome(e.target.value)} />
      <br /><br />

      <input placeholder="Pergunta" onChange={(e) => setPergunta(e.target.value)} />
      <br /><br />

      <textarea placeholder="Descrição" onChange={(e) => setDescricao(e.target.value)} />
      <br /><br />

      <button onClick={salvar}>Salvar</button>
    </div>
  );
}