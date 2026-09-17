// GENERADOR DE PREGUNTAS Y NODOS DISTRIBUIDOS POR TODO EL TABLERO
// Detección dinámica de áreas: Derecho, Contaduría, Finanzas, Tecnología, Medicina, Educación
// Genera de 12 a 16 preguntas distribuidas de forma verdaderamente aleatoria por todo el espacio

export const MULTI_DOMAIN_PRESETS = [
  // 1. TECNOLOGÍA & ARQUITECTURA CLOUD (16 Preguntas)
  {
    theme: "Tecnología & Arquitectura Cloud",
    title: "ARQUITECTURA DE DATOS: LAGO DISTRIBUIDO Y SISTEMAS NUBE",
    domainKey: "tecnologia",
    nodes: [
      {
        id: "node_1",
        domain: "tecnologia",
        icon: "database",
        label: "Sync CDC DB",
        question: "¿Cómo sincronizas en tiempo real bases de datos relacionales sin saturar el motor de producción?",
        hint: "Mecanismo de captura de cambios (CDC) tipo Debezium o AWS DMS."
      },
      {
        id: "node_2",
        domain: "codigo",
        icon: "codigo",
        label: "Spark Batch",
        question: "¿Qué motor distribuido orquesta la extracción y transformación de datos en lotes masivos?",
        hint: "Procesamiento distribuido en memoria con Apache Spark o AWS Glue."
      },
      {
        id: "node_3",
        domain: "ciberseguridad",
        icon: "ciberseguridad",
        label: "IAM RBAC",
        question: "¿Qué estándar garantiza el principio de mínimo privilegio en el acceso al Lago de Datos?",
        hint: "Políticas RBAC y roles temporales con AWS IAM."
      },
      {
        id: "node_4",
        domain: "redes",
        icon: "redes",
        label: "API Gateway",
        question: "¿Cómo controlas el tráfico, throttling y rate limiting de microservicios externos?",
        hint: "Un punto de entrada unificado y seguro para clientes HTTP/REST."
      },
      {
        id: "node_5",
        domain: "datos",
        icon: "datos",
        label: "S3 Raw Lake",
        question: "¿Dónde se resguardan los archivos crudos con durabilidad del 99.999999999%?",
        hint: "Almacenamiento inmutable de objetos particionado por fechas en S3."
      },
      {
        id: "node_6",
        domain: "devops",
        icon: "devops",
        label: "K8s Mesh",
        question: "¿Qué orquestador gestiona el ciclo de vida y escalado horizontal de contenedores?",
        hint: "Kubernetes con Service Mesh para trazabilidad distribuida."
      },
      {
        id: "node_7",
        domain: "tecnologia",
        icon: "iot",
        label: "IoT Telemetry",
        question: "¿Qué protocolo ligero de mensajería 'publish-subscribe' se emplea para telemetría de sensores?",
        hint: "Protocolo MQTT con brokers de baja latencia."
      },
      {
        id: "node_8",
        domain: "ciberseguridad",
        icon: "ciberseguridad",
        label: "JWT Auth Token",
        question: "¿Qué estándar de tokens sin estado permite transmitir identidad y claims de forma compacta y firmada?",
        hint: "JSON Web Tokens con firma criptográfica RS256 o HS256."
      },
      {
        id: "node_9",
        domain: "datos",
        icon: "database",
        label: "Cassandra NoSQL",
        question: "¿Qué base de datos distribuida columnar está diseñada para escrituras masivas sin punto único de falla?",
        hint: "Arquitectura Peer-to-Peer tipo Apache Cassandra o ScyllaDB."
      },
      {
        id: "node_10",
        domain: "redes",
        icon: "cloud",
        label: "Edge CDN",
        question: "¿Cómo reduces la latencia global sirviendo activos estáticos desde servidores perimetrales cercanos?",
        hint: "Red de distribución de contenido (CDN) tipo Cloudflare o CloudFront."
      },
      {
        id: "node_11",
        domain: "codigo",
        icon: "codigo",
        label: "Event Streaming",
        question: "¿Qué bus de eventos desacopla productores y consumidores mediante particiones de logs append-only?",
        hint: "Apache Kafka o AWS Kinesis Data Streams."
      },
      {
        id: "node_12",
        domain: "datos",
        icon: "datos",
        label: "Parquet Columnar",
        question: "¿Qué formato de archivo abierto columnar optimiza las consultas analíticas reduciendo el I/O?",
        hint: "Formato Apache Parquet con compresión Snappy."
      },
      {
        id: "node_13",
        domain: "devops",
        icon: "terminal",
        label: "Terraform IaC",
        question: "¿Cómo declaras y aprovisionas infraestructura en la nube de forma repetible y versionada?",
        hint: "Infraestructura como Código (IaC) con Terraform o OpenTofu."
      },
      {
        id: "node_14",
        domain: "tecnologia",
        icon: "tecnologia",
        label: "GraphQL API",
        question: "¿Qué lenguaje de consulta permite a los clientes solicitar exactamente los datos que necesitan?",
        hint: "GraphQL con esquemas tipados y resolución por campo."
      }
    ]
  },

  // 2. DERECHO & CIENCIAS JURÍDICAS (15 Preguntas)
  {
    theme: "Derecho & Ciencias Jurídicas",
    title: "SISTEMA JUDICIAL: PROCEDIMIENTO, GARANTÍAS Y NORMAS",
    domainKey: "derecho",
    nodes: [
      {
        id: "node_1",
        domain: "derecho",
        icon: "law",
        label: "Debido Proceso",
        question: "¿Qué garantía constitucional asegura que ninguna persona sea juzgada sin las formalidades de ley?",
        hint: "Principio fundamental del Debido Proceso y derecho a la defensa técnica."
      },
      {
        id: "node_2",
        domain: "justicia",
        icon: "justicia",
        label: "Jurisdicción",
        question: "¿Cuál es la potestad soberana que tienen los jueces del Estado para administrar justicia?",
        hint: "Competencia territorial, por materia y grado de los tribunales."
      },
      {
        id: "node_3",
        domain: "contrato",
        icon: "contrato",
        label: "Contrato Civil",
        question: "¿Qué elemento de validez requiere que el acuerdo de voluntades no vulnere leyes ni orden público?",
        hint: "Objeto y causa lícita en la celebración de convenios."
      },
      {
        id: "node_4",
        domain: "derecho",
        icon: "derecho",
        label: "Onus Probandi",
        question: "¿A quién le corresponde demostrar la veracidad de los hechos alegados en la demanda?",
        hint: "Principio 'Onus probandi' que recae principalmente en quien afirma."
      },
      {
        id: "node_5",
        domain: "penal",
        icon: "penal",
        label: "Tipicidad Penal",
        question: "¿Qué principio exige que la conducta delictiva esté previamente tipificada en la ley vigente?",
        hint: "'Nullum crimen, nulla poena sine lege previa' y taxatividad."
      },
      {
        id: "node_6",
        domain: "jurisprudencia",
        icon: "doctrina",
        label: "Cosa Juzgada",
        question: "¿Qué efecto procesal impide reabrir un debate o juzgar por los mismos hechos con sentencia firme?",
        hint: "Inmutabilidad de la sentencia ejecutoriada (Non bis in idem)."
      },
      {
        id: "node_7",
        domain: "derecho",
        icon: "law",
        label: "Habeas Corpus",
        question: "¿Qué acción constitucional tutela la libertad personal cuando una detención resulta arbitraria o ilegal?",
        hint: "Garantía de libertad individual e inmediata puesta a disposición judicial."
      },
      {
        id: "node_8",
        domain: "constitucion",
        icon: "constitucion",
        label: "Control Constitucional",
        question: "¿Qué mecanismo expulsa del ordenamiento jurídico normas que contradigan la Carta Magna?",
        hint: "Control difuso o concentrado de constitucionalidad."
      },
      {
        id: "node_9",
        domain: "derecho",
        icon: "contrato",
        label: "Fuerza Mayor",
        question: "¿Qué figura exime de responsabilidad contractual ante un acontecimiento imprevisible e irresistible?",
        hint: "Caso fortuito o fuerza mayor debidamente comprobado."
      },
      {
        id: "node_10",
        domain: "penal",
        icon: "penal",
        label: "Presunción Inocencia",
        question: "¿Qué derecho fundamental establece que toda persona se considera inocente hasta condena judicial firme?",
        hint: "Principio 'In dubio pro reo' y garantía del debido proceso."
      },
      {
        id: "node_11",
        domain: "justicia",
        icon: "justicia",
        label: "Caducidad de Acción",
        question: "¿Qué fenómeno extingue la posibilidad de ejercer un derecho o acción por el transcurso fatal del tiempo?",
        hint: "Términos procesales improrrogables de prescripción o caducidad."
      },
      {
        id: "node_12",
        domain: "jurisprudencia",
        icon: "scroll",
        label: "Pacta Sunt Servanda",
        question: "¿Qué principio milenario establece que los contratos válidamente celebrados son ley entre las partes?",
        hint: "Fuerza vinculante del acuerdo de voluntades."
      },
      {
        id: "node_13",
        domain: "derecho",
        icon: "doctrina",
        label: "Buena Fe Procesal",
        question: "¿Qué postulado ético exige a los litigantes actuar con lealtad y veracidad ante los tribunales?",
        hint: "Principio de probidad y proscripción del fraude procesal."
      },
      {
        id: "node_14",
        domain: "penal",
        icon: "shieldalert",
        label: "Legítima Defensa",
        question: "¿Qué causa de justificación exime de pena a quien repele una agresión ilegítima y actual con proporcionalidad?",
        hint: "Defensa necesaria de bienes jurídicos propios o ajenos."
      }
    ]
  },

  // 3. CONTADURÍA PÚBLICA & AUDITORÍA (14 Preguntas)
  {
    theme: "Contaduría Pública & Normas NIIF",
    title: "AUDITORÍA: BALANCE, ASIENTOS Y CONTROL FISCAL",
    domainKey: "contaduria",
    nodes: [
      {
        id: "node_1",
        domain: "contaduria",
        icon: "contaduria",
        label: "Balance General",
        question: "¿Qué ecuación fundamental establece que los Recursos (Activo) equivalen al Pasivo más el Patrimonio?",
        hint: "Ecuación Contable: Activo = Pasivo + Capital Contable."
      },
      {
        id: "node_2",
        domain: "tributario",
        icon: "tributario",
        label: "Auditoría Fiscal",
        question: "¿Qué organismo tributario fiscaliza y exige la declaración de retenciones en la fuente e IVA?",
        hint: "Autoridad hacendaria y de administración tributaria."
      },
      {
        id: "node_3",
        domain: "contabilidad",
        icon: "estados_financieros",
        label: "Normas NIIF/IFRS",
        question: "¿Qué marco normativo internacional estandariza la comparabilidad de estados financieros mundiales?",
        hint: "Normas Internacionales de Información Financiera (IFRS / NIIF)."
      },
      {
        id: "node_4",
        domain: "costos",
        icon: "costos",
        label: "Costeo ABC",
        question: "¿Qué metodología asigna los costos indirectos a partir de las actividades reales generadoras?",
        hint: "Activity-Based Costing (Costeo por Actividades)."
      },
      {
        id: "node_5",
        domain: "auditoria",
        icon: "factura",
        label: "Conciliación Bancaria",
        question: "¿Cómo se llama el proceso de cotejar los registros contables del libro mayor con el extracto bancario?",
        hint: "Detección de cheques en tránsito, notas de débito y depósitos no registrados."
      },
      {
        id: "node_6",
        domain: "contaduria",
        icon: "asiento",
        label: "Partida Doble",
        question: "¿Qué postulado histórico formulado por Luca Pacioli dicta que 'no hay deudor sin acreedor'?",
        hint: "Principio de la Partida Doble en el libro diario."
      },
      {
        id: "node_7",
        domain: "contabilidad",
        icon: "contaduria",
        label: "Depreciación Línea",
        question: "¿Qué método distribuye uniformemente el costo de un activo fijo tangible a lo largo de su vida útil?",
        hint: "Método de línea recta considerando valor residual."
      },
      {
        id: "node_8",
        domain: "tributario",
        icon: "factura",
        label: "Crédito Fiscal IVA",
        question: "¿Cómo se denomina el IVA pagado en compras de insumos que puede restarse del IVA cobrado en ventas?",
        hint: "IVA descontable o crédito fiscal deducible."
      },
      {
        id: "node_9",
        domain: "auditoria",
        icon: "auditoria",
        label: "Dictamen Auditoría",
        question: "¿Qué opinión emite un auditor independiente cuando los estados financieros reflejan la imagen fiel sin salvedades?",
        hint: "Opinión limpia o favorable sin reservas."
      },
      {
        id: "node_10",
        domain: "costos",
        icon: "costos",
        label: "Punto de Equilibrio",
        question: "¿Qué nivel de ventas iguala los ingresos totales con los costos fijos y variables sin generar pérdida ni ganancia?",
        hint: "Break-even point o umbral de rentabilidad."
      },
      {
        id: "node_11",
        domain: "contabilidad",
        icon: "estados_financieros",
        label: "Principio Devengo",
        question: "¿Qué principio contable exige reconocer ingresos y gastos en el período en que ocurren, sin importar su cobro?",
        hint: "Base contable del devengo o acumulación (accrual)."
      },
      {
        id: "node_12",
        domain: "contaduria",
        icon: "asiento",
        label: "Asiento de Cierre",
        question: "¿Qué registro contable al final del ejercicio cancela las cuentas nominales contra Pérdidas y Ganancias?",
        hint: "Cierre de cuentas transitorias de resultados."
      },
      {
        id: "node_13",
        domain: "tributario",
        icon: "tributario",
        label: "Retención Fuente",
        question: "¿Qué mecanismo de recaudo anticipado obliga al pagador a detraer un porcentaje del impuesto en la transacción?",
        hint: "Retención en la fuente a título de renta."
      },
      {
        id: "node_14",
        domain: "auditoria",
        icon: "factura",
        label: "Inventario FIFO",
        question: "¿Qué método de valuación asume que los primeros productos comprados son los primeros que se venden?",
        hint: "Método PEPS / FIFO (First-In, First-Out)."
      }
    ]
  },

  // 4. FINANZAS CORPORATIVAS & MERCADOS (14 Preguntas)
  {
    theme: "Finanzas Corporativas & Mercados",
    title: "MERCADO DE CAPITALES: VALUACIÓN & PORTAFOLIOS",
    domainKey: "finanzas",
    nodes: [
      {
        id: "node_1",
        domain: "finanzas",
        icon: "finanzas",
        label: "Flujo Libre (FCF)",
        question: "¿Qué indicador mide el efectivo operativo disponible tras cubrir inversiones de capital (CapEx)?",
        hint: "Free Cash Flow (Flujo de Caja Libre)."
      },
      {
        id: "node_2",
        domain: "mercados",
        icon: "inversion",
        label: "EBITDA Operativo",
        question: "¿Qué beneficio contable evalúa el resultado puro antes de intereses, impuestos y amortizaciones?",
        hint: "Earnings Before Interest, Taxes, Depreciation and Amortization."
      },
      {
        id: "node_3",
        domain: "banco",
        icon: "banca",
        label: "Costo WACC",
        question: "¿Qué tasa pondera el costo exigido por los accionistas frente a la tasa de interés de la deuda?",
        hint: "Weighted Average Cost of Capital (WACC)."
      },
      {
        id: "node_4",
        domain: "mercados",
        icon: "bolsa",
        label: "Modelo CAPM",
        question: "¿Qué coeficiente (Beta) cuantifica el riesgo sistemático de un activo frente al mercado global?",
        hint: "Capital Asset Pricing Model y prima de riesgo de mercado."
      },
      {
        id: "node_5",
        domain: "tesoreria",
        icon: "tesoreria",
        label: "Valor Presente (VPN)",
        question: "¿Qué criterio descuenta flujos futuros a valor de hoy para determinar si un proyecto añade valor?",
        hint: "Valor Presente Neto (VPN o NPV)."
      },
      {
        id: "node_6",
        domain: "finanzas",
        icon: "moneda",
        label: "Tasa Interna (TIR)",
        question: "¿A qué tasa de descuento el Valor Presente Neto (VPN) del proyecto se hace exactamente cero?",
        hint: "Tasa Interna de Retorno (TIR / IRR)."
      },
      {
        id: "node_7",
        domain: "mercados",
        icon: "inversion",
        label: "Apalancamiento D/E",
        question: "¿Qué ratio compara la deuda total de la empresa frente a su patrimonio neto para medir riesgo financiero?",
        hint: "Ratio Debt-to-Equity (Apalancamiento financiero)."
      },
      {
        id: "node_8",
        domain: "finanzas",
        icon: "bolsa",
        label: "Ratio Sharpe",
        question: "¿Qué métrica calcula el rendimiento excedente de una cartera por cada unidad de volatilidad o riesgo?",
        hint: "Sharpe Ratio relativo a la tasa libre de riesgo."
      },
      {
        id: "node_9",
        domain: "banco",
        icon: "banca",
        label: "Tasa Libre Riesgo",
        question: "¿Qué activo soberano se utiliza comúnmente como referencia de rendimiento libre de riesgo en dólares?",
        hint: "Bonos del Tesoro de EE.UU. (US Treasury Bills)."
      },
      {
        id: "node_10",
        domain: "tesoreria",
        icon: "tesoreria",
        label: "Capital de Trabajo",
        question: "¿Qué fondo operativo resulta de restar el Pasivo Corriente al Activo Corriente de la empresa?",
        hint: "Working Capital neto para la operación a corto plazo."
      },
      {
        id: "node_11",
        domain: "finanzas",
        icon: "moneda",
        label: "Dividendo Yield",
        question: "¿Qué ratio financiero refleja el porcentaje que paga una acción en dividendos respecto a su precio en bolsa?",
        hint: "Rentabilidad por dividendo anual (Dividend Yield)."
      },
      {
        id: "node_12",
        domain: "mercados",
        icon: "inversion",
        label: "Opciones Derivados",
        question: "¿Qué contrato otorga el derecho, pero no la obligación, de comprar un activo a un precio fijado (Strike)?",
        hint: "Opción financiera de compra (Call Option)."
      },
      {
        id: "node_13",
        domain: "banco",
        icon: "banca",
        label: "Calificación Crediticia",
        question: "¿Qué agencias otorgan ratings como AAA, BBB o grado especulativo a la solvencia de emisores?",
        hint: "Moody's, Standard & Poor's y Fitch Ratings."
      },
      {
        id: "node_14",
        domain: "finanzas",
        icon: "finanzas",
        label: "Valor Liquidación",
        question: "¿Qué valor teórico obtendrían los accionistas si todos los activos se vendieran y se pagaran las deudas?",
        hint: "Valor de liquidación patrimonial neta."
      }
    ]
  },

  // 5. MEDICINA & CIENCIAS DE LA SALUD (14 Preguntas)
  {
    theme: "Medicina & Ciencias de la Salud",
    title: "FISIOPATOLOGÍA CLÍNICA: DIAGNÓSTICO Y TRATAMIENTO",
    domainKey: "medicina",
    nodes: [
      {
        id: "node_1",
        domain: "medicina",
        icon: "medicina",
        label: "Historia Clínica",
        question: "¿Qué sección del examen clínico recoge los síntomas referidos por el paciente en orden cronológico?",
        hint: "Anamnesis y motivo de consulta médica."
      },
      {
        id: "node_2",
        domain: "salud",
        icon: "salud",
        label: "Gasto Cardíaco",
        question: "¿Qué volumen de sangre bombea cada ventrículo del corazón en el lapso de un minuto?",
        hint: "Frecuencia Cardíaca multiplicada por el Volumen Sistólico."
      },
      {
        id: "node_3",
        domain: "farmacia",
        icon: "farmacia",
        label: "Farmacocinética",
        question: "¿Qué siglas resumen el camino que recorre un fármaco en el organismo (LADME)?",
        hint: "Liberación, Absorción, Distribución, Metabolismo y Excreción."
      },
      {
        id: "node_4",
        domain: "biologia",
        icon: "biologia",
        label: "Genoma Celular",
        question: "¿Qué estructura citoplasmática contiene el material genético y dirige la síntesis de proteínas?",
        hint: "El núcleo celular y la transcripción de ARN mensajero."
      },
      {
        id: "node_5",
        domain: "laboratorio",
        icon: "laboratorio",
        label: "Biometría Hemática",
        question: "¿Qué parámetro de la sangre evalúa el porcentaje de glóbulos rojos respecto al volumen total?",
        hint: "Hematocrito y niveles basales de hemoglobina."
      },
      {
        id: "node_6",
        domain: "medicina",
        icon: "vacuna",
        label: "Inmunidad Activa",
        question: "¿Qué células del sistema inmunitario producen anticuerpos específicos tras el contacto con el antígeno?",
        hint: "Linfocitos B y células plasmáticas de memoria."
      },
      {
        id: "node_7",
        domain: "salud",
        icon: "salud",
        label: "Presión Arterial",
        question: "¿Qué valores de presión sistólica y diastólica en mmHg se consideran el estándar normotensivo?",
        hint: "Aproximadamente 120/80 mmHg en reposo."
      },
      {
        id: "node_8",
        domain: "farmacia",
        icon: "farmacia",
        label: "Vida Media (t1/2)",
        question: "¿Cómo se llama el tiempo necesario para que la concentración plasmática de un fármaco se reduzca al 50%?",
        hint: "Semivida o vida media de eliminación."
      },
      {
        id: "node_9",
        domain: "medicina",
        icon: "medicina",
        label: "Glomerulonefritis",
        question: "¿Qué unidad funcional microscópica del riñón realiza la ultrafiltración del plasma sanguíneo?",
        hint: "La nefrona y el glomérulo renal."
      },
      {
        id: "node_10",
        domain: "biologia",
        icon: "biologia",
        label: "Metabolismo ATP",
        question: "¿Qué organelo es denominado la 'central energética' por generar ATP mediante fosforilación oxidativa?",
        hint: "La mitocondria celular."
      },
      {
        id: "node_11",
        domain: "laboratorio",
        icon: "laboratorio",
        label: "Gasometría Arterial",
        question: "¿Qué rango de pH fisiológico normal mantiene la sangre arterial humana en equilibrio ácido-base?",
        hint: "Entre 7.35 y 7.45 amortiguado por bicarbonato."
      },
      {
        id: "node_12",
        domain: "salud",
        icon: "salud",
        label: "Sepsis Shock",
        question: "¿Qué respuesta inflamatoria sistémica desregulada ante una infección compromete la perfusión de órganos?",
        hint: "Sepsis y shock séptico con hipotensión refractaria."
      },
      {
        id: "node_13",
        domain: "farmacia",
        icon: "farmacia",
        label: "Antibioterapia Beta",
        question: "¿Qué mecanismo de acción tienen las penicilinas y cefalosporinas contra bacterias grampositivas?",
        hint: "Inhibición de la síntesis de la pared celular bacteriana (peptidoglicano)."
      },
      {
        id: "node_14",
        domain: "medicina",
        icon: "vacuna",
        label: "Epinefrina Shock",
        question: "¿Qué fármaco agonista adrenérgico de primera línea revierte el broncoespasmo y colapso en anafilaxia?",
        hint: "Adrenalina (Epinefrina) intramuscular inmediata."
      }
    ]
  },

  // 6. EDUCACIÓN & HUMANIDADES (14 Preguntas)
  {
    theme: "Educación, Pedagogía & Filosofía",
    title: "TEORÍAS DEL APRENDIZAJE & MODELOS COGNITIVOS",
    domainKey: "educacion",
    nodes: [
      {
        id: "node_1",
        domain: "educacion",
        icon: "educacion",
        label: "Constructivismo",
        question: "¿Qué autor postuló que los estudiantes construyen su propio conocimiento mediante asimilación y acomodación?",
        hint: "Jean Piaget y las etapas del desarrollo cognitivo."
      },
      {
        id: "node_2",
        domain: "educacion",
        icon: "filosofia",
        label: "Zona Proximal",
        question: "¿Qué concepto describe la distancia entre lo que el alumno puede hacer solo y con la guía de un tutor?",
        hint: "Zona de Desarrollo Próximo (ZDP) de Lev Vygotsky."
      },
      {
        id: "node_3",
        domain: "educacion",
        icon: "historia",
        label: "Significativo Ausubel",
        question: "¿Qué pedagogo destacó la importancia de anclar la nueva información a los conocimientos previos (subsunsores)?",
        hint: "David Ausubel y la estructura cognitiva previa."
      },
      {
        id: "node_4",
        domain: "arte",
        icon: "arte",
        label: "Inteligencias Múltiples",
        question: "¿Qué psicólogo propuso que la inteligencia no es unitaria sino compuesta por al menos 8 inteligencias distintas?",
        hint: "Howard Gardner (lingüística, musical, espacial, etc.)."
      },
      {
        id: "node_5",
        domain: "educacion",
        icon: "doctrina",
        label: "Evaluación Formativa",
        question: "¿Qué tipo de evaluación acompaña el proceso continuo de aprendizaje para retroalimentar sin limitarse a calificar?",
        hint: "Evaluación diagnóstica y formativa orientada a la mejora continua."
      },
      {
        id: "node_6",
        domain: "educacion",
        icon: "educacion",
        label: "Pedagogía Crítica",
        question: "¿Qué educador latinoamericano promovió la alfabetización concientizadora en 'Pedagogía del Oprimido'?",
        hint: "Paulo Freire y el diálogo liberador."
      },
      {
        id: "node_7",
        domain: "filosofia",
        icon: "filosofia",
        label: "Mayéutica Socrática",
        question: "¿Qué método dialéctico guiado por preguntas sucesivas ayuda al interlocutor a 'dar a luz' a la verdad?",
        hint: "La mayéutica de Sócrates en la filosofía griega."
      },
      {
        id: "node_8",
        domain: "educacion",
        icon: "educacion",
        label: "Taxonomía Bloom",
        question: "¿Qué clasificación jerárquica de habilidades cognitivas culmina en los niveles de Analizar, Evaluar y Crear?",
        hint: "Taxonomía de objetivos educativos de Benjamin Bloom."
      },
      {
        id: "node_9",
        domain: "arte",
        icon: "arte",
        label: "Pensamiento Divergente",
        question: "¿Qué forma de pensamiento busca múltiples soluciones creativas e inusuales ante un mismo problema?",
        hint: "Pensamiento lateral y creatividad divergente."
      },
      {
        id: "node_10",
        domain: "historia",
        icon: "historia",
        label: "Fuentes Primarias",
        question: "¿Qué tipo de fuente histórica contemporánea a los hechos (cartas, diarios, actas) aporta testimonio directo?",
        hint: "Fuentes primarias o directas de primera mano."
      },
      {
        id: "node_11",
        domain: "educacion",
        icon: "educacion",
        label: "Metacognición",
        question: "¿Qué capacidad de autorregulación implica reflexionar sobre los propios procesos de pensamiento y estudio?",
        hint: "Metacognición y aprender a aprender."
      },
      {
        id: "node_12",
        domain: "filosofia",
        icon: "filosofia",
        label: "Imperativo Categórico",
        question: "¿Qué principio ético kantiano manda actuar solo según una máxima que desees que se torne ley universal?",
        hint: "Ética deontológica de Immanuel Kant."
      },
      {
        id: "node_13",
        domain: "educacion",
        icon: "educacion",
        label: "Aprendizaje Cooperativo",
        question: "¿Qué enfoque didáctico estructura pequeños grupos heterogéneos donde el éxito de uno depende del equipo?",
        hint: "Interdependencia positiva y responsabilidad compartida."
      },
      {
        id: "node_14",
        domain: "arte",
        icon: "arte",
        label: "Estética y Catarsis",
        question: "¿Qué término acuñado por Aristóteles define la purificación o liberación emocional del espectador ante la tragedia?",
        hint: "Catarsis a través de la compasión y el temor en la Poética."
      }
    ]
  }
];

// Helper para cartas iniciales en abanico
export const DOMAIN_CARDS_PRESETS = {
  0: [
    { id: 'c1', name: 'DEBEZIUM CDC', cost: '+1', type: 'purple', domain: 'tecnologia', rotation: -16, zIndex: 10 },
    { id: 'c2', name: 'APACHE SPARK', cost: '+2', type: 'blue', domain: 'codigo', rotation: -8, zIndex: 20 },
    { id: 'c3', name: 'AWS IAM ROLE', cost: '+3', type: 'red', domain: 'ciberseguridad', rotation: 0, zIndex: 30 },
    { id: 'c4', name: 'KONG GATEWAY', cost: '+1', type: 'emerald', domain: 'redes', rotation: 8, zIndex: 20 },
    { id: 'c5', name: 'AMAZON S3 RAW', cost: '+2', type: 'yellow', domain: 'datos', rotation: 16, zIndex: 10 },
  ],
  1: [
    { id: 'c1', name: 'DEBIDO PROCESO', cost: '+1', type: 'yellow', domain: 'derecho', rotation: -16, zIndex: 10 },
    { id: 'c2', name: 'JUEZ COMPETENTE', cost: '+2', type: 'purple', domain: 'justicia', rotation: -8, zIndex: 20 },
    { id: 'c3', name: 'CAUSA LÍCITA', cost: '+3', type: 'blue', domain: 'contrato', rotation: 0, zIndex: 30 },
    { id: 'c4', name: 'ONUS PROBANDI', cost: '+1', type: 'emerald', domain: 'derecho', rotation: 8, zIndex: 20 },
    { id: 'c5', name: 'NULLUM CRIMEN', cost: '+2', type: 'red', domain: 'penal', rotation: 16, zIndex: 10 },
  ],
  2: [
    { id: 'c1', name: 'ACTIVO = PASIVO + PAT', cost: '+1', type: 'blue', domain: 'contaduria', rotation: -16, zIndex: 10 },
    { id: 'c2', name: 'AUDITORÍA FISCAL SAT', cost: '+2', type: 'yellow', domain: 'tributario', rotation: -8, zIndex: 20 },
    { id: 'c3', name: 'IFRS / NIIF PLENAS', cost: '+3', type: 'emerald', domain: 'contabilidad', rotation: 0, zIndex: 30 },
    { id: 'c4', name: 'COSTEO ACTIVIDAD ABC', cost: '+1', type: 'purple', domain: 'costos', rotation: 8, zIndex: 20 },
    { id: 'c5', name: 'PARTIDA DOBLE PACIOLI', cost: '+2', type: 'red', domain: 'contaduria', rotation: 16, zIndex: 10 },
  ],
  3: [
    { id: 'c1', name: 'FLUJO CAJA LIBRE (FCF)', cost: '+1', type: 'emerald', domain: 'finanzas', rotation: -16, zIndex: 10 },
    { id: 'c2', name: 'MARGEN EBITDA', cost: '+2', type: 'purple', domain: 'mercados', rotation: -8, zIndex: 20 },
    { id: 'c3', name: 'TASA WACC CAPITAL', cost: '+3', type: 'blue', domain: 'banco', rotation: 0, zIndex: 30 },
    { id: 'c4', name: 'BETA CAPM MERCADO', cost: '+1', type: 'yellow', domain: 'mercados', rotation: 8, zIndex: 20 },
    { id: 'c5', name: 'TIR INTERNA RETORNO', cost: '+2', type: 'red', domain: 'finanzas', rotation: 16, zIndex: 10 },
  ],
  4: [
    { id: 'c1', name: 'ANAMNESIS CLÍNICA', cost: '+1', type: 'red', domain: 'medicina', rotation: -16, zIndex: 10 },
    { id: 'c2', name: 'GASTO CARDÍACO', cost: '+2', type: 'emerald', domain: 'salud', rotation: -8, zIndex: 20 },
    { id: 'c3', name: 'CINÉTICA LADME', cost: '+3', type: 'purple', domain: 'farmacia', rotation: 0, zIndex: 30 },
    { id: 'c4', name: 'HEMATOCRITO BASAL', cost: '+1', type: 'yellow', domain: 'laboratorio', rotation: 8, zIndex: 20 },
    { id: 'c5', name: 'LINFOCITOS B MEMORIA', cost: '+2', type: 'blue', domain: 'medicina', rotation: 16, zIndex: 10 },
  ],
  5: [
    { id: 'c1', name: 'CONSTRUCTIVISMO PIAGET', cost: '+1', type: 'blue', domain: 'educacion', rotation: -16, zIndex: 10 },
    { id: 'c2', name: 'ZONA DESARROLLO (ZDP)', cost: '+2', type: 'emerald', domain: 'educacion', rotation: -8, zIndex: 20 },
    { id: 'c3', name: 'APRENDIZAJE SIGNIFICATIVO', cost: '+3', type: 'yellow', domain: 'educacion', rotation: 0, zIndex: 30 },
    { id: 'c4', name: 'INTELIGENCIAS MÚLTIPLES', cost: '+1', type: 'purple', domain: 'arte', rotation: 8, zIndex: 20 },
    { id: 'c5', name: 'PEDAGOGÍA CRÍTICA FREIRE', cost: '+2', type: 'red', domain: 'educacion', rotation: 16, zIndex: 10 },
  ]
};

// Formas geométricas y paleta de colores para asignar aleatoriamente
const AVAILABLE_SHAPES = ['squircle', 'hexagon', 'circle', 'diamond', 'pill', 'shield'];
const AVAILABLE_COLORS = ['blue', 'yellow', 'purple', 'emerald', 'rose', 'indigo'];

// Generador de posiciones que garantiza CERO superposiciones y aprovecha el 100% del tablero disponible (incluyendo laterales)
export function generateRandomScatteredPositions(count) {
  // Dimensiones del área útil del tablero táctico expandido
  // X: desde 4% hasta 96% (aprovechando completamente los laterales izquierdo y derecho)
  // Y: desde 10% hasta 88% (aprovechando el alto total)
  const xMin = 4;
  const xMax = 96;
  const yMin = 10;
  const yMax = 88;

  // Calculamos una cuadrícula limpia de 5 columnas x 3 filas = 15 celdas
  const cols = 5;
  const rows = Math.max(3, Math.ceil(count / cols));

  const colWidth = (xMax - xMin) / cols;
  const rowHeight = (yMax - yMin) / rows;

  // Generamos todas las celdas únicas con centros que van de borde a borde
  const availableCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Centro de cada celda distribuido uniformemente de extremo a extremo
      const cx = xMin + (c + 0.5) * colWidth;
      const cy = yMin + (r + 0.5) * rowHeight;
      availableCells.push({ x: cx, y: cy, r, c });
    }
  }

  // Barajado Fisher-Yates sobre las celdas disponibles
  for (let i = availableCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableCells[i], availableCells[j]] = [availableCells[j], availableCells[i]];
  }

  // Tomamos exactamente una celda por cada nodo (sin repetición)
  const chosenCells = availableCells.slice(0, count);

  return chosenCells.map((cell) => {
    // Jitter seguro y suave dentro de la celda (+/- 12% del ancho de celda)
    const maxJitterX = colWidth * 0.12;
    const maxJitterY = rowHeight * 0.12;

    const jitterX = (Math.random() - 0.5) * 2 * maxJitterX;
    const jitterY = (Math.random() - 0.5) * 2 * maxJitterY;

    // Asegurar que las columnas de los bordes lleguen bien a los laterales (hasta 4% y 96%)
    const posX = Math.max(xMin, Math.min(xMax, cell.x + jitterX));
    const posY = Math.max(yMin, Math.min(yMax, cell.y + jitterY));

    return {
      left: `${posX.toFixed(1)}%`,
      top: `${posY.toFixed(1)}%`
    };
  });
}

// Generador de nodos aleatorios con formas y ubicaciones aleatorias
export function createRandomizedNodes(baseNodes, targetCount = null) {
  // Llenar todo el tablero con entre 12 y 15 preguntas
  const count = targetCount || Math.min(baseNodes.length, Math.max(12, Math.min(15, baseNodes.length)));
  const selectedNodes = baseNodes.slice(0, count);
  const randomPositions = generateRandomScatteredPositions(selectedNodes.length);

  return selectedNodes.map((n, idx) => {
    const randomShape = AVAILABLE_SHAPES[idx % AVAILABLE_SHAPES.length];
    const randomColor = AVAILABLE_COLORS[idx % AVAILABLE_COLORS.length];
    const pos = randomPositions[idx] || { left: `${12 + (idx % 4) * 22}%`, top: `${15 + Math.floor(idx / 4) * 22}%` };

    return {
      ...n,
      shape: randomShape,
      color: randomColor,
      pos: pos
    };
  });
}
