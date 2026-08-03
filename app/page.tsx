"use client";

import { useState } from "react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  sources?: string[];
  responseTimeMs?: number;
}

const CATEGORIES = [
  "Todas",
  "RH",
  "Financeiro",
  "Operacional",
  "Legal/Compliance",
  "Estratégico",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Olá! Sou o Agente de IA ÓrbitaTech. Estou aqui para tirar dúvidas sobre onboarding, reembolso financeiro, procedimentos operacionais, segurança de dados e planejamento estratégico da empresa. Como posso te ajudar hoje?",
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;

    const userQuery = inputQuestion.trim();
    const userMsgId = Date.now().toString();

    const newMessages: Message[] = [
      ...messages,
      { id: userMsgId, sender: "user", text: userQuery },
    ];

    setMessages(newMessages);
    setInputQuestion("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuery,
          category: selectedCategory === "Todas" ? undefined : selectedCategory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao consultar o agente de IA.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: data.answer,
          sources: data.sources,
          responseTimeMs: data.responseTimeMs,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: `⚠️ Ops! Ocorreu um erro ao processar sua pergunta: ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 text-xl">
            Ó
          </div>
          <div>
            <h1 className="font-semibold text-lg text-slate-100 leading-tight">
              Agente IA ÓrbitaTech
            </h1>
            <p className="text-xs text-slate-400">
              Base de Conhecimento Interna RAG
            </p>
          </div>
        </div>

        {/* Filtro de Categoria */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Filtrar Categoria:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Áreas de Mensagens */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl w-full mx-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.text}
              </div>

              {msg.responseTimeMs && (
                <div className="mt-2 text-[10px] text-slate-400 text-right">
                  Respondido em {(msg.responseTimeMs / 1000).toFixed(2)}s
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-2xl rounded-tl-none p-4 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
              <span>Consultando documentos da ÓrbitaTech...</span>
            </div>
          </div>
        )}
      </main>

      {/* Input Form */}
      <footer className="border-t border-slate-800 bg-slate-950 p-4">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex items-center space-x-3"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Faça uma pergunta sobre normas, reembolso, OKRs ou processos..."
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuestion.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl px-5 py-3 transition-colors shadow-lg shadow-cyan-600/20"
          >
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
}
