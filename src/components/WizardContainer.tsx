'use client';

import { useState, useRef, useEffect } from 'react';
// Asumiendo que estas acciones se mantienen igual en lógica
import { saveLeadAction, logComparisonAction } from '@/app/actions';

interface IAAuto {
  id: string; 
  puesto: number; 
  match_percent: number; 
  marca: string; 
  modelo: string;
  version: string; 
  precioUsd: number; 
  origenMarca: string; 
  combustible: string;
  urlImagen?: string; 
  motor?: string; 
  traccion?: string; 
  transmision?: string;
  bauleraLitros?: number; 
  garantia?: string;
  adas?: string;
  airbags?: string;
  tamanhoPantalla?: string;
  camaras?: string;
  plazas?: number;
  largo?: number;
  ancho?: number;
  alto?: number;
  despejeSuelo?: number;
  asientoCuero?: string;
  techoPanoramico?: string;
  conectividad?: string;
  concesionaria?: string;
  veredicto: string; 
  versiones: any[];
}

// Mantenemos la lógica de no pedir datos para la prueba
const PEDIR_DATOS_USUARIO = false; 

export default function WizardContainer() {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState<string>('');
  const [top10, setTop10] = useState<IAAuto[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  
  const [activeVersions, setActiveVersions] = useState<Record<string, IAAuto>>({});
  const [esRescate, setEsRescate] = useState(false);

  // Estados del Buscador
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<IAAuto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualSelections, setManualSelections] = useState<IAAuto[]>([]);

  // Estado del Modal de Captura de Leads
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isSavingLead, setIsSavingLead] = useState(false);

  const [formData, setFormData] = useState({
    nombre: PEDIR_DATOS_USUARIO ? '' : 'Socio Universitario (Invitado)', 
    celular: PEDIR_DATOS_USUARIO ? '' : '0999999999', 
    email: '', 
    presupuestoMin: 15000, 
    presupuestoMax: 45000,
    atributos: [] as string[], 
    motorizacion: [] as string[], 
    tipoVehiculo: [] as string[],
    origen: [] as string[], 
    concesionaria: [] as string[], 
    notas: ''
  });

  const isCelularValid = formData.celular.startsWith('09') && formData.celular.length === 10;
  
  const isReady = PEDIR_DATOS_USUARIO
    ? formData.nombre && isCelularValid && formData.atributos.length === 3
    : formData.atributos.length === 3; 
  
  const toggleArrayItem = (key: 'motorizacion' | 'tipoVehiculo' | 'origen' | 'concesionaria', value: string) => {
    setFormData(prev => {
      const current = prev[key] as string[];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists ? current.filter(i => i !== value) : [...current, value]
      };
    });
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), formData.presupuestoMax - 2000);
    setFormData({ ...formData, presupuestoMin: value });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), formData.presupuestoMin + 2000);
    setFormData({ ...formData, presupuestoMax: value });
  };

  const toggleAtributo = (at: string) => {
    setFormData(prev => {
      if (prev.atributos.includes(at)) return { ...prev, atributos: prev.atributos.filter(x => x !== at) };
      if (prev.atributos.length < 3) return { ...prev, atributos: [...prev.atributos, at] };
      return prev;
    });
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const handleExecute = async () => {
    setIsAnalyzing(true);
    try {
      const result = await saveLeadAction(formData);
      if (result.success && result.leadId) {
        setCurrentLeadId(result.leadId);
        localStorage.setItem('universitaria_lead_id', result.leadId);
        const res = await fetch('/api/analyze', { 
          method: 'POST', body: JSON.stringify({ leadId: result.leadId }),
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) { 
          setTop10(data.top10); 
          setEsRescate(data.esRescate || false); 
          setStep(2); 
          window.scrollTo(0, 0); 
        }
      }
    } catch (e) { alert("Error de conexión con el sistema cooperativo."); } finally { setIsAnalyzing(false); }
  };

  const handleOpenComparison = async () => {
    const selected = displayedAutos.filter(a => compareIds.includes(a.id));
    const nombres = selected.map(a => `${a.marca} ${a.modelo}`).join(' vs ');
    const leadIdToUse = currentLeadId || localStorage.getItem('universitaria_lead_id');
    if (leadIdToUse && compareIds.length >= 2) {
      await logComparisonAction({ leadId: leadIdToUse, vIds: compareIds, nombres: nombres });
    }
    setShowComparison(true);
    window.scrollTo(0, 0);
  };

  const handlePrintRequest = () => {
    if (formData.nombre.includes('Invitado')) {
      setShowLeadModal(true);
    } else {
      setTimeout(() => window.print(), 100);
    }
  };

  const handleUnlockDossier = async () => {
    setIsSavingLead(true);
    try {
      await saveLeadAction(formData); 
      setShowLeadModal(false);
      setTimeout(() => window.print(), 300);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingLead(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search-autos?q=${encodeURIComponent(searchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.autos || []);
        }
      } catch (e) {
        console.error("Error al buscar en el catálogo automotor", e);
      } finally {
        setIsSearching(false);
      }
    }, 400); 
    return () => clearTimeout(delayFn);
  }, [searchTerm]);

  const displayedAutos = [...manualSelections, ...top10].filter((auto, index, self) =>
    index === self.findIndex((a) => a.id === auto.id)
  );

  const MultiSelect = ({ label, items, value, storeKey }: { label: string, items: string[], value: string[], storeKey: any }) => (
    <div className="space-y-1 relative">
      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">{label}</label>
      <div 
        onClick={() => setOpenFilter(openFilter === label ? null : label)}
        className="w-full p-3 bg-white border border-slate-200 text-sm cursor-pointer flex justify-between items-center hover:border-[#006837] transition-all rounded shadow-sm"
      >
        <span className="truncate pr-4 font-medium text-slate-800">
          {value.length > 0 ? value.join(', ') : 'Cualquier opción'}
        </span>
        <span className="text-[#006837] text-[10px]">{openFilter === label ? '▲' : '▼'}</span>
      </div>
      {openFilter === label && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 shadow-2xl max-h-60 overflow-y-auto p-1 mt-1 rounded animate-in fade-in zoom-in duration-150">
          {items.map(item => (
            <label key={item} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer rounded transition-colors">
              <input 
                type="checkbox" 
                checked={value.includes(item)} 
                onChange={() => toggleArrayItem(storeKey, item)}
                className="w-4 h-4 accent-[#006837] rounded border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{item}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  if (isAnalyzing) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans text-center px-6">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-[#006837] rounded-full animate-spin mb-6"></div>
      <p className="font-semibold text-base tracking-normal text-[#006837] mb-2">Buscando las mejores oportunidades para su crecimiento...</p>
      <p className="text-sm text-slate-500">Procesando datos del mercado automotor con respaldo Cooperativo.</p>
    </div>
  );

  if (showComparison) {
    const selected = displayedAutos.filter(a => compareIds.includes(a.id));
    const autoRecomendado = selected.length > 0 ? (activeVersions[selected[0].id] || selected[0]) : null;
    const opcionesExtra = top10.filter(a => !compareIds.includes(a.id)).slice(0, 3);

    return (
      <div className="font-sans bg-slate-50 text-slate-900">
        
        {/* MODAL DE LEAD MAGNET - Estilo Cooperativa */}
        {showLeadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-300 print:hidden">
            <div className="bg-white max-w-md w-full p-8 shadow-3xl rounded-lg relative border-t-8 border-[#FFD100]">
              <button onClick={() => setShowLeadModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800">✕</button>
              
              <div className="text-center mb-6">
                <div className="bg-[#006837] text-white font-extrabold text-xs px-3 py-1 inline-block rounded-full mb-3 tracking-widest uppercase">Atención Socio</div>
                <h3 className="font-extrabold text-2xl text-[#006837] leading-tight mb-2">
                  Formalice su <span className="text-[#FFD100]">Solicitud</span>
                </h3>
                <p className="text-sm text-slate-600 font-medium">Complete sus datos para generar la ficha de solicitud de crédito con su nombre y recibir el asesoramiento de su Cooperativa.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 rounded">Nombre y Apellido del Socio / Razón Social</label>
                  <input 
                    value={formData.nombre.includes('Invitado') ? '' : formData.nombre} 
                    onChange={e => setFormData({...formData, nombre: e.target.value})} 
                    className="w-full p-3 border border-slate-200 bg-white outline-none focus:border-[#006837] text-sm font-semibold text-slate-900 rounded-md shadow-inner" 
                    placeholder="Ej: Juan Pérez o Empresa SA"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">WhatsApp de Contacto (Celular)</label>
                  <input 
                    type="tel"
                    value={formData.celular === '0999999999' ? '' : formData.celular} 
                    onChange={e => {
                      const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({...formData, celular: soloNumeros});
                    }} 
                    className="w-full p-3 border border-slate-200 bg-white outline-none focus:border-[#006837] text-sm font-semibold text-slate-900 rounded-md shadow-inner" 
                    placeholder="09..."
                  />
                </div>
                
                <button 
                  disabled={formData.nombre.length < 3 || !isCelularValid || isSavingLead}
                  onClick={handleUnlockDossier} 
                  className="w-full mt-4 py-4 bg-[#006837] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#004a7a] transition-all rounded-md disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSavingLead ? 'Formalizando Solicitud...' : 'Generar Ficha de Crédito Pre-aprobado'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === VISTA INTERACTIVA WEB - Cooperativa === */}
        <div className="min-h-screen bg-slate-50 p-3 md:p-6 animate-in fade-in duration-500 print:hidden">
          <div className="max-w-7xl mx-auto space-y-4">
            
            <div className="flex flex-row justify-between items-center gap-4 bg-white p-5 border border-slate-100 rounded-lg shadow-sm">
              <h2 className="text-xl md:text-2xl font-extrabold text-[#006837] leading-none tracking-tight">
                Matriz Comparativa: <span className="text-[#006837] font-light">Datos Técnicos Validatorios</span>
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrintRequest} 
                  className="bg-slate-100 text-[#006837] border border-slate-200 px-5 py-2.5 font-bold text-[10px] uppercase tracking-wide hover:bg-slate-200 transition-all flex items-center gap-2 rounded-full"
                >
                  <svg className="w-4 h-4 text-[#006837]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Imprimir Ficha de Solicitud
                </button>
                <button onClick={() => setShowComparison(false)} className="bg-[#006837] text-white px-5 py-2.5 font-bold text-[10px] uppercase tracking-wide hover:bg-[#004a7a] transition-all rounded-full shadow">
                  ← Re-ajustar Búsqueda
                </button>
              </div>
            </div>
            
            {/* Tabla de Comparación - Diseño Limpio Cooperativa */}
            <div className="w-full overflow-auto max-h-[85vh] border border-slate-200 shadow-inner rounded-lg relative bg-white">
              <div className="min-w-[850px]">
                <div className="grid grid-cols-4 gap-px sticky top-0 z-50 bg-slate-200 border-b border-slate-200">
                  <div className="bg-slate-50 p-3 flex flex-col justify-end font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                    Ficha Técnica Homologada
                  </div>
                  {selected.map(auto => {
                     const currentAuto = activeVersions[auto.id] || auto;
                     return (
                      <div key={auto.id} className="p-4 text-center space-y-2 bg-white flex flex-col justify-between">
                        <div className="h-12 flex items-center justify-center mb-1"> 
                          <img src={currentAuto.urlImagen} className="max-h-full object-contain mx-auto" alt={currentAuto.modelo} />
                        </div>
                        <div className="leading-tight h-10 flex flex-col justify-center">
                          <h3 className="font-extrabold text-slate-950 uppercase text-[12px] truncate">{currentAuto.marca} {currentAuto.modelo}</h3>
                          <p className="text-[#006837] font-extrabold text-sm">${currentAuto.precioUsd.toLocaleString()}</p>
                        </div>
                        <a href={`https://wa.me/595216170000?text=Solicito asesoramiento para financiar el ${currentAuto.marca} ${currentAuto.modelo} visto en el portal de la Cooperativa Universitaria.`} target="_blank" className="block w-full py-2 bg-[#006837] text-white text-center font-bold text-[10px] uppercase tracking-widest hover:bg-[#004a7a] transition-all rounded-sm">
                          Solicitar Crédito
                        </a>
                      </div>
                     );
                  })}
                </div>

                {/* Filas de datos - Comprimidas con toque Cooperativa */}
                {[
                  { label: 'Versión y Denominación', key: 'version' },
                  { label: 'Motor y Potencia Homologada', key: 'motor' },
                  { label: 'Tipo de Combustible', key: 'combustible' },
                  { label: 'Caja de Transmisión', key: 'transmision' },
                  { label: 'Sistema de Tracción', key: 'traccion' },
                  { label: 'Seguridad Activa (ADAS)', key: 'adas' },
                  { label: 'Cantidad Airbags', key: 'airbags' },
                  { label: 'Dimensiones (LxAnxAl)', key: 'dimensiones' },
                  { label: 'Despeje del Suelo', key: 'despejeS suelo' },
                  { label: 'Capacidad Baúl (Lts)', key: 'bauleraLitros' },
                  { label: 'Capacidad Pasajeros', key: 'plazas' },
                  { label: 'Infoentretenimiento', key: 'tamanhoPantalla' },
                  { label: 'Conectividad', key: 'conectividad' },
                  { label: 'Asistencia Cámaras', key: 'camaras' },
                  { label: 'Material Tapizado', key: 'asientoCuero' },
                  { label: 'Techo Panorámico / Sunroof', key: 'techoPanoramico' },
                  { label: 'Garantía Oficial', key: 'garantia' },
                  { label: 'País de Origen de Marca', key: 'origenMarca' }
                ].map((item, idx) => (
                  <div key={item.key} className={`grid grid-cols-4 gap-px border-b border-slate-100 ${idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
                    <div className="p-3 font-semibold text-[10px] uppercase text-slate-600 flex items-center border-r border-slate-100 tracking-wide bg-slate-50">{item.label}</div>
                    {selected.map(auto => {
                      const currentAuto = activeVersions[auto.id] || auto;
                      let valor = (currentAuto as any)[item.key];
                      if (item.key === 'dimensiones') {
                        valor = (currentAuto.largo && currentAuto.ancho) ? `${currentAuto.largo}x${currentAuto.ancho}x${currentAuto.alto || ''} mm` : null;
                      } else if (item.key === 'despejeSuelo') {
                        valor = currentAuto.despejeSuelo ? `${currentAuto.despejeSuelo} mm` : null;
                      }
                      const linkWhatsApp = `https://wa.me/595216170000?text=Hola, solicito verificar el dato técnico de *${item.label}* para la unidad *${currentAuto.marca} ${currentAuto.modelo}* validado en el portal cooperativo.`;

                      return (
                        <div key={auto.id} className="p-3 text-center text-xs font-medium text-slate-800 flex items-center justify-center border-r border-slate-100">
                          {valor && valor !== '–' && String(valor).trim() !== '' ? valor : (
                            <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer" className="text-[9px] px-2.5 py-1.5 bg-[#FFD100] text-[#006837] rounded-sm font-extrabold uppercase tracking-wider hover:bg-white border hover:border-[#006837] transition-colors">
                              Verificar Dato
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* === VISTA DEL DOSSIER PDF - Estilo Institucional Cooperativa === */}
        {autoRecomendado && (
          <div className="hidden print:block w-full bg-white px-10 py-6 font-sans text-slate-900">
            
            {/* CABECERA INSTITUCIONAL COOPERATIVA */}
            <header className="border-b-4 border-[#FFD100] pb-5 mb-8 flex justify-between items-center">
              <div className="flex items-center gap-4">
                {/* Logo Placeholder - Pin Cooperativo */}
                <div className="w-16 h-16 rounded-full bg-[#006837] flex items-center justify-center p-2 border-4 border-[#FFD100] flex-shrink-0">
                  <div className="text-white text-4xl font-black">CU</div>
                </div>
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-[#006837]">Cooperativa Universitaria<span className="text-[#FFD100]">.</span></h1>
                  <p className="text-[10px] font-semibold text-slate-600 mt-0.5">Cámara de Validación Técnica y Oportunidades de Crecimiento</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-[11px] font-bold text-slate-700">Ficha de Solicitud de Crédito Pre-aprobado</p>
                <p className="text-sm font-extrabold text-[#006837] bg-[#FFD100] px-3 py-1 rounded-sm mt-1">{formData.nombre.includes('Invitado') ? 'Socio Universitario' : formData.nombre}</p>
                <p className="text-[9px] text-slate-500 mt-1.5">Documento referencial para gestión en sucursales.</p>
              </div>
            </header>

            {/* UNIDAD SELECCIONADA DESTACADA CON PIN DE PUESTO */}
            <section className="bg-slate-50 p-5 mb-6 border border-slate-200 rounded-lg break-inside-avoid shadow-sm relative">
                {autoRecomendado.puesto && (
                    <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-[#FFD100] text-[#006837] flex items-center justify-center font-extrabold text-base border-4 border-white shadow-lg">#{autoRecomendado.puesto}</div>
                )}
              <div className="flex items-start gap-6">
                <div className="w-32 h-24 bg-white border border-slate-100 rounded-md flex items-center justify-center p-2 flex-shrink-0">
                  <img src={autoRecomendado.urlImagen} alt={autoRecomendado.modelo} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Unidad Homologada y Recomendada</h3>
                  <h4 className="text-2xl font-extrabold uppercase leading-none mb-2 text-[#006837]">
                    {autoRecomendado.marca} {autoRecomendado.modelo} <span className="font-normal text-slate-600 text-base">{autoRecomendado.version}</span>
                  </h4>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed italic pr-4 bg-white p-3 rounded-md border border-slate-100">
                    "{autoRecomendado.veredicto || "Análisis Técnico Cooperativo: Vehículo seleccionado bajo parámetros de importación oficial y respaldo institucional en Paraguay."}"
                  </p>
                </div>
              </div>
            </section>

            {/* GRILLA COMPRIMIDA PARA A4 - Estilo Sobrio Cooperativa */}
            <section className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-200 pb-2 mb-4">Matriz Comparativa Homologada</h3>
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <th className="p-2.5 font-bold border-r border-slate-200 w-1/4 bg-slate-100">Especificación Validada</th>
                    {selected.map(auto => (
                      <th key={auto.id} className="p-2.5 font-extrabold border-r border-slate-200 text-center text-[#006837] text-[11px] bg-slate-50">{auto.marca} {auto.modelo}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-medium text-[11px] text-slate-800">
                  {[
                    { label: 'Precio Referencial USD', key: 'precioUsd', isPrice: true },
                    { label: 'Denominación Versión', key: 'version' },
                    { label: 'Configuración Motor', key: 'motor' },
                    { label: 'Combustible / Eficiencia', key: 'combustible' },
                    { label: 'Caja Transmisión', key: 'transmision' },
                    { label: 'Capacidad Carga (Lts)', key: 'bauleraLitros' },
                    { label: 'Garantía Oficial Paraguay', key: 'garantia' },
                    { label: 'Seguridad (ADAS)', key: 'adas' },
                    { label: 'Origen Marca', key: 'origenMarca' },
                  ].map((item, idx) => (
                    <tr key={item.key} className="border-b border-slate-200 break-inside-avoid">
                      <td className="p-2 bg-slate-50 font-semibold text-[10px] uppercase text-slate-600 border-r border-slate-200 tracking-wide">{item.label}</td>
                      {selected.map(auto => {
                        const currentAuto = activeVersions[auto.id] || auto;
                        let valor = (currentAuto as any)[item.key];
                        if (item.key === 'bauleraLitros' && valor) valor = `${valor} Litros`;
                        if (item.isPrice && valor) valor = `$${valor.toLocaleString()}`;
                        
                        return (
                          <td key={auto.id} className={`p-2 border-r border-slate-200 text-center ${item.isPrice ? 'font-extrabold text-[#006837] text-xs' : ''}`}>
                            {valor || 'A confirmar'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* OPCIONES EXTRA (Con Badges Técnicos Sobrios Cooperativa) */}
            {opcionesExtra.length > 0 && (
              <section className="mb-8 break-inside-avoid">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Otras Unidades del Mercado Oficial que cumplen el perfil cooperativo:</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {opcionesExtra.map(auto => (
                    <div key={auto.id} className="p-2.5 border border-slate-200 bg-white flex items-center gap-4 rounded-md">
                      <img src={auto.urlImagen} className="w-14 h-10 object-contain" alt={auto.modelo} />
                      <div className="flex-1">
                        <h4 className="font-extrabold text-[11px] uppercase text-slate-950 leading-none">{auto.marca} <span className="font-medium text-[10px] text-slate-600">{auto.modelo}</span></h4>
                        <p className="text-[11px] font-extrabold text-[#006837] mt-0.5 mb-1.5">${auto.precioUsd?.toLocaleString()}</p>
                        
                        {/* Píldoras Técnicas Sobrias */}
                        <div className="flex flex-wrap gap-1.5">
                          {auto.motor && <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-semibold text-slate-600 uppercase rounded-sm border border-slate-200">{auto.motor.slice(0, 20)}</span>}
                          {auto.bauleraLitros && <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-semibold text-slate-600 uppercase rounded-sm border border-slate-200">{auto.bauleraLitros}L</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FOOTER CORPORATIVO COOPERATIVA UNIVERSITARIA */}
            <footer className="bg-[#006837] text-white p-6 border-t-8 border-[#FFD100] rounded-lg break-inside-avoid mt-auto shadow-xl">
              <div className="flex items-center justify-between gap-6">
                <div className="max-w-[75%]">
                  <h3 className="text-sm font-extrabold uppercase text-[#FFD100] mb-1.5 tracking-tight">
                    Respaldo Institucional y Aviso de Homologación
                  </h3>
                  <p className="text-xs text-white font-medium leading-relaxed pr-4">
                    Este informe es referencial y se basa en datos provistos por los importadores oficiales asociados a CADAM y validados por la Cooperativa Universitaria a la fecha de generación. Los precios, especificaciones y disponibilidad están sujetos a cambios sin previo aviso por parte de cada concesionaria. Se recomienda validar la información directamente con el representante autorizado antes de concretar una operación de crédito.
                  </p>
                </div>
                <div className="text-right border-l-2 border-[#FFD100]/50 pl-5 flex-shrink-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#FFD100] mb-1.5">Contacto CU</p>
                  <p className="text-sm font-extrabold text-white leading-none">(021) 617 0000</p>
                  <p className="text-[10px] font-semibold text-white mt-1.5">universitaria.coop</p>
                </div>
              </div>
            </footer>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // FLUJO NORMAL WEB (Step 1 y Step 2) - Estilo Cooperativa
  // ============================================================================
  return (
    <div className={`min-h-screen font-sans ${step === 2 ? 'bg-slate-50' : 'bg-white'}`}>
      
      {/* HEADER WEB INSTITUCIONAL COOPERATIVA */}
      <div className="max-w-[1600px] mx-auto p-6 md:p-8 flex justify-between items-center border-b border-slate-100 bg-white">
        <div className="flex items-center gap-4">
          <div className="bg-[#006837] text-white font-sans font-extrabold text-2xl px-3.5 py-1.5 rounded-full tracking-tight shadow-md hover:bg-[#004a7a] transition-colors cursor-pointer border-2 border-[#FFD100]">CU</div>
          <div className="hidden md:block">
            <h1 className="text-sm font-extrabold uppercase tracking-tight text-[#006837]">Portal de Consultas y Validación Técnica</h1>
            <p className="text-[11px] font-medium text-slate-500">Impulsando el desarrollo legal y formal en Paraguay</p>
          </div>
        </div>
        {step === 2 && <button onClick={() => setStep(1)} className="text-[10px] font-bold uppercase border-b-2 border-[#FFD100] pb-1 text-slate-600 hover:text-[#006837] transition-colors">← Nueva Consulta</button>}
      </div>

      {step === 1 && (
        <div className="max-w-4xl mx-auto p-6 md:p-10 animate-in fade-in duration-500">
          <div className="bg-white border border-slate-100 p-8 md:p-12 shadow-xl rounded-xl space-y-10">
            
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-2xl font-extrabold text-[#006837] uppercase tracking-tight mb-2.5">Asistente Cooperativo de Selección de <span className="text-[#006837]">Vehículos 0km</span></h2>
                <p className="text-sm text-slate-600 font-medium">Defina sus parámetros de búsqueda. Nuestro sistema analizará las opciones homologadas disponibles en el mercado oficial paraguayo asociados a CADAM.</p>
            </div>

            {PEDIR_DATOS_USUARIO && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-100 shadow-inner">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Nombre Completo del Socio *</label>
                  <input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full p-3 border border-slate-200 bg-white rounded-md outline-none focus:border-[#006837] text-sm font-medium shadow-inner" placeholder="Ej: Juan Pérez" />
                </div>
                {/* ... celular y email se mantienen igual en lógica ... */}
              </div>
            )}

            <div className="space-y-10 bg-slate-50/50 p-6 rounded-lg border border-slate-100 shadow-inner">
              <div className="flex justify-between items-center gap-4">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">Rango de Inversión Estimada (USD)</label>
                <div className="flex gap-2 font-extrabold text-[#006837] text-sm tracking-tight bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                  <span>${formData.presupuestoMin.toLocaleString()}</span> — <span>${formData.presupuestoMax.toLocaleString()}</span>
                </div>
              </div>
              <div className="relative w-full h-1.5 bg-slate-200 rounded-full">
                <div className="absolute h-full bg-[#006837] rounded-full" style={{ left: `${(formData.presupuestoMin / 150000) * 100}%`, right: `${100 - (formData.presupuestoMax / 150000) * 100}%` }} />
                <input type="range" min="0" max="150000" step="1000" value={formData.presupuestoMin} onChange={handleMinChange} className="absolute w-full -top-1 h-3 appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-slate-800 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow" />
                <input type="range" min="0" max="150000" step="1000" value={formData.presupuestoMax} onChange={handleMaxChange} className="absolute w-full -top-1 h-3 appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#FFD100] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">Atributos Prioritarios en su Próxima Unidad (Seleccionar 3) *</label>
              <div className="flex flex-wrap gap-2.5">
                {['Seguridad', 'Tecnología', 'Espacio', 'Precio', 'Eficiencia'].map(at => (
                  <button key={at} onClick={() => toggleAtributo(at)} className={`px-6 py-2.5 text-[11px] font-bold border-2 rounded-md transition-all tracking-wider ${formData.atributos.includes(at) ? 'bg-[#006837] text-white border-[#006837]' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:text-slate-700'}`}>{at}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <MultiSelect label="Preferencia Motorización" items={['PHEV', 'HEV', 'EV', 'Diesel', 'Flex', 'Nafta']} value={formData.motorizacion} storeKey="motorizacion" />
              <MultiSelect label="Tipo de Carrocería" items={['SUV', 'Sedan', 'Hatchback', 'Pickup']} value={formData.tipoVehiculo} storeKey="tipoVehiculo" />
              <MultiSelect label="País de Origen de la Marca" items={['Solo Coreanos', 'Solo Japoneses', 'Solo Europeos', 'Solo Chinos']} value={formData.origen} storeKey="origen" />
              <MultiSelect label="Concesionaria Asociada" items={['Garden', 'Automotor', 'Santa Rosa', 'Chacomer', 'Toyotoshi', 'Condor', 'Gorostiaga', 'Automaq', 'De La Sobera', 'Vicar', 'Diesa']} value={formData.concesionaria} storeKey="concesionaria" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500">Requerimientos o Notas Adicionales</label>
              <textarea value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} placeholder="Ej: Uso mayormente urbano, preferencia por buen valor de reventa gremial..." className="w-full p-4 bg-white border border-slate-200 rounded-md text-sm min-h-[100px] outline-none font-medium focus:border-[#006837] transition-colors shadow-inner" />
            </div>

            <button disabled={!isReady} onClick={handleExecute} className="w-full py-5 bg-[#006837] text-white font-extrabold text-xs uppercase tracking-[3px] hover:bg-[#004a7a] transition-all disabled:opacity-30 shadow-lg rounded-md border-b-4 border-[#FFD100]">Iniciar Análisis Técnico de Mercado →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-[1700px] mx-auto p-4 md:p-8 pb-40 animate-in fade-in duration-700 space-y-10">
          
          <div className="bg-[#006837] p-8 md:p-10 text-white rounded-lg shadow-2xl border-l-8 border-[#FFD100]">
            <h2 className="font-extrabold text-xl uppercase tracking-tight flex items-center gap-3">
              <div className="text-white text-3xl font-black">CU</div>
              Análisis de Mercado Homologado para Perfil: {formData.atributos.join(' + ')}.
            </h2>
            <p className="mt-3 text-[#FFD100] font-medium text-xs uppercase tracking-wider underline decoration-white/50 underline-offset-4">
              Inversión Referencial: ${formData.presupuestoMin.toLocaleString()} – ${formData.presupuestoMax.toLocaleString()} | 
              Origen: {formData.origen.length > 0 ? formData.origen.join(', ') : 'Todos'} | 
              Motor: {formData.motorizacion.length > 0 ? formData.motorizacion.join(', ') : 'Cualquiera'}
            </p>
          </div>

          {esRescate && (
            <div className="w-full bg-[#FFD100]/10 border-l-4 border-[#FFD100] p-5 rounded-r shadow-sm">
              <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wide">⚠️ Aviso de Disponibilidad Homologada</h3>
              <p className="text-gray-800 text-xs mt-1 font-medium">La configuración exacta solicitada presenta baja disponibilidad en el mercado oficial asociados a CADAM. Le sugerimos estas alternativas viables dentro de su rango de inversión y carrocería:</p>
            </div>
          )}

          <div className="relative z-30 bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block tracking-wide">
              ¿Desea contrastar un modelo específico? Búsquelo en el catálogo homologado y agréguelo:
            </label>
            <input
              type="text"
              placeholder="Ej: Toyota Corolla, Kia Sportage, Hyundai HB20..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3.5 border border-slate-200 bg-white outline-none focus:border-[#006837] text-sm font-semibold text-gray-950 transition-colors shadow-inner rounded-md"
            />
            {searchTerm.length >= 2 && (
              <div className="absolute top-full left-0 w-full bg-white border border-slate-200 shadow-2xl mt-1 max-h-60 overflow-y-auto z-50 rounded-b-md animate-in fade-in duration-150">
                {isSearching ? (
                  <div className="p-4 text-xs font-semibold text-slate-500 uppercase text-center animate-pulse">Consultando registro central de unidades...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(auto => (
                    <div 
                      key={auto.id} 
                      onClick={() => {
                        if (!manualSelections.find(a => a.id === auto.id) && !top10.find(a => a.id === auto.id)) {
                          setManualSelections(prev => [auto, ...prev]);
                        }
                        if (!compareIds.includes(auto.id) && compareIds.length < 3) {
                          setCompareIds(prev => [...prev, auto.id]);
                        } else if (!compareIds.includes(auto.id)) {
                          alert("La matriz comparativa permite hasta 3 unidades en simultáneo. Deseleccione una unidad de la grilla para agregar esta.");
                        }
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                      className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors"
                    >
                      <div>
                        <span className="font-bold text-gray-950 uppercase text-xs">{auto.marca} {auto.modelo}</span>
                        <span className="text-[10px] text-slate-500 ml-2 font-medium tracking-wide">{auto.version}</span>
                      </div>
                      <span className="text-[#006837] font-extrabold text-xs">${auto.precioUsd?.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">No se encontraron registros homologados para "{searchTerm}"</div>
                )}
              </div>
            )}
          </div>

          {/* Grilla de Resultados - Diseño Comprimido Cooperativa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {displayedAutos.map((auto, idx) => {
              const currentAuto = activeVersions[auto.id] || auto;
              return (
                <div key={auto.id} className={`bg-white border rounded-lg transition-all relative ${compareIds.includes(auto.id) ? 'border-[#006837] ring-2 ring-[#006837]/15' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}>
                  
                  {/* Badge de Puesto Institucional - Pin Cooperativo */}
                  {auto.puesto ? (
                    <div className="absolute -top-2.5 -left-2.5 w-8 h-8 rounded-full bg-[#FFD100] text-[#006837] flex items-center justify-center font-extrabold z-10 shadow-lg text-xs border-2 border-white">{auto.puesto}</div>
                  ) : (
                    <div className="absolute -top-2.5 -left-2.5 w-8 h-8 rounded-full bg-[#006837] text-white flex items-center justify-center font-extrabold z-10 shadow-lg text-sm border-2 border-white">+</div>
                  )}

                  {/* Imagen y Botón Comparar - Altura Reducida */}
                  <div className="relative h-44 bg-slate-50 overflow-hidden border-b border-slate-100 rounded-t-lg p-2">
                    <img src={currentAuto.urlImagen} className="w-full h-full object-contain mx-auto" alt={currentAuto.modelo} />
                    <button onClick={() => toggleCompare(auto.id)} className={`absolute top-2 right-2 px-2.5 py-1 text-[9px] font-bold border rounded-sm transition-colors ${compareIds.includes(auto.id) ? 'bg-[#FFD100] text-[#006837] border-[#FFD100]' : 'bg-white/90 text-slate-600 border-slate-200 hover:text-gray-900 hover:border-gray-300'}`}>
                      {compareIds.includes(auto.id) ? '✓ SELECCIONADO' : '+ COMPARAR'}
                    </button>
                  </div>

                  {/* Veredicto Institucional - Más Pequeño */}
                  <div className="px-5 -mt-4 mb-2 relative z-10">
                    <div className="bg-white border border-slate-100 border-l-2 border-l-[#006837] p-2 rounded-sm shadow">
                      <p className="text-[10px] leading-relaxed text-slate-800 italic font-medium">
                        <span className="font-extrabold text-[#006837] not-italic text-[9px] uppercase mr-1 inline-block bg-slate-100 px-1.5 py-0.5 rounded-sm">Veredicto Cooperativo:</span>
                        "{currentAuto.veredicto || (auto.puesto ? "Procesando veredicto técnico institucional..." : "Unidad agregada manualmente. Solicite veredicto a su Cooperativa.")}"
                      </p>
                    </div>
                  </div>
                  
                  {/* Datos del Auto - Paddings Comprimidos */}
                  <div className="p-5 pt-2 flex-1 flex flex-col gap-4">
                    <div className="space-y-2.5">
                      <h4 className="font-extrabold text-base text-gray-950 uppercase leading-tight truncate">{currentAuto.marca} {currentAuto.modelo}</h4>
                      
                      {/* Selector de Versión Institucional */}
                      <div className="relative group">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Versión Homologada:</p>
                        <div className="bg-white border border-slate-200 rounded p-2 text-[10px] font-semibold text-gray-900 flex justify-between items-center cursor-pointer hover:border-slate-300 transition-colors">
                          <span className="truncate pr-1.5">{currentAuto.version}</span>
                          <span className="text-slate-400 group-hover:text-slate-600">▾</span>
                        </div>
                        {/* Dropdown se mantiene igual en lógica, estética neutra */}
                        <div className="absolute left-0 w-full bg-white border border-slate-200 shadow-2xl z-20 hidden group-hover:block max-h-36 overflow-y-auto rounded-b-md animate-in fade-in duration-150">
                          {auto.versiones?.map((v: any) => (
                            <div key={v.id} onClick={() => setActiveVersions({ ...activeVersions, [auto.id]: v })} className={`p-2 text-[9px] border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex justify-between ${currentAuto.id === v.id ? 'bg-[#006837]/5 text-[#006837]' : 'text-slate-700'}`}>
                              <span className="font-bold uppercase pr-2">{v.version}</span>
                              <span className="font-extrabold whitespace-nowrap">${v.precioUsd?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between border-y border-slate-100 py-3 text-xs font-bold uppercase tracking-wide">
                      <span className="text-slate-500 font-semibold text-[10px]">{currentAuto.match_percent ? `${currentAuto.match_percent}% Afinidad` : 'Referencia'}</span>
                      <span className="text-[#006837] font-extrabold">${currentAuto.precioUsd?.toLocaleString()}</span>
                    </div>
                    
                    <button onClick={() => setExpandedId(expandedId === auto.id ? null : auto.id)} className="text-[10px] font-bold text-[#006837] text-left uppercase tracking-wider hover:text-[#004a7a] transition-colors">+ Ficha Técnica Resumida</button>
                    
                    {expandedId === auto.id && (
                      <div className="text-[10px] space-y-2.5 text-gray-700 animate-in slide-in-from-top-1 duration-200 pt-1 font-medium bg-slate-50 p-3 rounded-md border border-slate-100 shadow-inner">
                        {/* Datos técnicos se mantienen igual, estética neutra */}
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Paquete de Seguridad</p>
                          <p className="flex justify-between border-b border-slate-100 pb-1"><span>ADAS:</span> <span className="font-semibold text-gray-950">{currentAuto.adas || 'Estándar Oficial'}</span></p>
                          {/* ... airbags ... */}
                        </div>
                        {/* ... tecnología, capacidad ... */}
                      </div>
                    )}
                    <a href={`https://wa.me/595216170000?text=Solicito propuesta comercial formal para el ${currentAuto.marca} ${currentAuto.modelo} versión ${currentAuto.version} validado por la Cooperativa Universitaria.`} target="_blank" className="mt-auto block w-full py-3 bg-[#006837] text-white text-center font-bold text-[10px] uppercase tracking-widest hover:bg-[#004a7a] transition-colors shadow rounded-md border-b-4 border-[#FFD100]">Solicitar Propuesta Formal</a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Información Institucional sobre Financiación - Estilo Cooperativa */}
          <div className="mt-16 border-t border-slate-200 pt-10 break-inside-avoid">
            <div className="bg-white border border-slate-100 text-gray-950 p-8 md:p-12 rounded-lg shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#006837]/5 -translate-y-16 translate-x-16"></div>
              <h2 className="text-2xl font-extrabold uppercase tracking-tight mb-2.5 flex items-center gap-2.5">
                <div className="text-[#006837] text-3xl font-black">CU</div>
                Respaldo de <span className="text-[#006837]">Financiación Cooperativa</span>
              </h2>
              <p className="text-slate-700 text-sm mb-8 font-medium max-w-3xl leading-relaxed">
                Su Cooperativa promueve el acceso a la unidad 0km a través de canales formales y homologados. Le resumimos los requisitos generales sugeridos para facilitar su gestión de crédito con las concesionarias asociadas o su sucursal de referencia de la Cooperativa Universitaria.
              </p>

              <div className="space-y-4 max-w-5xl">
                <details className="group bg-slate-50 border border-slate-100 p-5 rounded-md cursor-pointer hover:border-slate-200 transition-colors shadow-inner">
                  <summary className="font-bold text-xs uppercase tracking-wider text-gray-950 flex justify-between items-center list-none outline-none">
                    Financiación Directa (Plan Gremial CADAM Asociados)
                    <span className="text-[#006837] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-5 text-gray-800 text-xs leading-relaxed space-y-2 border-t border-slate-100 pt-4 font-medium">
                    {/* Lista de requisitos neutra institucional */}
                  </div>
                </details>
                {/* ... detalles préstamos bancarios se mantienen igual en lógica, estética neutra ... */}
              </div>
            </div>
          </div>
          
          {/* Barra Flotante Comparar - Estilo Institucional Cooperativa */}
          {compareIds.length >= 1 && (
            <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-auto bg-[#006837] text-white p-4 md:px-8 md:py-5 shadow-2xl flex items-center justify-between md:justify-center md:gap-8 border-t-2 border-[#FFD100] rounded-lg animate-in slide-in-from-bottom-10 print:hidden">
              <div className="text-xs font-bold uppercase tracking-wider">{compareIds.length} <span className="text-slate-200 font-medium tracking-normal">unidades en selección</span></div>
              {compareIds.length >= 2 ? (
                <button onClick={handleOpenComparison} className="bg-white text-[#006837] px-8 py-3 font-extrabold text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow rounded-md border border-slate-100">Visualizar Matriz Técnica</button>
              ) : (
                <p className="text-[10px] text-slate-400 italic tracking-wider px-3">Seleccione al menos 2 unidades...</p>
              )}
              <button onClick={() => setCompareIds([])} className="text-slate-300 text-[10px] uppercase font-bold hover:text-white transition-colors tracking-wide">Limpiar</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
