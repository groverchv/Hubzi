import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, 
  Folder, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  Trash2, 
  BookOpen, 
  Layers, 
  PlayCircle,
  Clock,
  ChevronRight,
  FolderArchive,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileAudio,
  Image as ImageIcon,
  ArrowLeft,
  Gamepad2,
  CheckCircle2
} from 'lucide-react';

const STORAGE_KEY = 'hubzy_user_study_folders';

export default function StudyFolderManagerModal({ 
  isOpen, 
  onSelectFolder, 
  onStartNewFolder 
}) {
  const [folders, setFolders] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  
  // Vista activa: 'list' (viendo todas las carpetas) o 'detail' (adentro de una carpeta específica)
  const [activeFolderView, setActiveFolderView] = useState(null); // folder object or null
  const fileInputRef = useRef(null);

  // Intentar cargar desde el backend al abrir
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/v1/folders')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.folders && data.folders.length > 0) {
          setFolders(data.folders);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.folders));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const saveFolders = (updatedList) => {
    setFolders(updatedList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  };

  // Crear nueva carpeta
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const folderItem = {
      id: `folder_${Date.now()}`,
      name: newFolderName.trim(),
      description: newFolderDesc.trim() || 'Juegos didácticos y preguntas personalizadas',
      created_at: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      documents: [],
      games: []
    };

    try {
      const res = await fetch('/api/v1/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderItem.name,
          description: folderItem.description
        })
      });
      if (res.ok) {
        const saved = await res.json();
        folderItem.id = saved.id || folderItem.id;
      }
    } catch {}

    const updated = [folderItem, ...folders];
    saveFolders(updated);
    setNewFolderName('');
    setNewFolderDesc('');
    setIsCreating(false);
    // Abrir directamente la carpeta creada
    setActiveFolderView(folderItem);
  };

  // Eliminar carpeta
  const handleDeleteFolder = async (e, folderId) => {
    e.stopPropagation();
    const updated = folders.filter(f => f.id !== folderId);
    saveFolders(updated);
    if (activeFolderView?.id === folderId) {
      setActiveFolderView(null);
    }
    try {
      await fetch(`/api/v1/folders/${folderId}`, { method: 'DELETE' });
    } catch {}
  };

  // Sincronizar activeFolderView automáticamente cuando folders cambie desde el backend
  useEffect(() => {
    if (activeFolderView && folders.length > 0) {
      const match = folders.find(f => f.id === activeFolderView.id);
      if (match) {
        setActiveFolderView(prev => {
          const uploadingDocs = (prev?.documents || []).filter(d => d.isUploading);
          const serverDocs = (match.documents || []).map(d => ({ ...d, isUploading: false }));
          const cleanDocs = [
            ...uploadingDocs,
            ...serverDocs.filter(sd => !uploadingDocs.some(ud => ud.name === sd.name))
          ];
          return {
            ...match,
            documents: cleanDocs
          };
        });
      }
    }
  }, [folders]);

  // Subir documentos REALES a la carpeta actualmente abierta
  // El backend extrae el texto interno del PDF y lo persiste en MongoDB
  const handleUploadFilesToFolder = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !activeFolderView) return;
    e.target.value = '';

    for (const file of files) {
      const tempDoc = {
        id: `uploading_${Date.now()}_${file.name}`,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.name.split('.').pop().toLowerCase(),
        uploaded_at: 'Extrayendo texto...',
        isUploading: true
      };

      // Mostrar placeholder mientras sube
      setActiveFolderView(prev => ({
        ...prev,
        documents: [tempDoc, ...(prev.documents || []).filter(d => d.name !== file.name)]
      }));

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`/api/v1/folders/${activeFolderView.id}/upload-document`, {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const savedDoc = await res.json();
          // Refrescar lista completa de carpetas desde el backend
          const refreshRes = await fetch('/api/v1/folders').catch(() => null);
          if (refreshRes && refreshRes.ok) {
            const data = await refreshRes.json();
            if (data && data.folders) {
              setFolders(data.folders);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.folders));
              const currentFolder = data.folders.find(f => f.id === activeFolderView.id);
              if (currentFolder) {
                setActiveFolderView({
                  ...currentFolder,
                  documents: (currentFolder.documents || []).map(d => ({ ...d, isUploading: false }))
                });
              }
            }
          } else {
            setActiveFolderView(prev => {
              const updatedDocs = (prev.documents || []).map(d =>
                d.id === tempDoc.id ? { ...savedDoc, isUploading: false } : d
              );
              return { ...prev, documents: updatedDocs };
            });
          }
        } else {
          const err = await res.json().catch(() => ({}));
          setActiveFolderView(prev => ({
            ...prev,
            documents: (prev.documents || []).filter(d => d.id !== tempDoc.id)
          }));
          alert(`Error al procesar "${file.name}": ${err.detail || 'Verifica que el archivo no esté dañado.'}`);
        }
      } catch (uploadErr) {
        setActiveFolderView(prev => ({
          ...prev,
          documents: (prev.documents || []).filter(d => d.id !== tempDoc.id)
        }));
        console.warn('Error subiendo archivo:', uploadErr);
      }
    }
  };


  // Eliminar documento de la carpeta (Frontend y Backend MongoDB)
  const handleDeleteDoc = async (docIdentifier) => {
    if (!activeFolderView || !docIdentifier) return;

    // 1. Optimistic update inmediato en la interfaz
    const updatedDocs = (activeFolderView.documents || []).filter(
      d => d.id !== docIdentifier && d.name !== docIdentifier
    );
    const updatedFolder = {
      ...activeFolderView,
      documents: updatedDocs
    };
    setActiveFolderView(updatedFolder);
    const updatedFolders = folders.map(f => f.id === updatedFolder.id ? updatedFolder : f);
    saveFolders(updatedFolders);

    // 2. Eliminar del backend MongoDB y limpiar la caché de juego de la carpeta
    try {
      await fetch(`/api/v1/folders/${activeFolderView.id}/documents/${encodeURIComponent(docIdentifier)}`, {
        method: 'DELETE'
      });

      // 3. Re-sincronizar con el backend
      const res = await fetch('/api/v1/folders');
      if (res.ok) {
        const data = await res.json();
        if (data && data.folders) {
          setFolders(data.folders);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.folders));
          const current = data.folders.find(f => f.id === activeFolderView.id);
          if (current) {
            setActiveFolderView({
              ...current,
              documents: (current.documents || []).map(d => ({ ...d, isUploading: false }))
            });
          }
        }
      }
    } catch (err) {
      console.warn('Error eliminando documento del servidor:', err);
    }
  };


  // Iniciar el juego directamente con los materiales analizados de la carpeta
  const handlePlayDirectly = () => {
    if (!activeFolderView) return;
    onSelectFolder({
      ...activeFolderView,
      playDirectly: true
    });
  };


  const getDocIcon = (filename = '') => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return <FileText className="w-5 h-5 text-rose-400" />;
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (['mp3', 'wav', 'm4a'].includes(ext)) return <FileAudio className="w-5 h-5 text-amber-400" />;
    return <FileText className="w-5 h-5 text-cyan-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="relative w-full max-w-3xl rounded-[2.5rem] bg-[#162032] border-4 border-[#2d3f5d] shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] flex flex-col text-slate-100 max-h-[92vh] overflow-hidden"
      >
        {/* INPUT OCULTO PARA SUBIR ARCHIVOS DIRECTO A LA CARPETA */}
        <input 
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.mp3,.wav,.m4a"
          className="hidden"
          onChange={handleUploadFilesToFolder}
        />

        {/* ============================================================ */}
        {/* VISTA 1: LISTADO GENERAL DE CARPETAS DE AVENTURA             */}
        {/* ============================================================ */}
        {!activeFolderView && (
          <>
            {/* Cabecera Estilo Taberna / Inventario de Videojuego */}
            <div className="p-6 border-b-2 border-[#223147] bg-[#111927] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center text-amber-300 shadow-[0_4px_0_#78350f]">
                  <FolderArchive className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      🎒 Baúl de Asignaturas
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                    Mis Carpetas de Estudio
                  </h2>
                  <p className="text-xs text-slate-400">
                    Entra a una carpeta para ver sus documentos, subir más o iniciar la partida directamente.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center gap-2 shadow-[0_4px_0_#92400e] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Nueva Carpeta</span>
              </button>
            </div>

            {/* Contenido Principal con Tablero de Carpetas */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-[#0f1726]">
              
              {/* Formulario de Creación de Carpeta */}
              <AnimatePresence>
                {isCreating && (
                  <motion.form
                    initial={{ opacity: 0, scale: 0.95, height: 0 }}
                    animate={{ opacity: 1, scale: 1, height: 'auto' }}
                    exit={{ opacity: 0, scale: 0.95, height: 0 }}
                    onSubmit={handleCreateFolder}
                    className="overflow-hidden bg-[#1a263a] border-2 border-amber-400/50 rounded-3xl p-5 shadow-xl mb-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-amber-400" />
                        Crear Nueva Carpeta de Aventura
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Nombre (ej. Neuroanatomía, Derecho...)"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        className="bg-[#101724] border-2 border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="Descripción o tema (opcional)"
                        value={newFolderDesc}
                        onChange={(e) => setNewFolderDesc(e.target.value)}
                        className="bg-[#101724] border-2 border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_4px_0_#065f46] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Guardar y Entrar</span>
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Listado de Carpetas */}
              {folders.length === 0 ? (
                <div className="py-12 px-4 rounded-3xl border-2 border-dashed border-slate-700 bg-[#141d2c]/60 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-3xl bg-[#1b273b] border-2 border-slate-600 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                    <Folder className="w-8 h-8 opacity-60 text-amber-400/80" />
                  </div>
                  <h3 className="text-base font-bold text-slate-200">
                    Tu baúl está vacío
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mb-4">
                    Crea una carpeta para organizar tus materiales de estudio y comenzar a jugar.
                  </p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center gap-2 shadow-[0_4px_0_#92400e] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Crear Primera Carpeta</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {folders.map((folder) => {
                    const docsCount = folder.documents?.length || 0;
                    const gamesCount = folder.games?.length || 0;

                    return (
                      <div
                        key={folder.id}
                        onClick={() => {
                          setActiveFolderView(folder);
                          fetch('/api/v1/folders')
                            .then(r => r.ok ? r.json() : null)
                            .then(data => {
                              if (data?.folders) {
                                setFolders(data.folders);
                              }
                            }).catch(() => {});
                        }}
                        className="relative p-5 rounded-3xl border-2 border-[#223147] hover:border-amber-400/80 bg-[#141d2c] hover:bg-[#1a263a] transition-all cursor-pointer flex flex-col justify-between group shadow-md hover:scale-[1.01]"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#1b273b] text-amber-400 border border-amber-400/20 shadow-inner group-hover:bg-amber-400 group-hover:text-slate-950 transition-all">
                                <Folder className="w-6 h-6 fill-current opacity-90" />
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-white uppercase truncate max-w-[170px]">
                                  {folder.name}
                                </h4>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {folder.created_at || 'Misión Activa'}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => handleDeleteFolder(e, folder.id)}
                              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors opacity-70 hover:opacity-100 cursor-pointer"
                              title="Eliminar carpeta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-xs text-slate-300 line-clamp-2 mt-1 pl-1">
                            {folder.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 font-bold text-amber-300">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-amber-400" />
                              {docsCount} {docsCount === 1 ? 'archivo' : 'archivos'}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="flex items-center gap-1 text-cyan-300">
                              <Layers className="w-3.5 h-3.5 text-cyan-400" />
                              {gamesCount} partidas
                            </span>
                          </span>

                          <span className="flex items-center gap-1 font-bold text-slate-400 group-hover:text-amber-300 transition-colors">
                            <span>Entrar</span>
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pie informativo */}
            <div className="p-5 border-t-2 border-[#223147] bg-[#111927] flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Haz clic sobre cualquier carpeta para abrir su contenido y opciones</span>
              </span>
              <span className="font-bold text-slate-300">
                Total: {folders.length} {folders.length === 1 ? 'carpeta' : 'carpetas'}
              </span>
            </div>
          </>
        )}


        {/* ============================================================ */}
        {/* VISTA 2: DENTRO DE UNA CARPETA (DOCUMENTOS + SUBIR + JUGAR)  */}
        {/* ============================================================ */}
        {activeFolderView && (
          <>
            {/* Cabecera Interior de la Carpeta */}
            <div className="p-6 border-b-2 border-[#223147] bg-[#111927] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveFolderView(null)}
                  className="p-2.5 rounded-2xl bg-[#1b273b] hover:bg-[#23334d] border-2 border-slate-600 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-95"
                  title="Volver al baúl de carpetas"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Carpeta Abierta
                    </span>
                    <span className="text-xs text-slate-400">
                      {activeFolderView.documents?.length || 0} archivos cargados
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                    {activeFolderView.name}
                  </h2>
                </div>
              </div>

              {/* Botón para Subir Más Archivos a esta Carpeta */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-2xl bg-[#1b2b3f] hover:bg-[#243954] border-2 border-cyan-400/60 text-cyan-300 font-black text-xs uppercase tracking-wide flex items-center gap-2 shadow-[0_4px_0_#0369a1] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                <span>Subir Más Archivos</span>
              </button>
            </div>

            {/* Listado de Documentos de la Carpeta */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-[#0f1726]">
              {(!activeFolderView.documents || activeFolderView.documents.length === 0) ? (
                <div className="py-12 px-4 rounded-3xl border-2 border-dashed border-slate-700 bg-[#141d2c]/60 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-3xl bg-[#1b273b] border-2 border-slate-600 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                    <UploadCloud className="w-8 h-8 text-cyan-400/80" />
                  </div>
                  <h3 className="text-base font-bold text-slate-200">
                    No hay documentos en esta carpeta todavía
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mb-4">
                    Sube tus PDFs, imágenes, audios o textos para que la IA genere preguntas y cartas didácticas.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center gap-2 shadow-[0_4px_0_#0369a1] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Subir Documentos Ahora</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase px-1">
                    <span>Archivos listos para el juego ({activeFolderView.documents.length})</span>
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Listos para generar tablero
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeFolderView.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={`p-3.5 rounded-2xl border-2 flex items-center justify-between group transition-all ${
                          doc.isUploading
                            ? 'bg-[#0f1f12] border-emerald-500/40 animate-pulse'
                            : 'bg-[#141d2c] border-[#223147] hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-[#1b273b] border border-slate-700 flex items-center justify-center shrink-0">
                            {doc.isUploading
                              ? <span className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                              : getDocIcon(doc.name)
                            }
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <h5 className="text-xs font-bold text-white truncate max-w-[170px]">
                                {doc.name}
                              </h5>
                              {doc.is_analyzed && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" title="Documento ya analizado y listo para reutilizar">
                                  ⚡ Reutilizable
                                </span>
                              )}
                            </div>
                            <span className={`text-[10px] font-mono ${
                              doc.isUploading ? 'text-emerald-400' : 'text-slate-400'
                            }`}>
                              {doc.isUploading
                                ? '⚡ Extrayendo texto...'
                                : `${doc.size || 'Cargado'} • ${doc.char_count ? doc.char_count.toLocaleString() + ' chars' : doc.uploaded_at || 'Procesado'}`
                              }
                            </span>
                          </div>
                        </div>

                        {!doc.isUploading && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDoc(doc.id || doc.name);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-500/30"
                            title="Quitar archivo de la carpeta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Barra Inferior con Opciones de Juego */}
            <div className="p-5 border-t-2 border-[#223147] bg-[#111927] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                {(() => {
                  const readyDocs = (activeFolderView.documents || []).filter(d => !d.isUploading);
                  const uploadingDocs = (activeFolderView.documents || []).filter(d => d.isUploading);
                  if (uploadingDocs.length > 0) return (
                    <span className="flex items-center gap-2 font-semibold text-amber-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      <span>Procesando {uploadingDocs.length} archivo(s)... Espera un momento.</span>
                    </span>
                  );
                  if (readyDocs.length > 0) return (
                    <span className="flex items-center gap-2 font-semibold text-emerald-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span>{readyDocs.length} {readyDocs.length === 1 ? 'documento procesado' : 'documentos procesados'}. ¡Listo para jugar!</span>
                    </span>
                  );
                  return (
                    <span className="text-slate-400">
                      Sube al menos un documento para generar las cartas y el tablero.
                    </span>
                  );
                })()}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Iniciar el juego directamente con los archivos procesados de la carpeta */}
                {(() => {
                  const readyCount = (activeFolderView.documents || []).filter(d => !d.isUploading).length;
                  const isDisabled = readyCount === 0;
                  return (
                    <button
                      disabled={isDisabled}
                      onClick={handlePlayDirectly}
                      className={`w-full sm:w-auto px-7 py-3 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
                        isDisabled
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                          : 'bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 shadow-[0_5px_0_#065f46] active:translate-y-1 active:shadow-none cursor-pointer'
                      }`}
                    >
                      <Gamepad2 className="w-5 h-5 stroke-[2.5]" />
                      <span>Iniciar Juego Directamente</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          </>
        )}

      </motion.div>
    </div>
  );
}
