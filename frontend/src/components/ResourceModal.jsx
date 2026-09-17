import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Image as ImageIcon, 
  Mic, 
  UploadCloud, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Music,
  Trash2,
  ArrowRight
} from 'lucide-react';

export default function ResourceModal({ isOpen, onClose, onProcessMaterials }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'documents' | 'images' | 'audio' | 'text'
  const [studyText, setStudyText] = useState('');
  const [files, setFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Manejo de carga de archivos (PDFs, docs, imágenes, audios)
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type.includes('pdf') ? 'document' :
              file.type.includes('image') ? 'image' :
              file.type.includes('audio') ? 'audio' : 'text',
        rawFile: file
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Simulación de grabación de nota de voz / audio de clase
  const toggleRecording = () => {
    if (isRecording) {
      clearInterval(timerRef.current);
      setIsRecording(false);
      setFiles((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          name: `Grabacion_Clase_${new Date().toLocaleTimeString().replace(/:/g, '-')}.mp3`,
          size: '1.4 MB',
          type: 'audio',
        }
      ]);
      setRecordingTime(0);
    } else {
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files) {
      const dropped = Array.from(e.dataTransfer.files).map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type.includes('pdf') ? 'document' :
              file.type.includes('image') ? 'image' :
              file.type.includes('audio') ? 'audio' : 'text',
        rawFile: file
      }));
      setFiles((prev) => [...prev, ...dropped]);
    }
  };

  const handleStartGame = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (onProcessMaterials) {
        onProcessMaterials({
          files,
          text: studyText || 'Material didáctico integrado con éxito.'
        });
      }
      onClose();
    }, 1200);
  };

  const filteredFiles = activeTab === 'all' 
    ? files 
    : files.filter(f => f.type === activeTab);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-3xl rounded-3xl bg-[#182234] border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col text-slate-100 max-h-[90vh]"
        >
          {/* Luz Neón Superior */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee]" />

          {/* Cabecera del Modal */}
          <div className="p-6 border-b border-slate-700/60 flex items-center justify-between bg-[#131b2a]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                <UploadCloud className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                  Centro de Ingesta Neuronal
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-400 font-mono">
                    Multimodal RAG
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sube tus apuntes, audios de clase o diagramas. Gemini construirá tu tablero interactivo.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs Selectoras */}
          <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-700/40 bg-[#162030] text-xs font-semibold overflow-x-auto">
            {[
              { id: 'all', label: 'Todos los recursos', icon: Sparkles, count: files.length },
              { id: 'document', label: 'Documentos (PDF/DOC)', icon: FileText },
              { id: 'image', label: 'Imágenes / Fotos', icon: ImageIcon },
              { id: 'audio', label: 'Audios / Clases', icon: Mic },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Contenido Principal con Scroll */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#151e2e]">
            
            {/* Zona 1: Drag & Drop para Documentos, Imágenes y Audios */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                isDraggingOver
                  ? 'border-cyan-400 bg-cyan-950/50 shadow-[0_0_20px_rgba(34,211,238,0.3)] scale-[0.99]'
                  : 'border-slate-600 hover:border-cyan-400/80 bg-slate-900/50 hover:bg-slate-900/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.mp3,.wav,.m4a"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
                <UploadCloud className="w-7 h-7 animate-bounce" />
              </div>

              <h3 className="text-sm font-bold text-slate-200">
                Arrastra aquí tus archivos o <span className="text-cyan-400 underline">explora tu equipo</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Soporta PDFs extensos, diapositivas, capturas de pizarras y notas de voz (.mp3, .wav)
              </p>
            </div>

            {/* Zona 2: Grabadora de Audio / Micrófono en Vivo & Pegar Texto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Botón Grabador de Audio */}
              <div className="col-span-1 bg-slate-900/70 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                  isRecording 
                    ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_15px_#f43f5e]' 
                    : 'bg-slate-800 text-slate-300 border border-slate-600'
                }`}>
                  <Mic className="w-6 h-6" />
                </div>
                
                <h4 className="text-xs font-bold text-slate-200 mb-1">
                  {isRecording ? `Grabando (${recordingTime}s)...` : 'Nota de Voz en Vivo'}
                </h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Explica el tema con tus palabras o graba la lección.
                </p>

                <button
                  onClick={toggleRecording}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isRecording 
                      ? 'bg-rose-950 text-rose-300 border-rose-500 hover:bg-rose-900' 
                      : 'bg-cyan-950 text-cyan-300 border-cyan-500 hover:bg-cyan-900'
                  }`}
                >
                  {isRecording ? 'Finalizar Grabación' : 'Iniciar Grabación'}
                </button>
              </div>

              {/* Área de Texto Directo o Apuntes Rápidos */}
              <div className="col-span-2 bg-slate-900/70 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    Pegar Texto o Apuntes Directos
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {studyText.length} caracteres
                  </span>
                </div>

                <textarea
                  value={studyText}
                  onChange={(e) => setStudyText(e.target.value)}
                  placeholder="Ejemplo: 'La célula vegetal contiene cloroplastos para realizar la fotosíntesis, pared celular de celulosa y una vacuola central que mantiene la turgencia...'"
                  className="w-full h-20 bg-slate-950/80 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 resize-none font-sans"
                />
              </div>
            </div>

            {/* Zona 3: Lista de Archivos Subidos */}
            {filteredFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  Recursos cargados ({filteredFiles.length})
                </h4>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="p-2 rounded-lg bg-slate-800 text-cyan-400 shrink-0">
                          {file.type === 'document' ? <FileText className="w-4 h-4" /> :
                           file.type === 'image' ? <ImageIcon className="w-4 h-4" /> :
                           file.type === 'audio' ? <Music className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-500">{file.size} • {file.type.toUpperCase()}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pie del Modal con Acción de Ingesta */}
          <div className="p-5 border-t border-slate-700/60 bg-[#131b2a] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Cerebro Gemini listo para estructurar el diagrama</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>

              <button
                disabled={isProcessing || (files.length === 0 && studyText.trim().length === 0)}
                onClick={handleStartGame}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Ingiriendo Recursos...
                  </>
                ) : (
                  <>
                    <span>Generar Tablero Táctico</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
