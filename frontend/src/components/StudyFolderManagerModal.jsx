import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth, uploadWithProgress } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderPlus,
  Folder,
  Sparkles,
  Plus,
  Trash2,
  Layers,
  PlayCircle,
  ChevronRight,
  FolderArchive,
  UploadCloud,
  FileText,
  FileAudio,
  Image as ImageIcon,
  ArrowLeft,
  Gamepad2,
  CheckCircle2,
  Zap,
  Loader2,
  X,
  Home,
  AlertCircle,
  Palmtree,
  Pin,
  School,
  Waves,
  Star
} from 'lucide-react';

const STORAGE_KEY = 'hubzy_user_study_folders';
// Clave de storage por usuario: las carpetas de una cuenta logueada NUNCA
// se escriben en la clave genérica — esa es del invitado y las filtraría a
// quien use el navegador después sin sesión.
const folderStorageKey = (user) =>
  user?.id ? `${STORAGE_KEY}_${user.id}` : STORAGE_KEY;

export default function StudyFolderManagerModal({
  isOpen,
  currentUser,
  onClose,
  onBackToMenu,
  onSelectFolder,
  onUpgradeToPro
}) {
  const userStorageKey = currentUser?.id ? `hubzy_user_study_folders_${currentUser.id}` : 'hubzy_user_study_folders';

  const [folders, setFolders] = useState(() => {
    try {
      const saved = localStorage.getItem(userStorageKey);
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

  // Estado de procesamiento de 5 segundos al iniciar juego
  const [isProcessingGame, setIsProcessingGame] = useState(false);
  const [processingCountdown, setProcessingCountdown] = useState(5);
  const processingTimerRef = useRef(null);

  // Catálogo de documentos de muestra (probar sin PDF propio)
  const [sampleCatalog, setSampleCatalog] = useState([]);
  const [addingSample, setAddingSample] = useState(null);

  // Errores de subida por archivo (reemplaza los alert() nativos)
  const [uploadErrors, setUploadErrors] = useState([]);

  // Detección de temas en curso para la carpeta abierta (archipiélago)
  const [detectingTopics, setDetectingTopics] = useState(false);
  // Toast de celebración cuando la detección revela temas nuevos
  const [topicsToast, setTopicsToast] = useState(null);

  // Limpiar temporizador al desmontar o cerrar modal
  useEffect(() => {
    return () => {
      if (processingTimerRef.current) clearInterval(processingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsProcessingGame(false);
      setProcessingCountdown(5);
      if (processingTimerRef.current) clearInterval(processingTimerRef.current);
    }
  }, [isOpen]);

  // Al abrir una carpeta con documentos pero sin islas detectadas, pedir al
  // backend la detección de temas (el upload ya la lanza en background; este
  // endpoint es idempotente — solo analiza docs sin topic_sections).
  // Aplica las islas devueltas por detect-topics y anuncia con un toast
  // cuando aparecen temas nuevos (momento "wow" del archipiélago).
  const applyIslands = (folderId, islands) => {
    const hadCount =
      activeFolderView?.id === folderId && Array.isArray(activeFolderView.islands)
        ? activeFolderView.islands.length
        : 0;
    setActiveFolderView((prev) =>
      prev?.id === folderId ? { ...prev, islands } : prev,
    );
    setFolders((prev) =>
      prev.map((x) => (x.id === folderId ? { ...x, islands } : x)),
    );
    const named = (islands || []).filter((i) => i?.name && i.name !== 'General');
    if (named.length && (islands?.length || 0) > hadCount) {
      setTopicsToast({
        count: named.length,
        names: named.slice(0, 3).map((i) => i.name),
      });
    }
  };

  // El toast se auto-oculta tras unos segundos
  useEffect(() => {
    if (!topicsToast) return;
    const t = setTimeout(() => setTopicsToast(null), 6500);
    return () => clearTimeout(t);
  }, [topicsToast]);

  useEffect(() => {
    const f = activeFolderView;
    if (!f?.id || f.id === 'folder_administracion_default') return;
    if (f.islands !== undefined) return;
    if (!(f.documents || []).some((d) => !d.isUploading)) return;
    let cancelled = false;
    setDetectingTopics(true);
    fetchWithAuth(`/api/v1/folders/${f.id}/detect-topics`, { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.islands) applyIslands(f.id, d.islands);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDetectingTopics(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolderView?.id]);

  // Carpeta por defecto con administracion.pdf integrado
  const DEFAULT_ADMIN_FOLDER = {
    id: "folder_administracion_default",
    name: "Administración General",
    description: "Origen y desarrollo de la administración (Perspectivas - UCB San Pablo). 11 páginas analizadas.",
    created_at: "Listo para jugar",
    user_id: currentUser?.id || "guest",
    documents: [
      {
        id: "doc_administracion_pdf",
        name: "administracion.pdf",
        size: "245 KB",
        uploaded_at: "Integrado",
        is_processed: true,
        extracted_text_preview: "La administración es una de las actividades humanas más importantes, encargada de organizar y dirigir el trabajo individual y colectivo..."
      }
    ],
    games: []
  };

  // Cargar las carpetas privadas del usuario activo desde el backend o localStorage
  useEffect(() => {
    if (!isOpen) return;
    const currentKey = folderStorageKey(currentUser);
    try {
      const saved = localStorage.getItem(currentKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.some(f => f.id === DEFAULT_ADMIN_FOLDER.id || f.name === DEFAULT_ADMIN_FOLDER.name)) {
          parsed.unshift(DEFAULT_ADMIN_FOLDER);
        }
        setFolders(parsed);
      } else {
        setFolders([DEFAULT_ADMIN_FOLDER]);
      }
    } catch {
      setFolders([DEFAULT_ADMIN_FOLDER]);
    }

    // Catálogo de muestras curadas (una sola vez por apertura)
    fetch('/api/v1/folders/samples/catalog')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.samples) setSampleCatalog(data.samples); })
      .catch(() => {});

    const userIdParam = currentUser?.id ? `?user_id=${currentUser.id}` : '';
    fetchWithAuth(`/api/v1/folders${userIdParam}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.folders) {
          const list = data.folders;
          if (!list.some(f => f.id === DEFAULT_ADMIN_FOLDER.id || f.name === DEFAULT_ADMIN_FOLDER.name)) {
            list.unshift(DEFAULT_ADMIN_FOLDER);
          }
          setFolders(list);
          localStorage.setItem(currentKey, JSON.stringify(list));
        }
      })
      .catch(() => {});
    // DEFAULT_ADMIN_FOLDER es constante de módulo — no es dep reactiva.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUser]);

  const saveFolders = (updatedList) => {
    setFolders(updatedList);
    localStorage.setItem(
      folderStorageKey(currentUser),
      JSON.stringify(updatedList),
    );
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
      user_id: currentUser?.id || 'guest',
      documents: [],
      games: []
    };

    try {
      const res = await fetchWithAuth('/api/v1/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderItem.name,
          description: folderItem.description,
          user_id: currentUser?.id || 'guest'
        })
      });
      if (res.ok) {
        const savedDoc = await res.json();
        folderItem.id = savedDoc.id || folderItem.id;
      }
    } catch (err) {
      console.warn("MongoDB no respondió, guardando en local storage privado:", err);
    }

    const updated = [folderItem, ...folders];
    saveFolders(updated);
    setNewFolderName('');
    setNewFolderDesc('');
    setIsCreating(false);
    // Abrir directamente la carpeta creada
    setActiveFolderView(folderItem);
  };

  // Añadir documento de muestra a la carpeta activa
  const handleAddSample = async (sampleId) => {
    if (!activeFolderView || addingSample) return;
    setAddingSample(sampleId);
    try {
      const res = await fetchWithAuth(
        `/api/v1/folders/${activeFolderView.id}/add-sample`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sample_id: sampleId }),
        }
      );
      const data = res.ok ? await res.json() : null;
      const doc = data?.document || {
        id: `doc_sample_${sampleId}`,
        name: sampleCatalog.find(s => s.id === sampleId)?.name || 'Muestra',
        is_sample: true,
      };
      const docWithMeta = { ...doc, uploaded_at: 'Muestra', is_sample: true };
      const updated = folders.map(f =>
        f.id === activeFolderView.id
          ? { ...f, documents: [...(f.documents || []), docWithMeta] }
          : f
      );
      saveFolders(updated);
      setActiveFolderView(prev =>
        prev ? { ...prev, documents: [...(prev.documents || []), docWithMeta] } : prev
      );
    } catch (err) {
      console.warn('Error añadiendo muestra:', err);
    } finally {
      setAddingSample(null);
    }
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
      await fetchWithAuth(`/api/v1/folders/${folderId}`, { method: 'DELETE' });
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
    // Solo reacciona a cambios de `folders`; incluir activeFolderView crearía un bucle.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [folders]);

  // Sube UN archivo con progreso real vía XHR. Errores quedan en
  // `uploadErrors` como {name, message, file} para reintento individual.
  const uploadOne = async (file, folderId) => {
    const updateTempDoc = (docId, patch) =>
      setActiveFolderView(prev => ({
        ...prev,
        documents: (prev.documents || []).map(d =>
          d.id === docId ? { ...d, ...patch } : d
        ),
      }));
    const removeTempDoc = (docId) =>
      setActiveFolderView(prev => ({
        ...prev,
        documents: (prev.documents || []).filter(d => d.id !== docId),
      }));

    const tempDoc = {
      id: `uploading_${Date.now()}_${file.name}`,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.name.split('.').pop().toLowerCase(),
      uploaded_at: 'Subiendo… 0%',
      isUploading: true,
      progress: 0,
    };
    setActiveFolderView(prev => ({
      ...prev,
      documents: [tempDoc, ...(prev.documents || []).filter(d => d.name !== file.name)],
    }));

    const formData = new FormData();
    formData.append('file', file);
    try {
      await uploadWithProgress(
        `/api/v1/folders/${folderId}/upload-document`,
        formData,
        {
          onProgress: (p) =>
            updateTempDoc(tempDoc.id, {
              progress: p,
              uploaded_at: p < 100 ? `Subiendo… ${p}%` : 'Extrayendo texto…',
            }),
        },
      );
      updateTempDoc(tempDoc.id, { uploaded_at: 'Procesado ✓', isUploading: false, progress: 100 });
    } catch (upErr) {
      removeTempDoc(tempDoc.id);
      if (upErr.status === 402) {
        if (onUpgradeToPro) onUpgradeToPro();
        else {
          setUploadErrors(prev => [
            ...prev,
            { name: file.name, message: upErr.message || 'límite del plan alcanzado.', file },
          ]);
        }
        return;
      }
      const friendly =
        upErr.status === 413
          ? 'Supera el tamaño máximo de 25 MB.'
          : upErr.status === 415
            ? 'Formato no soportado. Usa PDF, DOCX, TXT, MD, CSV o imagen.'
            : upErr.status === 422
              ? 'No se pudo leer el archivo (¿está protegido o dañado?).'
              : upErr.message || 'Verifica que el archivo no esté dañado.';
      setUploadErrors(prev => [...prev, { name: file.name, message: friendly, file }]);
    }
  };

  // Reintentar una subida fallida sin obligar al usuario a re-seleccionar.
  const retryUpload = async (idx) => {
    const entry = uploadErrors[idx];
    if (!entry?.file || !activeFolderView) return;
    setUploadErrors(prev => prev.filter((_, i) => i !== idx));
    await uploadOne(entry.file, activeFolderView.id);
    const refreshRes = await fetchWithAuth('/api/v1/folders').catch(() => null);
    if (refreshRes?.ok) {
      const data = await refreshRes.json();
      if (data?.folders) setFolders(data.folders);
    }
  };

  // Subir documentos REALES a la carpeta actualmente abierta.
  // Subida paralela acotada (3 a la vez) con progreso real por archivo vía XHR.
  // El límite freemium lo impone el backend (402 → modal de upgrade).
  const handleUploadFilesToFolder = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !activeFolderView) return;
    // Las materias de colegio son de solo lectura para estudiantes
    if (activeFolderView.is_school_folder && activeFolderView.user_id !== currentUser?.id) return;
    e.target.value = '';
    setUploadErrors([]);
    const folderId = activeFolderView.id;

    const CONCURRENCY = 3;
    for (let i = 0; i < files.length; i += CONCURRENCY) {
      await Promise.all(files.slice(i, i + CONCURRENCY).map(f => uploadOne(f, folderId)));
    }

    // Refrescar la lista una sola vez al final del lote (no por archivo)
    const refreshRes = await fetchWithAuth('/api/v1/folders').catch(() => null);
    if (refreshRes && refreshRes.ok) {
      const data = await refreshRes.json();
      if (data && data.folders) {
        setFolders(data.folders);
        localStorage.setItem(
          folderStorageKey(currentUser),
          JSON.stringify(data.folders),
        );
        const currentFolder = data.folders.find(f => f.id === folderId);
        if (currentFolder) {
          setActiveFolderView(prev => {
            if (!prev || prev.id !== folderId) return prev;
            const stillUploading = (prev.documents || []).filter(d => d.isUploading);
            return {
              ...currentFolder,
              documents: [
                ...stillUploading,
                ...(currentFolder.documents || []).map(d => ({ ...d, isUploading: false })),
              ],
            };
          });
          // Las islas se construyen en background tras la subida: re-sondear
          // una vez para que aparezcan sin tener que reabrir la carpeta.
          setTimeout(async () => {
            try {
              const r = await fetchWithAuth(
                `/api/v1/folders/${folderId}/detect-topics`,
                { method: 'POST' },
              );
              if (r.ok) {
                const d = await r.json();
                if (d?.islands) applyIslands(folderId, d.islands);
              }
            } catch {}
          }, 4000);
        }
      }
    }
  };


  // Eliminar documento de la carpeta (Frontend y Backend MongoDB)
  const handleDeleteDoc = async (docIdentifier) => {
    if (!activeFolderView || !docIdentifier) return;
    // Las materias de colegio son de solo lectura para estudiantes
    if (activeFolderView.is_school_folder && activeFolderView.user_id !== currentUser?.id) return;

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
      await fetchWithAuth(`/api/v1/folders/${activeFolderView.id}/documents/${encodeURIComponent(docIdentifier)}`, {
        method: 'DELETE'
      });

      // 3. Re-sincronizar con el backend
      const res = await fetchWithAuth('/api/v1/folders');
      if (res.ok) {
        const data = await res.json();
        if (data && data.folders) {
          setFolders(data.folders);
          localStorage.setItem(
            folderStorageKey(currentUser),
            JSON.stringify(data.folders),
          );
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


  // Iniciar el juego: Al instante (0 ms) si ya está analizado, o con breve cuenta regresiva si es nuevo
  const handlePlayDirectly = () => {
    if (!activeFolderView || isProcessingGame) return;

    // Si la carpeta ya tiene análisis previo o es la carpeta estática por defecto, ENTRAR INMEDIATAMENTE
    const isAlreadyAnalyzed = Boolean(
      activeFolderView.cached_boards || 
      activeFolderView.cached_board || 
      activeFolderView.id === 'folder_administracion_default'
    );

    if (isAlreadyAnalyzed) {
      onSelectFolder({
        ...activeFolderView,
        playDirectly: true
      });
      return;
    }

    setIsProcessingGame(true);
    setProcessingCountdown(3);

    let secondsLeft = 3;
    if (processingTimerRef.current) clearInterval(processingTimerRef.current);

    processingTimerRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        setProcessingCountdown(secondsLeft);
      } else {
        clearInterval(processingTimerRef.current);
        processingTimerRef.current = null;
        setIsProcessingGame(false);
        onSelectFolder({
          ...activeFolderView,
          playDirectly: true
        });
      }
    }, 1000);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-2 md:p-4 bg-black/85 backdrop-blur-md select-none font-sans"
      role="dialog"
      aria-modal="true"
      aria-label="Baúl de carpetas de estudio"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="relative w-full h-full max-w-7xl max-h-[96vh] rounded-2xl sm:rounded-[2rem] bg-[#122443] border-4 border-[#0a162b] shadow-[0_16px_0_#050a13,0_25px_60px_rgba(0,0,0,0.8)] flex flex-col text-white overflow-hidden"
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
            <div className="p-6 border-b-3 border-[#1e3a6c] bg-[#0a162b] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FFB400] border-3 border-[#122443] flex items-center justify-center text-[#122443] shadow-[0_4px_0_#D48800]">
                  <FolderArchive className="w-8 h-8 text-[#122443]" />
                </div>
                <div>

                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1 drop-shadow">
                    Mis Carpetas de Estudio
                  </h2>
                  <p className="text-xs text-slate-300 font-bold">
                    Documentos y reactivos privados de {currentUser?.username || 'tu cuenta'}. Nadie más tiene acceso a ellos.
                  </p>

                </div>
              </div>

              <div className="flex items-center gap-2">
                {onBackToMenu && (
                  <button
                    onClick={onBackToMenu}
                    className="px-3.5 py-2.5 rounded-2xl bg-[#0a162b] hover:bg-[#1a335e] border-2 border-[#1e3a6c] border-b-4 border-b-[#050a13] text-[#FFB400] font-black text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-[0_4px_0_#050a13] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                    title="Volver a la Pantalla de Inicio / Menú Principal"
                  >
                    <Home className="w-4 h-4 stroke-[2.5]" />
                    <span className="hidden sm:inline">Menú</span>
                  </button>
                )}

                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2.5 rounded-2xl bg-[#FF7A00] hover:bg-[#ff8c1a] border-2 border-[#ff9b38] border-b-4 border-b-[#D45B00] text-white font-black text-xs uppercase tracking-wide flex items-center gap-2 shadow-[0_4px_0_#050a13] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span className="hidden sm:inline">Nueva Carpeta</span>
                </button>

                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-2 border-[#1e3a6c] border-b-4 border-b-[#050a13] text-slate-300 hover:text-white transition-all cursor-pointer shadow-[0_4px_0_#050a13] active:translate-y-1 active:shadow-none"
                    title="Cerrar ventana"
                  >
                    <X className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
              </div>
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

              {/* Onboarding guiado: solo cuando el usuario aún no tiene
                  carpetas propias (la de ejemplo no cuenta). */}
              {!folders.some(
                (f) =>
                  f.id !== DEFAULT_ADMIN_FOLDER.id &&
                  f.id !== 'folder_administracion_default',
              ) && (
                <div className="rounded-3xl border-2 border-cyan-500/30 bg-gradient-to-r from-[#0d1f3c] to-[#122443] p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-cyan-300 mb-1.5">
                      Tu primera partida en 3 pasos
                    </p>
                    <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-bold text-slate-200">
                      <li className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[10px] font-black inline-flex items-center justify-center">1</span>
                        Crea una carpeta
                      </li>
                      <li className="text-slate-500">→</li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[10px] font-black inline-flex items-center justify-center">2</span>
                        Sube tu PDF o audio
                      </li>
                      <li className="text-slate-500">→</li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-black inline-flex items-center justify-center">3</span>
                        Juega tu primera isla
                      </li>
                    </ol>
                  </div>
                  <button
                    onClick={() => setActiveFolderView(DEFAULT_ADMIN_FOLDER)}
                    className="shrink-0 px-4 py-2.5 rounded-2xl bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center gap-2 shadow-[0_4px_0_#065f46] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                  >
                    <Gamepad2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Probar con material de ejemplo</span>
                  </button>
                </div>
              )}

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                  {folders.map((folder) => {
                    const docsCount = folder.documents?.length || 0;
                    const gamesCount = folder.games?.length || 0;
                    const prog = folder.campaign_progress;
                    const progLevel = prog?.unlocked_level || 1;
                    const progStars = prog?.level_stars
                      ? Object.values(prog.level_stars).reduce((a, b) => a + b, 0)
                      : 0;

                    return (
                      <div
                        key={folder.id}
                        onClick={() => {
                          setActiveFolderView(folder);
                          fetchWithAuth('/api/v1/folders')
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
                                {folder.is_school_folder && (
                                  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-[9px] font-black text-emerald-300 uppercase tracking-wide align-middle">
                                    <School className="w-2.5 h-2.5" /> Colegio
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Solo el dueño (docente) puede borrar la carpeta;
                                estudiantes ven la materia como solo-lectura. */}
                            {(!folder.is_school_folder || folder.user_id === currentUser?.id) && (
                              <button
                                onClick={(e) => handleDeleteFolder(e, folder.id)}
                                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors opacity-70 hover:opacity-100 cursor-pointer"
                                title="Eliminar carpeta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Tarea asignada por el docente (badge informativo, sin presión) */}
                          {folder.assignment && (
                            <div className="mb-2 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-[10px] font-bold text-amber-300 flex items-center gap-1.5">
                              <Pin className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {folder.assignment.title}
                                {folder.assignment.due_date && ` · para el ${folder.assignment.due_date}`}
                              </span>
                            </div>
                          )}

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
                            {progLevel > 1 && (
                              <>
                                <span className="text-slate-600">•</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectFolder({
                                      ...folder,
                                      playDirectly: true,
                                    });
                                  }}
                                  className="flex items-center gap-1 text-emerald-300 hover:text-emerald-100 bg-emerald-500/10 hover:bg-emerald-500/25 px-2 py-0.5 rounded-lg border border-emerald-500/40 transition-colors cursor-pointer"
                                  title={`Continuar campaña en el Nivel ${progLevel}`}
                                >
                                  <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  Nivel {progLevel} · <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{progStars}
                                  {prog?.total_xp > 0 && ` · ${prog.total_xp} XP`}
                                </button>
                              </>
                            )}
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
            <div className="p-6 border-b-3 border-[#1e3a6c] bg-[#0a162b] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveFolderView(null)}
                  className="p-2.5 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-2 border-[#1e3a6c] border-b-4 border-b-[#050a13] text-white transition-all cursor-pointer flex items-center justify-center shadow-md active:translate-y-1 active:shadow-none"
                  title="Volver al baúl de carpetas"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FF7A00] text-white border-2 border-[#D45B00]">
                      Carpeta Abierta
                    </span>
                    <span className="text-xs text-slate-300 font-bold">
                      {activeFolderView.documents?.length || 0} archivos cargados
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5 drop-shadow">
                    {activeFolderView.name}
                  </h2>
                </div>
              </div>

              {/* Botón para Subir Más Archivos — oculto a estudiantes en carpetas de colegio */}
              {(!activeFolderView.is_school_folder || activeFolderView.user_id === currentUser?.id) && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-2xl bg-[#FF7A00] hover:bg-[#ff8c1a] border-2 border-[#ff9b38] border-b-4 border-b-[#D45B00] text-white font-black text-xs uppercase tracking-wide flex items-center gap-2 shadow-[0_4px_0_#050a13] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-white stroke-[2.8]" />
                <span className="drop-shadow-sm">Subir Más Archivos</span>
              </button>
              )}
            </div>

            {/* Franja de muestras: probar el juego sin tener un PDF a mano */}
            {sampleCatalog.length > 0 && (
              <div className="px-6 py-3 bg-[#0d1a30] border-b-2 border-[#1e3a6c] flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mr-1">
                  ¿Sin material? Prueba un ejemplo:
                </span>
                {sampleCatalog.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleAddSample(s.id)}
                    disabled={Boolean(addingSample)}
                    title={s.description}
                    className="px-3 py-1.5 rounded-xl bg-[#1a263a] hover:bg-[#223147] border-2 border-[#2b3f5f] hover:border-cyan-400/60 text-[11px] font-bold text-cyan-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                  >
                    {addingSample === s.id ? 'Añadiendo…' : `+ ${s.name.replace('.txt', '')}`}
                  </button>
                ))}
              </div>
            )}

            {/* Listado de Documentos de la Carpeta */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-[#0f1726]">
              {/* ======= ARCHIPIÉLAGO DE ISLAS (un tema = una campaña) ======= */}
              {(detectingTopics || (activeFolderView.islands || []).length > 0) && (
                <div className="rounded-3xl border-2 border-[#1e3a6c] bg-gradient-to-b from-[#0d1f3c] to-[#0a162b] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-cyan-200">
                      Archipiélago de Temas
                    </h3>
                    {detectingTopics && (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Detectando temas…
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Cada isla es un tema detectado en tus documentos, con su propia campaña de niveles. Las preguntas nunca mezclan temas.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(activeFolderView.islands || []).map((isl) => {
                      const p = isl.campaign_progress || {};
                      const stars = Object.values(p.level_stars || {}).reduce((a, b) => a + b, 0);
                      const lvl = p.current_level || p.unlocked_level || 1;
                      return (
                        <button
                          key={isl.id}
                          onClick={() =>
                            onSelectFolder({
                              ...activeFolderView,
                              playDirectly: true,
                              selectedIsland: isl,
                            })
                          }
                          className="group text-left rounded-2xl border-2 border-[#2b3f5f] hover:border-cyan-400/70 bg-[#111c30] hover:bg-[#152441] p-4 transition-all cursor-pointer shadow-[0_3px_0_#050a13] active:translate-y-0.5 active:shadow-none"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <Palmtree className="w-6 h-6 text-cyan-300 group-hover:text-cyan-100 transition-colors" />
                            <span className="flex items-center gap-1.5">
                              {/* Tarea del docente dirigida a esta isla */}
                              {activeFolderView.assignment?.island_id === isl.id && (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50"
                                  title={activeFolderView.assignment.title}
                                >
                                  <Pin className="w-2.5 h-2.5" /> Tarea
                                </span>
                              )}
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                {isl.total_levels} niveles
                              </span>
                            </span>
                          </div>
                          <h4 className="mt-2 font-black text-white text-sm leading-tight line-clamp-2">
                            {isl.name}
                          </h4>
                          <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                            <span className="inline-flex items-center gap-1 text-amber-300">
                              {stars > 0 ? (<><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {stars}</>) : 'Sin explorar'}
                              {p.total_xp > 0 && <span className="text-slate-400"> · {p.total_xp} XP</span>}
                            </span>
                            <span className="flex items-center gap-1 text-emerald-300 group-hover:text-emerald-100">
                              <PlayCircle className="w-3.5 h-3.5" />
                              {lvl > 1 || stars > 0 ? `Continuar N${lvl}` : 'Jugar'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {(activeFolderView.islands || []).length > 0 && (
                    <button
                      onClick={() =>
                        onSelectFolder({
                          ...activeFolderView,
                          playDirectly: true,
                          selectedIsland: null,
                        })
                      }
                      className="mt-3 w-full text-center text-[11px] font-bold text-slate-400 hover:text-cyan-200 py-1.5 rounded-xl border border-dashed border-slate-600 hover:border-cyan-500/50 transition-colors cursor-pointer"
                    >
                      <Waves className="w-3.5 h-3.5 inline-block align-[-2px] mr-1" />Jugar con todo el contenido mezclado (campaña general)
                    </button>
                  )}
                </div>
              )}

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
                  {(!activeFolderView.is_school_folder || activeFolderView.user_id === currentUser?.id) && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-2xl bg-[#FF7A00] hover:bg-[#ff8c1a] border-2 border-[#ff9b38] border-b-4 border-b-[#D45B00] text-white font-black text-xs uppercase tracking-wide flex items-center gap-2 shadow-[0_4px_0_#050a13] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Subir Documentos Ahora</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const readyCount = (activeFolderView.documents || []).filter(d => !d.isUploading).length;
                    const uploadingCount = (activeFolderView.documents || []).filter(d => d.isUploading).length;
                    return (
                      <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase px-1">
                        <span>
                          {uploadingCount > 0 ? (
                            <span className="text-sky-300 flex items-center gap-1.5 normal-case font-bold">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                              Subiendo archivo al servidor ({uploadingCount})
                            </span>
                          ) : (
                            `Archivos en la carpeta (${readyCount})`
                          )}
                        </span>
                        {uploadingCount > 0 ? (
                          <span className="text-[11px] text-sky-400 font-medium flex items-center gap-1 normal-case">
                            Cargando archivo...
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Archivo subido (esperando tu orden para procesar)
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {uploadErrors.length > 0 && (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 space-y-2">
                      {uploadErrors.map((err, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                          <p className="flex-1 min-w-0 text-[11px] font-semibold text-rose-200">
                            <span className="font-black text-rose-300">{err.name}</span>
                            <span className="text-rose-300/80"> — {err.message}</span>
                          </p>
                          <button
                            onClick={() => retryUpload(i)}
                            className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-[10px] font-black uppercase tracking-wide text-rose-200 transition-all cursor-pointer"
                          >
                            Reintentar
                          </button>
                          <button
                            onClick={() => setUploadErrors(prev => prev.filter((_, j) => j !== i))}
                            className="shrink-0 p-1 text-rose-400/60 hover:text-rose-300 cursor-pointer"
                            aria-label={`Descartar error de ${err.name}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeFolderView.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={`p-3.5 rounded-2xl border-2 flex items-center justify-between group transition-all ${
                          doc.isUploading
                            ? 'bg-[#1a2318] border-amber-500/50 animate-pulse'
                            : 'bg-[#141d2c] border-[#223147] hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-[#1b273b] border border-slate-700 flex items-center justify-center shrink-0">
                            {doc.isUploading
                              ? <span className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                              : getDocIcon(doc.name)
                            }
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <h5 className="text-xs font-bold text-white truncate max-w-[170px]">
                                {doc.name}
                              </h5>
                              {doc.is_analyzed && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1" title="Documento ya analizado y listo para reutilizar">
                                  <Zap className="w-2.5 h-2.5 text-emerald-400" />
                                  Reutilizable
                                </span>
                              )}
                            </div>
                            <span className={`text-[10px] font-mono ${
                              doc.isUploading ? 'text-sky-300 font-bold' : 'text-slate-400'
                            }`}>
                              {doc.isUploading
                                ? (doc.uploaded_at || 'Cargando archivo...')
                                : `${doc.size || 'Cargado'} • ${doc.uploaded_at || 'Listo'}`
                              }
                            </span>
                          </div>
                        </div>

                        {!doc.isUploading && (!activeFolderView.is_school_folder || activeFolderView.user_id === currentUser?.id) && (
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
                  if (isProcessingGame) return (
                    <span className="flex items-center gap-2 font-semibold text-emerald-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>Generando preguntas y tablero... ({processingCountdown}s)</span>
                    </span>
                  );
                  const readyDocs = (activeFolderView.documents || []).filter(d => !d.isUploading);
                  const uploadingDocs = (activeFolderView.documents || []).filter(d => d.isUploading);
                  if (uploadingDocs.length > 0) return (
                    <span className="flex items-center gap-2 font-semibold text-sky-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
                      <span>Subiendo archivo a la carpeta... (Aún no se procesa)</span>
                    </span>
                  );
                  if (readyDocs.length > 0) return (
                    <span className="flex items-center gap-2 font-semibold text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span>{readyDocs.length} {readyDocs.length === 1 ? 'archivo guardado' : 'archivos guardados'}. Presiona el botón verde para iniciar y procesar con IA.</span>
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
                {/* Iniciar el juego directamente con los archivos procesados de la carpeta (Estilo Card Clash) */}
                {(() => {
                  const readyCount = (activeFolderView.documents || []).filter(d => !d.isUploading).length;
                  const isDisabled = readyCount === 0 || isProcessingGame;
                  return (
                    <button
                      disabled={isDisabled}
                      onClick={handlePlayDirectly}
                      className={`w-full sm:w-auto px-7 py-3 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 border-3 transition-all ${
                        isDisabled && !isProcessingGame
                          ? 'bg-slate-800 text-slate-500 border-[#1e3a6c] cursor-not-allowed opacity-50'
                          : isProcessingGame
                          ? 'bg-[#48C838] border-[#0a162b] text-white shadow-[0_0_20px_rgba(72,200,56,0.6)] cursor-wait font-black'
                          : 'bg-[#48C838] hover:bg-[#57d847] border-[#0a162b] border-b-5 border-b-[#28871E] text-white shadow-[0_5px_0_#050a13] active:translate-y-1 active:shadow-none cursor-pointer'
                      }`}
                    >
                      {isProcessingGame ? (
                        <>
                          <Loader2 className="w-5 h-5 stroke-[2.5] animate-spin text-white" />
                          <span>Procesando... {processingCountdown}s</span>
                        </>
                      ) : (
                        <>
                          <Gamepad2 className="w-5 h-5 stroke-[2.5] text-white" />
                          <span>Iniciar Juego Directamente</span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          </>
        )}

        {/* Toast: la detección de temas encontró islas nuevas */}
        <AnimatePresence>
          {topicsToast && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-md w-[92%] sm:w-auto rounded-2xl bg-[#0d2b16] border-2 border-emerald-500/50 shadow-[0_8px_30px_rgba(16,185,129,0.35)] px-5 py-4 flex items-start gap-3"
              role="status"
            >
              <Palmtree className="w-6 h-6 text-emerald-300 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-emerald-300">
                  {topicsToast.count === 1
                    ? '¡Detectamos 1 tema en tu material!'
                    : `¡Detectamos ${topicsToast.count} temas en tu material!`}
                </p>
                <p className="text-xs text-emerald-100/80 mt-0.5 truncate">
                  {topicsToast.names.join(' · ')}
                  {topicsToast.count > 3 ? '…' : ''} — cada isla tiene su propia campaña.
                </p>
              </div>
              <button
                onClick={() => setTopicsToast(null)}
                className="p-1 rounded-lg text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-500/15 cursor-pointer"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
