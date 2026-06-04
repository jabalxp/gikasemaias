import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Save, Copy, FileInput, Trash2, Award } from 'lucide-react';

export const Saves: React.FC = () => {
  const {
    managerName,
    currentSeason,
    currentWeek,
    salvarJogo,
    exportarSave,
    importarSave,
    excluirSave
  } = useGameStore();

  const [copied, setCopied] = useState(false);
  const [exportCode, setExportCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const hasSave = localStorage.getItem('prostrike_save') !== null;
  const saveDate = hasSave ? new Date(JSON.parse(localStorage.getItem('prostrike_save')!).createdAt).toLocaleString() : '';

  const handleManualSave = () => {
    salvarJogo();
    alert('Progresso da carreira salvo manualmente com sucesso no LocalStorage!');
  };

  const handleExport = () => {
    const code = exportarSave();
    setExportCode(code);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleImport = () => {
    if (!importCode.trim()) return;
    const success = importarSave(importCode);
    if (success) {
      alert('Carreira importada e carregada com sucesso!');
      setImportCode('');
    } else {
      setErrorMsg('Código de save corrompido ou inválido.');
    }
  };

  const handleDelete = () => {
    if (confirm('ATENÇÃO: Isso apagará permanentemente seu save ativo do LocalStorage. Deseja prosseguir?')) {
      excluirSave();
      alert('Save local removido. Você retornará ao menu.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl">
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <Save className="w-5 h-5 text-brand-cyan" />
          <span>Central de Salvamento / Saves</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Faça saves manuais, copie a hash em Base64 para jogar em outros computadores ou restaure progressos anteriores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARREIRA ATIVA & AÇÕES DE SAVE LOCAL */}
        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-6 flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-brand-border pb-3 mb-4">
              Progresso Local Ativo
            </h3>
            
            {hasSave ? (
              <div className="p-4 bg-zinc-950 border border-brand-border rounded-xl space-y-3">
                <p className="text-sm font-extrabold text-white flex justify-between items-center">
                  <span>Manager: {managerName}</span>
                  <span className="text-[9px] text-brand-cyan border border-brand-cyan/25 px-1.5 py-0.5 rounded bg-brand-cyan/5">
                    Ano {currentSeason} (Sem {currentWeek})
                  </span>
                </p>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider space-y-1">
                  <div>Modificado em: <span className="text-slate-300 font-semibold">{saveDate}</span></div>
                  <div>Slot principal: <span className="text-slate-300 font-semibold">prostrike_save</span></div>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs font-semibold text-slate-600 py-10 uppercase tracking-widest bg-zinc-950 rounded-xl border border-brand-border">
                Nenhum save local registrado
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={handleManualSave}
              className="py-3 bg-brand-cyan hover:bg-brand-cyan/85 text-brand-dark text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all duration-200 glow-cyan flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4 fill-brand-dark" />
              <span>Salvar Progresso</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={!hasSave}
              className={`py-3 text-xs font-extrabold rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                hasSave 
                  ? 'bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-danger border border-brand-danger/25' 
                  : 'bg-zinc-900 text-slate-600 border border-brand-border cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Save</span>
            </button>
          </div>
        </div>

        {/* COMPARTILHAMENTO DE SAVE (EXPORTAR/IMPORTAR) */}
        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-6 h-[360px] overflow-y-auto flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-brand-border pb-3">
              Exportar & Importar Carreira
            </h3>

            {/* EXPORTAR */}
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple/80 text-white text-xs font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 glow-purple"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO DE EXPORTAÇÃO'}</span>
              </button>
              {exportCode && (
                <p className="text-[9px] text-slate-500 font-bold text-center uppercase tracking-wider truncate">
                  Hash gerada: {exportCode.slice(0, 30)}...
                </p>
              )}
            </div>

            {/* IMPORTAR */}
            <div className="space-y-2 border-t border-brand-border/40 pt-4">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Código de Importação (Base64)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Cole aqui o código..."
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-brand-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-purple font-semibold"
                />
                <button
                  onClick={handleImport}
                  className="px-4 py-2 bg-brand-success hover:bg-brand-success/80 text-brand-dark text-xs font-extrabold rounded-lg flex items-center gap-1 transition-all duration-200"
                >
                  <FileInput className="w-4 h-4" />
                  <span>Importar</span>
                </button>
              </div>
              {errorMsg && <p className="text-[10px] text-brand-danger font-bold uppercase tracking-wider">{errorMsg}</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
