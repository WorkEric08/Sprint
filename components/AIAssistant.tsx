
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Objective } from '../types';

interface Props {
  objectives: Objective[];
}

const AIAssistant: React.FC<Props> = ({ objectives }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Aja como um mentor de desenvolvimento pessoal de alta performance. 
        Analise a lista de objetivos abaixo e forneça 3 conselhos práticos e motivacionais 
        específicos para melhorar o desempenho do usuário.
        Objetivos atuais: ${objectives.map(o => `${o.title} (${o.frequency}, ${o.targetCount}x)`).join(', ')}.
        Retorne em formato de tópicos curtos e inspiradores em Português.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setInsight(response.text || "Não foi possível gerar insights agora. Tente novamente.");
    } catch (error) {
      console.error(error);
      setInsight("Houve um erro ao conectar com o mentor AI. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
            Mentor Sprint <i className="fas fa-sparkles text-yellow-300"></i>
          </h3>
          <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
            Obtenha insights personalizados baseados nos seus objetivos atuais usando inteligência artificial de ponta.
          </p>
          <button 
            onClick={generateInsight}
            disabled={loading || objectives.length === 0}
            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <><i className="fas fa-circle-notch animate-spin"></i> Analisando...</>
            ) : (
              <><i className="fas fa-brain"></i> Gerar Insights</>
            )}
          </button>
        </div>
        <i className="fas fa-wand-magic-sparkles absolute -bottom-4 -right-4 text-white/10 text-9xl"></i>
      </div>

      {insight && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 animate-in fade-in duration-500">
          <div className="flex items-center gap-2 mb-4 text-indigo-600">
            <i className="fas fa-comment-dots"></i>
            <span className="font-bold text-sm uppercase tracking-widest">Recomendação do Mentor</span>
          </div>
          <div className="prose prose-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {insight}
          </div>
        </div>
      )}

      {objectives.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-gray-500 text-sm">Adicione objetivos para que o mentor AI possa analisá-los.</p>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
