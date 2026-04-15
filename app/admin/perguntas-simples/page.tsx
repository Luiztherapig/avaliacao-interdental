import { createClient } from "@/lib/supabase/server";

export default async function PerguntasSimplesPage() {
  const supabase = await createClient();

  const { data: perguntas } = await supabase
    .from("questions")
    .select("*")
    .order("order", { ascending: true });

  return (
    <div style={{ padding: 20 }}>
      <h1>Perguntas</h1>

      <a href="/admin/perguntas-simples/nova">
        <button>+ Adicionar pergunta</button>
      </a>

      <div style={{ marginTop: 20 }}>
        {perguntas?.map((p) => (
          <div key={p.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
            <strong>{p.label}</strong>
            <p>{p.help_text}</p>

            <div style={{ display: "flex", gap: 10 }}>
              <a href={`/admin/perguntas-simples/${p.id}`}>
                <button>Editar</button>
              </a>

              <button>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
