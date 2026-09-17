import { 
  Scale,          // Derecho / Leyes / Balanza
  Gavel,          // Juzgado / Penal / Civil / Sentencia
  Scroll,         // Contratos / Normas / Jurisprudencia / Constitución
  ShieldAlert,    // Derecho Penal / Delitos / Faltas
  BookMarked,     // Códigos Legales / Doctrina

  Calculator,     // Contaduría / Balance / Operaciones
  PieChart,       // Contabilidad / Costos / Distribución
  Building2,      // Sociedades / Tributario / Hacienda / SAT
  Receipt,        // Facturas / Auditoría / Nómina / Retenciones
  FileSpreadsheet,// Libros Contables / Estados Financieros

  DollarSign,     // Finanzas / Liquidez / Tesorería / Capital
  TrendingUp,     // Mercados / Acciones / Inversión / Rentabilidad
  Coins,          // Banca / Activos / Cripto / Divisas
  Landmark,       // Banco Central / Wall Street / Fondos
  Wallet,         // Presupuesto / Flujo de Efectivo

  Cpu,            // Tecnología / Hardware / Microprocesadores
  Code,           // Programación / Software / Scripts
  Database,       // Bases de Datos / SQL / Big Data / Data Lake
  Globe,          // Redes / Cloud / Internet / Microservicios
  ShieldCheck,    // Ciberseguridad / Firewall / IAM / Tokens
  Terminal,       // Servidores / DevOps / Linux
  Radio,          // Telecomunicaciones / Streaming / IoT
  Layers,         // Arquitectura / Frameworks / Fullstack

  Stethoscope,    // Medicina General / Clínica
  Dna,            // Genética / Biología / ADN
  Pill,           // Farmacia / Medicamentos / Farmacología
  HeartPulse,     // Cardiología / Signos Vitales
  Microscope,     // Laboratorio / Microbiología / Investigación
  Syringe,        // Vacunas / Tratamientos / Inmunología

  GraduationCap,  // Educación Universitaria / Título / Grado
  BookOpen,       // Pedagogía / Libros / Literatura
  Compass,        // Filosofía / Humanidades / Geografía
  Palette,        // Arte / Diseño Gráfico / Creatividad
  Music,          // Música / Audio / Producción Musical
  Camera,         // Fotografía / Cine / Audiovisual

  Wrench,         // Ingeniería Mecánica / Mantenimiento
  Atom,           // Física / Química Cuántica
  Factory,        // Ingeniería Industrial / Procesos
  HardHat,        // Construcción / Ingeniería Civil
  Leaf,           // Agronomía / Ecología / Medio Ambiente

  Briefcase,      // Negocios / Administración / Management
  Target,         // Marketing / Estrategia / Ventas
  Users,          // Recursos Humanos / Psicología / Sociología

  FileText,       // Documento General
  Sparkles        // Default Zen / Neutro
} from 'lucide-react';

// MAPA DE ICONOS MULTI-ÁREA ULTRA-COMPLETO
export const DOMAIN_ICONS = {
  // 1. DERECHO & CIENCIAS JURÍDICAS
  law: Scale,
  derecho: Scale,
  legal: Scale,
  abogacia: Scale,
  constitucion: Scale,
  justicia: Gavel,
  penal: ShieldAlert,
  juez: Gavel,
  tribunal: Gavel,
  delito: ShieldAlert,
  contrato: Scroll,
  jurisprudencia: Scroll,
  norma: Scroll,
  doctrina: BookMarked,
  codigo_ley: BookMarked,

  // 2. CONTADURÍA & AUDITORÍA
  contaduria: Calculator,
  contabilidad: Calculator,
  balance: Calculator,
  impuestos: Building2,
  tributario: Building2,
  sat: Building2,
  costos: PieChart,
  auditoria: Receipt,
  factura: Receipt,
  nomina: Receipt,
  estados_financieros: FileSpreadsheet,
  asiento: FileSpreadsheet,

  // 3. FINANZAS & ECONOMÍA
  finanzas: DollarSign,
  dinero: Coins,
  moneda: Coins,
  inversion: TrendingUp,
  mercados: TrendingUp,
  bolsa: TrendingUp,
  rentabilidad: TrendingUp,
  banca: Landmark,
  banco: Landmark,
  tesoreria: Wallet,
  presupuesto: Wallet,
  liquidez: DollarSign,
  capital: TrendingUp,

  // 4. TECNOLOGÍA, SOFTWARE & DATOS
  tecnologia: Cpu,
  hardware: Cpu,
  procesador: Cpu,
  codigo: Code,
  programacion: Code,
  software: Code,
  algoritmo: Code,
  datos: Database,
  database: Database,
  sql: Database,
  data_lake: Database,
  redes: Globe,
  cloud: Globe,
  internet: Globe,
  ciberseguridad: ShieldCheck,
  seguridad: ShieldCheck,
  firewall: ShieldCheck,
  devops: Terminal,
  servidor: Terminal,
  terminal: Terminal,
  iot: Radio,
  telecom: Radio,
  arquitectura: Layers,

  // 5. MEDICINA & CIENCIAS DE LA SALUD
  medicina: Stethoscope,
  clinica: Stethoscope,
  salud: HeartPulse,
  hospital: HeartPulse,
  farmacia: Pill,
  farmacologia: Pill,
  medicamento: Pill,
  biologia: Dna,
  genetica: Dna,
  laboratorio: Microscope,
  investigacion: Microscope,
  vacuna: Syringe,
  inmunologia: Syringe,

  // 6. INGENIERÍA & CIENCIAS EXACTAS
  ingenieria: Wrench,
  mecanica: Wrench,
  fisica: Atom,
  quimica: Atom,
  industrial: Factory,
  procesos: Factory,
  civil: HardHat,
  construccion: HardHat,
  medio_ambiente: Leaf,
  ecologia: Leaf,
  agronomia: Leaf,

  // 7. ADMINISTRACIÓN, NEGOCIOS & MARKETING
  administracion: Briefcase,
  negocios: Briefcase,
  empresa: Briefcase,
  marketing: Target,
  estrategia: Target,
  ventas: Target,
  rrhh: Users,
  psicologia: Users,
  sociologia: Users,

  // 8. HUMANIDADES, ARTE & EDUCACIÓN
  educacion: GraduationCap,
  universidad: GraduationCap,
  filosofia: Compass,
  geografia: Compass,
  historia: BookOpen,
  literatura: BookOpen,
  arte: Palette,
  diseno: Palette,
  musica: Music,
  audiovisual: Camera,

  // GENERAL & DEFAULTS
  general: FileText,
  documento: FileText,
  default: Sparkles
};

// HELPER: Detectar automáticamente el área/icono por cualquier texto o nombre
export function getDomainIcon(textOrCategory) {
  if (!textOrCategory) return DOMAIN_ICONS.default;
  const str = String(textOrCategory).toLowerCase().trim();

  // Búsqueda directa exacta
  if (DOMAIN_ICONS[str]) return DOMAIN_ICONS[str];

  // Búsqueda por subcadena
  for (const key of Object.keys(DOMAIN_ICONS)) {
    if (str.includes(key)) {
      return DOMAIN_ICONS[key];
    }
  }

  // Palabras clave semánticas extendidas
  if (/(ley|abogad|jurid|juez|penal|constituc|fiscal|sentenc|demanda|civil)/i.test(str)) return Scale;
  if (/(contab|asiento|partida|debe|haber|balance|auditor|factur|tribut|sat|iva|retenc)/i.test(str)) return Calculator;
  if (/(finanz|ebitda|wacc|invers|accion|bono|interes|bolsa|dinero|capital|banco)/i.test(str)) return DollarSign;
  if (/(medic|pacient|salud|enferm|clinic|cirug|sintom|anatomi)/i.test(str)) return Stethoscope;
  if (/(farmac|dosis|pildor|medicament|terapi)/i.test(str)) return Pill;
  if (/(bio|adn|gen|celul|organel)/i.test(str)) return Dna;
  if (/(codig|software|program|python|react|java|html|script|api|algorit)/i.test(str)) return Code;
  if (/(data|lake|sql|base de datos|spark|parquet|etl)/i.test(str)) return Database;
  if (/(segur|hack|firewall|iam|cifrad|auth)/i.test(str)) return ShieldCheck;
  if (/(ingen|mecanic|estructur|maquin)/i.test(str)) return Wrench;
  if (/(fisic|quimic|molecul|atom)/i.test(str)) return Atom;
  if (/(market|ventas|client|campana|publicid)/i.test(str)) return Target;
  if (/(educ|pedagog|estudiant|docent|alumn)/i.test(str)) return GraduationCap;
  if (/(arte|disen|color|dibuj|grafic)/i.test(str)) return Palette;

  return DOMAIN_ICONS.default;
}
