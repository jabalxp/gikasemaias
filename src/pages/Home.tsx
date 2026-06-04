import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Play, Upload, RotateCcw, AlertTriangle } from 'lucide-react';

export const Home: React.FC = () => {
  const { setScreen, carregarJogo, importarSave, resetarDadosEditor } = useGameStore();
  const [importCode, setImportCode] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const hasSave = localStorage.getItem('prostrike_save') !== null;

  const handleLoad = () => {
    const success = carregarJogo();
    if (!success) {
      setErrorMsg('Não foi possível carregar o save local.');
    }
  };

  const handleImport = () => {
    if (!importCode.trim()) return;
    const success = importarSave(importCode);
    if (success) {
      setShowImport(false);
    } else {
      setErrorMsg('Código de save inválido.');
    }
  };

  return (
    <div className="min-h-screen bg-[#030306] bg-gradient-to-br from-[#030306] via-[#0b0616] to-[#040914] text-white flex flex-col justify-between items-center p-8 relative overflow-hidden select-none">
      {/* GRID DE ESTRELAS/GLOWS DE FUNDO */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.08),transparent_50%)] z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(138,43,226,0.08),transparent_50%)] z-0 pointer-events-none" />

      {/* HEADER DISCRETO */}
      <div className="w-full max-w-6xl flex justify-between items-center z-10">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">v1.0.0 Stable MVP</span>
        <button
          onClick={() => {
            if (confirm('Tem certeza de que deseja resetar TODOS os dados locais e saves de volta para o padrão?')) {
              resetarDadosEditor();
            }
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-danger transition-colors duration-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Resetar Base de Dados</span>
        </button>
      </div>

      {/* TÍTULO PRINCIPAL E INTRODUÇÃO */}
      <div className="flex flex-col items-center text-center max-w-2xl my-auto z-10">
        <div className="w-16 h-16 rounded bg-gradient-to-tr from-brand-cyan to-brand-purple flex items-center justify-center glow-cyan mb-6">
          <Play className="w-9 h-9 text-brand-dark fill-brand-dark ml-1" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-2 text-white">
          PROSTRIKE <span className="bg-gradient-to-r from-brand-cyan to-brand-purple bg-clip-text text-transparent text-neon-cyan">MANAGER</span>
        </h1>
        <p className="text-base text-slate-400 font-medium leading-relaxed max-w-lg mb-8">
          Gerencie jogadores reais do cenário competitivo de CS, crie estratégias táticas de alto nível, assine patrocínios lucrativos e simule partidas round a round rumo ao topo mundial.
        </p>

        {/* MENUS E BOTÕES PRINCIPAIS */}
        <div className="flex flex-col gap-3.5 w-80">
          <button
            onClick={() => setScreen('newGame')}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-base font-extrabold bg-gradient-to-r from-brand-cyan to-brand-purple text-brand-dark hover:scale-102 hover:shadow-lg hover:shadow-brand-cyan/20 active:scale-98 transition-all duration-300"
          >
            <span>NOVO JOGO / CARREIRA</span>
          </button>

          {hasSave ? (
            <button
              onClick={handleLoad}
              className="w-full py-3.5 rounded-xl text-sm font-extrabold border border-brand-cyan/30 bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan tracking-wider transition-all duration-200"
            >
              CARREGAR JOGO SALVO
            </button>
          ) : (
            <div className="w-full text-center text-xs text-slate-600 font-semibold border border-brand-border py-3.5 rounded-xl bg-zinc-950/20">
              NENHUM SAVE LOCAL ENCONTRADO
            </div>
          )}

          <button
            onClick={() => setShowImport(!showImport)}
            className="w-full py-3.5 rounded-xl text-sm font-bold border border-brand-border bg-zinc-950 hover:bg-zinc-900/60 text-slate-300 hover:text-white transition-all duration-200"
          >
            IMPORTAR SAVE JSON
          </button>
        </div>

        {/* ERROS E MENUS SUSPENSOS */}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-brand-danger bg-brand-danger/10 border border-brand-danger/20 px-4 py-2.5 rounded-lg animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {showImport && (
          <div className="mt-6 w-96 p-4 rounded-xl border border-brand-border bg-brand-card flex flex-col gap-3">
            <textarea
              placeholder="Cole aqui o código do save exportado em base64..."
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              className="w-full h-24 p-3 text-xs bg-zinc-950 border border-brand-border rounded-lg text-slate-300 focus:outline-none focus:border-brand-purple resize-none"
            />
            <button
              onClick={handleImport}
              className="w-full py-2.5 rounded-lg text-xs font-extrabold bg-brand-purple hover:bg-brand-purple/80 text-white transition-all duration-200"
            >
              CONFIRMAR IMPORTAÇÃO
            </button>
          </div>
        )}
      </div>

      {/* RODA PÉ */}
      <div className="text-center z-10 space-y-1.5">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          Desenvolvido para Estudo, Protótipo & Diversão Pessoal. 2026.
        </p>
        <p className="text-[10px] font-medium text-slate-600 tracking-wide">
          Projeto fan-made não-oficial, sem afiliação. Marcas e nomes pertencem a seus donos.
        </p>
      </div>
    </div>
  );
};
