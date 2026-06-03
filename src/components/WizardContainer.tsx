'use client';

import { useState, useRef, useEffect } from 'react';
import { saveLeadAction, logComparisonAction } from '@/app/actions';

// --- SET DE ICONOS SVG INTEGRADOS (Cero dependencias) ---
const Icons = {
  User: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Phone: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  WhatsApp: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  Money: () => <svg className="w-5 h-5 text-[#006837]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v8m0-8V6m0 12v-2m0 0H9m11 11H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v14a2 2 0 01-2 2z" /></svg>,
  Engine: () => <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Car: () => <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8a2 2 0 012 2v2m-6 4v-2m-4 2v-2m10 2h.01M5 11h14a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2z" /></svg>,
  Globe: () => <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Building: () => <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Printer: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
  Document: () => <svg className="w-3 h-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Search: () => <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  CheckCircle: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
};

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

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<IAAuto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualSelections, setManualSelections] = useState<IAAuto[]>([]);

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

  const MultiSelect = ({ label, items, value, storeKey, icon: Icon }: { label: string, items: string[], value: string[], storeKey: any, icon: any }) => (
    <div className="space-y-1 relative">
      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wide flex items-center gap-1">
        <Icon /> {label}
      </label>
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
                <div className="bg-[#006837] text-white font-extrabold text-xs px-3 py-1 inline-flex items-center gap-1 rounded-full mb-3 tracking-widest uppercase">
                  <Icons.User /> Atención Socio
                </div>
                <h3 className="font-extrabold text-2xl text-[#006837] leading-tight mb-2">
                  Formalice su <span className="text-[#FFD100]">Solicitud</span>
                </h3>
                <p className="text-sm text-slate-600 font-medium">Complete sus datos para generar la ficha de solicitud de crédito con su nombre y recibir el asesoramiento de su Cooperativa.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold uppercase text-slate-500 rounded">Nombre y Apellido del Socio / Razón Social</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icons.User /></div>
                    <input 
                      value={formData.nombre.includes('Invitado') ? '' : formData.nombre} 
                      onChange={e => setFormData({...formData, nombre: e.target.value})} 
                      className="w-full pl-10 p-3 border border-slate-200 bg-white outline-none focus:border-[#006837] text-sm font-semibold text-slate-900 rounded-md shadow-inner" 
                      placeholder="Ej: Juan Pérez o Empresa SA"
                    />
                  </div>
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold uppercase text-slate-500">WhatsApp de Contacto (Celular)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icons.Phone /></div>
                    <input 
                      type="tel"
                      value={formData.celular === '0999999999' ? '' : formData.celular} 
                      onChange={e => {
                        const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({...formData, celular: soloNumeros});
                      }} 
                      className="w-full pl-10 p-3 border border-slate-200 bg-white outline-none focus:border-[#006837] text-sm font-semibold text-slate-900 rounded-md shadow-inner" 
                      placeholder="09..."
                    />
                  </div>
                </div>
                
                <button 
                  disabled={formData.nombre.length < 3 || !isCelularValid || isSavingLead}
                  onClick={handleUnlockDossier} 
                  className="w-full mt-4 py-4 bg-[#006837] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#004a7a] transition-all rounded-md disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSavingLead ? 'Formalizando Solicitud...' : <><Icons.Document /> Generar Ficha de Crédito Pre-aprobado</>}
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
                  <Icons.Printer /> Imprimir Ficha de Solicitud
                </button>
                <button onClick={() => setShowComparison(false)} className="bg-[#006837] text-white px-5 py-2.5 font-bold text-[10px] uppercase tracking-wide hover:bg-[#004a7a] transition-all rounded-full shadow">
                  ← Re-ajustar Búsqueda
                </button>
              </div>
            </div>
            
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
                        <a href={`https://wa.me/595216170000?text=Solicito asesoramiento para financiar el ${currentAuto.marca} ${currentAuto.modelo} visto en el portal de la Cooperativa Universitaria.`} target="_blank" className="block w-full py-2 bg-[#006837] text-white text-center font-bold text-[10px] uppercase tracking-widest hover:bg-[#004a7a] transition-all rounded-sm flex items-center justify-center gap-1">
                          <Icons.WhatsApp /> Solicitar Crédito
                        </a>
                      </div>
                     );
                  })}
                </div>

                {[
                  { label: 'Versión y Denominación', key: 'version' },
                  { label: 'Motor y Potencia Homologada', key: 'motor' },
                  { label: 'Tipo de Combustible', key: 'combustible' },
                  { label: 'Caja de Transmisión', key: 'transmision' },
                  { label: 'Sistema de Tracción', key: 'traccion' },
                  { label: 'Seguridad Activa (ADAS)', key: 'adas' },
                  { label: 'Cantidad Airbags', key: 'airbags' },
                  { label: 'Dimensiones (LxAnxAl)', key: 'dimensiones' },
                  { label: 'Despeje del Suelo', key: 'despejeSuelo' },
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
                            <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer" className="text-[9px] px-2.5 py-1.5 bg-[#FFD100] text-[#006837] rounded-sm font-extrabold uppercase tracking-wider hover:bg-white border hover:border-[#006837] transition-colors flex items-center gap-1">
                              <Icons.WhatsApp /> Verificar Dato
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

        {/* === VISTA DEL DOSSIER PDF - (Sin cambios funcionales, oculto en web) === */}
        {autoRecomendado && (
          <div className="hidden print:block w-full bg-white px-10 py-6 font-sans text-slate-900">
             {/* ... (Se mantiene igual que la versión anterior para no alargar el código aquí, 
                 solo asegúrate de mantener el bloque PDF que te pasé en el mensaje previo) ... */}
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
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Nombre Completo del Socio *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icons.User /></div>
                    <input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full pl-10 p-3 border border-slate-200 bg-white rounded-md outline-none focus:border-[#006837] text-sm font-medium shadow-inner" placeholder="Ej: Juan Pérez" />
                  </div>
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold uppercase text-slate-500">WhatsApp (Celular) *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icons.Phone /></div>
                    <input type="tel" value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})} className="w-full pl-10 p-3 border border-slate-200 bg-white rounded-md outline-none focus:border-[#006837] text-sm font-medium shadow-inner" placeholder="09..." />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-10 bg-slate-50/50 p-6 rounded-lg border border-slate-100 shadow-inner">
              <div className="flex justify-between items-center gap-4">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wide flex items-center gap-1.5"><Icons.Money /> Rango de Inversión Estimada (USD)</label>
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
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wide flex items-center gap-1.5"><Icons.CheckCircle /> Atributos Prioritarios (Seleccionar 3) *</label>
              <div className="flex flex-wrap gap-2.5">
                {['Seguridad', 'Tecnología', 'Espacio', 'Precio', 'Eficiencia'].map(at => (
                  <button key={at} onClick={() => toggleAtributo(at)} className={`px-6 py-2.5 text-[11px] font-bold border-2 rounded-md transition-all tracking-wider flex items-center gap-2 ${formData.atributos.includes(at) ? 'bg-[#006837] text-white border-[#006837]' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:text-slate-700'}`}>
                    {formData.atributos.includes(at) && <Icons.CheckCircle />} {at}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <MultiSelect label="Preferencia Motorización" items={['PHEV', 'HEV', 'EV', 'Diesel', 'Flex', 'Nafta']} value={formData.motorizacion} storeKey="motorizacion" icon={Icons.Engine} />
              <MultiSelect label="Tipo de Carrocería" items={['SUV', 'Sedan', 'Hatchback', 'Pickup']} value={formData.tipoVehiculo} storeKey="tipoVehiculo" icon={Icons.Car} />
              <MultiSelect label="País de Origen de la Marca" items={['Solo Coreanos', 'Solo Japoneses', 'Solo Europeos', 'Solo Chinos']} value={formData.origen} storeKey="origen" icon={Icons.Globe} />
              <MultiSelect label="Concesionaria Asociada" items={['Garden', 'Automotor', 'Santa Rosa', 'Chacomer', 'Toyotoshi', 'Condor', 'Gorostiaga', 'Automaq', 'De La Sobera', 'Vicar', 'Diesa']} value={formData.concesionaria} storeKey="concesionaria" icon={Icons.Building} />
            </div>

            <button disabled={!isReady} onClick={handleExecute} className="w-full py-5 bg-[#006837] text-white font-extrabold text-xs uppercase tracking-[3px] hover:bg-[#004a7a] transition-all disabled:opacity-30 shadow-lg rounded-md border-b-4 border-[#FFD100] flex items-center justify-center gap-2">
              Iniciar Análisis Técnico de Mercado <Icons.Search />
            </button>
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
            <p className="mt-3 text-[#FFD100] font-medium text-xs uppercase tracking-wider underline decoration-white/50 underline-offset-4 flex items-center gap-2">
               Inversión Referencial: ${formData.presupuestoMin.toLocaleString()} – ${formData.presupuestoMax.toLocaleString()}
            </p>
          </div>

          <div className="relative z-30 bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 flex items-center gap-1.5 tracking-wide">
              <Icons.Search /> ¿Desea contrastar un modelo específico? Búsquelo en el catálogo:
            </label>
            <input
              type="text"
              placeholder="Ej: Toyota Corolla, Kia Sportage, Hyundai HB20..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3.5 border border-slate-200 bg-white outline-none focus:border-[#006837] text-sm font-semibold text-gray-950 transition-colors shadow-inner rounded-md"
            />
             {/* (Lógica del dropdown de búsqueda se mantiene igual) */}
          </div>

          {/* Grilla de Resultados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {displayedAutos.map((auto, idx) => {
              const currentAuto = activeVersions[auto.id] || auto;
              return (
                <div key={auto.id} className={`bg-white border rounded-lg transition-all relative ${compareIds.includes(auto.id) ? 'border-[#006837] ring-2 ring-[#006837]/15' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}>
                  
                  {/* Badge de Puesto Institucional */}
                  {auto.puesto ? (
                    <div className="absolute -top-2.5 -left-2.5 w-8 h-8 rounded-full bg-[#FFD100] text-[#006837] flex items-center justify-center font-extrabold z-10 shadow-lg text-xs border-2 border-white">{auto.puesto}</div>
                  ) : (
                    <div className="absolute -top-2.5 -left-2.5 w-8 h-8 rounded-full bg-[#006837] text-white flex items-center justify-center font-extrabold z-10 shadow-lg text-sm border-2 border-white">+</div>
                  )}

                  <div className="relative h-44 bg-slate-50 overflow-hidden border-b border-slate-100 rounded-t-lg p-2">
                    <img src={currentAuto.urlImagen} className="w-full h-full object-contain mx-auto" alt={currentAuto.modelo} />
                    <button onClick={() => toggleCompare(auto.id)} className={`absolute top-2 right-2 px-2.5 py-1 text-[9px] font-bold border rounded-sm transition-colors ${compareIds.includes(auto.id) ? 'bg-[#FFD100] text-[#006837] border-[#FFD100]' : 'bg-white/90 text-slate-600 border-slate-200 hover:text-gray-900 hover:border-gray-300'}`}>
                      {compareIds.includes(auto.id) ? '✓ SELECCIONADO' : '+ COMPARAR'}
                    </button>
                  </div>

                  {/* Veredicto Institucional */}
                  <div className="px-5 -mt-4 mb-2 relative z-10">
                    <div className="bg-white border border-slate-100 border-l-2 border-l-[#006837] p-2 rounded-sm shadow">
                      <p className="text-[10px] leading-relaxed text-slate-800 italic font-medium">
                        <span className="font-extrabold text-[#006837] not-italic text-[9px] uppercase mr-1 inline-block bg-slate-100 px-1.5 py-0.5 rounded-sm">Veredicto CU:</span>
                        "{currentAuto.veredicto || (auto.puesto ? "Procesando veredicto técnico institucional..." : "Unidad agregada manualmente. Solicite veredicto a su Cooperativa.")}"
                      </p>
                    </div>
                  </div>
                  
                  {/* Datos del Auto */}
                  <div className="p-5 pt-2 flex-1 flex flex-col gap-4">
                    <div className="space-y-2.5">
                      <h4 className="font-extrabold text-base text-gray-950 uppercase leading-tight truncate">{currentAuto.marca} {currentAuto.modelo}</h4>
                      
                      {/* Selector de Versión */}
                      <div className="relative group">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Versión Homologada:</p>
                        <div className="bg-white border border-slate-200 rounded p-2 text-[10px] font-semibold text-gray-900 flex justify-between items-center cursor-pointer hover:border-slate-300 transition-colors">
                          <span className="truncate pr-1.5">{currentAuto.version}</span>
                          <span className="text-slate-400 group-hover:text-slate-600">▾</span>
                        </div>
                         {/* (Lógica del dropdown de versiones se mantiene) */}
                      </div>
                    </div>

                    <div className="flex justify-between border-y border-slate-100 py-3 text-xs font-bold uppercase tracking-wide">
                      <span className="text-slate-500 font-semibold text-[10px]">{currentAuto.match_percent ? `${currentAuto.match_percent}% Afinidad` : 'Referencia'}</span>
                      <span className="text-[#006837] font-extrabold">${currentAuto.precioUsd?.toLocaleString()}</span>
                    </div>
                    
                    <button onClick={() => setExpandedId(expandedId === auto.id ? null : auto.id)} className="text-[10px] font-bold text-[#006837] text-left uppercase tracking-wider hover:text-[#004a7a] transition-colors flex items-center gap-1"><Icons.Document /> Ficha Técnica Resumida</button>
                    
                    {expandedId === auto.id && (
                      <div className="text-[10px] space-y-2.5 text-gray-700 animate-in slide-in-from-top-1 duration-200 pt-1 font-medium bg-slate-50 p-3 rounded-md border border-slate-100 shadow-inner">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Paquete de Seguridad</p>
                          <p className="flex justify-between border-b border-slate-100 pb-1"><span>ADAS:</span> <span className="font-semibold text-gray-950">{currentAuto.adas || 'Estándar Oficial'}</span></p>
                        </div>
                      </div>
                    )}
                    <a href={`https://wa.me/595216170000?text=Solicito propuesta comercial formal para el ${currentAuto.marca} ${currentAuto.modelo} versión ${currentAuto.version} validado por la Cooperativa Universitaria.`} target="_blank" className="mt-auto w-full py-3 bg-[#006837] text-white text-center font-bold text-[10px] uppercase tracking-widest hover:bg-[#004a7a] transition-colors shadow rounded-md border-b-4 border-[#FFD100] flex items-center justify-center gap-1"><Icons.WhatsApp /> Solicitar Propuesta Formal</a>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Barra Flotante Comparar */}
          {compareIds.length >= 1 && (
            <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-auto bg-[#006837] text-white p-4 md:px-8 md:py-5 shadow-2xl flex items-center justify-between md:justify-center md:gap-8 border-t-2 border-[#FFD100] rounded-lg animate-in slide-in-from-bottom-10 print:hidden">
              <div className="text-xs font-bold uppercase tracking-wider">{compareIds.length} <span className="text-slate-200 font-medium tracking-normal">unidades seleccionadas</span></div>
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
