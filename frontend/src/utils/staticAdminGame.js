/**
 * Preguntas y Tableros Estáticos basados 100% en administracion.pdf:
 * "ORIGEN Y DESARROLLO DE LA ADMINISTRACIÓN"
 * Revista Perspectivas, Universidad Católica Boliviana San Pablo.
 * 
 * Contiene los 5 niveles pedagógicos pre-generados con:
 * - Preguntas textuales y directas del documento
 * - Respuestas correctas
 * - Pistas cognitivas extraídas del autor
 * - Cartas con distractores reales de administración
 */

export const STATIC_ADMIN_GAME = {
  folder_id: "folder_administracion_default",
  folder_name: "Administración General",
  folder_description: "Origen y Desarrollo de la Administración (Perspectivas - UCB San Pablo)",
  document_name: "administracion.pdf",
  levels: {
    1: {
      level: 1,
      title: "Simulacro: ORIGEN Y DESARROLLO DE LA ADMINISTRACIÓN - Nivel Fácil",
      difficulty: "facil",
      nodes: [
        {
          id: "node_1",
          label: "Definición de Administración",
          question: "¿Qué actividad humana organiza y dirige el trabajo individual y colectivo para alcanzar objetivos?",
          description: "Revisa el resumen del texto sobre la actividad encargada de hacer productivos los recursos."
        },
        {
          id: "node_2",
          label: "Concepto de Henri Fayol",
          question: "¿Quién definió la administración como el acto de prever, organizar, dirigir, coordinar y controlar a través de la gerencia?",
          description: "Es uno de los pioneros clásicos de la administración citado en el capítulo 1.1."
        },
        {
          id: "node_3",
          label: "Ámbito de Acción",
          question: "¿Cuál es la unidad social de producción o servicio que constituye el ámbito de acción principal de la administración?",
          description: "Entendida como la unidad social constituida por personas, bienes y conocimientos técnicos."
        }
      ],
      cards: [
        {
          id: "card_1",
          concept_name: "Definición de Administración",
          content: "Actividad humana encargada de organizar y dirigir el trabajo individual y colectivo efectivo en términos de objetivos.",
          points_multiplier: "1x"
        },
        {
          id: "card_2",
          concept_name: "Concepto de Henri Fayol",
          content: "Administrar es prever, organizar, dirigir, coordinar y controlar a través de la gerencia institucional.",
          points_multiplier: "1x"
        },
        {
          id: "card_3",
          concept_name: "Ámbito de Acción",
          content: "La Empresa, unidad social de producción o servicio conformada por personas que aportan bienes y trabajo.",
          points_multiplier: "1x"
        },
        // Distractor
        {
          id: "card_distractor_1",
          concept_name: "Economía de Escala Feudal",
          content: "Sistema de producción medieval cerrado sin coordinación gerencial moderna.",
          points_multiplier: "1x"
        }
      ]
    },
    2: {
      level: 2,
      title: "Simulacro: ORIGEN Y DESARROLLO DE LA ADMINISTRACIÓN - Nivel Semi-normal",
      difficulty: "seminormal",
      nodes: [
        {
          id: "node_1",
          label: "Definición de Administración",
          question: "¿Cuál es la actividad humana indispensable para coordinar recursos humanos y productivos?",
          description: "Encargada de dirigir esfuerzos grupales hacia objetivos comunes."
        },
        {
          id: "node_2",
          label: "Postulado de Henri Fayol",
          question: "¿Qué autor clásico formuló las funciones de prever, organizar, mandar, coordinar y controlar?",
          description: "Padre de la teoría clásica y las funciones administrativas."
        },
        {
          id: "node_3",
          label: "Concepto de Reyes Ponce",
          question: "¿Quién define la administración como el conjunto sistemático de reglas para lograr la máxima eficiencia en un organismo social?",
          description: "Autor que subraya la técnica de coordinación entre cosas y personas."
        },
        {
          id: "node_4",
          label: "Ámbito de la Empresa",
          question: "¿Qué entidad social produce satisfactores para la colectividad combinando capital y trabajo?",
          description: "El escenario natural y operativo de la ciencia administrativa."
        },
        {
          id: "node_5",
          label: "Orígenes Prehispánicos",
          question: "¿En qué etapa comenzaron las tribus nómadas a organizarse para la recolección de frutas y caza?",
          description: "Primeros vestigios de organización social antes del descubrimiento de la agricultura."
        }
      ],
      cards: [
        {
          id: "card_1",
          concept_name: "Definición de Administración",
          content: "Organización y dirección del esfuerzo humano individual y colectivo hacia objetivos.",
          points_multiplier: "1x"
        },
        {
          id: "card_2",
          concept_name: "Postulado de Henri Fayol",
          content: "Enfoque funcional gerencial: previsión, organización, mando, coordinación y control.",
          points_multiplier: "1x"
        },
        {
          id: "card_3",
          concept_name: "Concepto de Reyes Ponce",
          content: "Reglas sistemáticas para lograr la máxima eficiencia en la estructura y manejo de un organismo.",
          points_multiplier: "1x"
        },
        {
          id: "card_4",
          concept_name: "Ámbito de la Empresa",
          content: "Unidad social de producción y servicio que beneficia a la colectividad.",
          points_multiplier: "1x"
        },
        {
          id: "card_5",
          concept_name: "Orígenes Prehispánicos",
          content: "Cooperación inicial del hombre primitivo para caza comunitaria y recolección.",
          points_multiplier: "1x"
        },
        // Distractores
        {
          id: "card_distractor_1",
          concept_name: "Monopolio Mercantilista",
          content: "Control exclusivo estatal de rutas comerciales del siglo XVI.",
          points_multiplier: "1x"
        },
        {
          id: "card_distractor_2",
          concept_name: "Teoría del Caos Cuántico",
          content: "Modelo físico no aplicable al proceso administrativo de Fayol.",
          points_multiplier: "1x"
        }
      ]
    },
    3: {
      level: 3,
      title: "Simulacro: ORIGEN Y DESARROLLO DE LA ADMINISTRACIÓN - Nivel Normal",
      difficulty: "normal",
      nodes: [
        {
          id: "node_1",
          label: "Concepto de Fernández Arena",
          question: "¿Qué autor define la administración como una ciencia social que satisface objetivos institucionales mediante estructura coordinada?",
          description: "Enfocado en la satisfacción de objetivos y esfuerzo humano coordinado."
        },
        {
          id: "node_2",
          label: "Koontz y O'Donnell",
          question: "¿Quiénes postulan que la administración se funda en la habilidad de conducir a los integrantes de un organismo social?",
          description: "Autores de la dirección efectiva basada en liderazgo humano."
        },
        {
          id: "node_3",
          label: "Revolución de la Agricultura",
          question: "¿Qué acontecimiento histórico permitió el paso de tribus nómadas a pequeñas comunidades organizadas?",
          description: "Marcó el inicio de asentamientos estables y división de tareas agrícolas."
        },
        {
          id: "node_4",
          label: "Organizaciones Antiguas",
          question: "¿Qué instituciones históricas mostraron esquemas formales de mando y logística antes de que existiera el término administración?",
          description: "Ejércitos griegos, legiones romanas y la Iglesia católica."
        },
        {
          id: "node_5",
          label: "El Proceso Administrativo",
          question: "¿Cómo se denomina la aplicación de etapas sucesivas para acrecentar y conservar el esfuerzo y habilidades del elemento humano?",
          description: "Mecanismo sistemático de planeación, organización, dirección y control."
        },
        {
          id: "node_6",
          label: "Eficacia del Esfuerzo Humano",
          question: "¿Por qué todos los organismos sociales priorizan el factor humano sobre los recursos materiales?",
          description: "Porque el ser humano es el único capaz de activar y coordinar los demás insumos."
        },
        {
          id: "node_7",
          label: "Compañía de Indias Orientales",
          question: "¿Qué entidad comercial histórica es citada como antecedente de las grandes corporaciones organizadas modernas?",
          description: "Empresa colonial pionera en comercio internacional formal."
        },
        {
          id: "node_8",
          label: "Desarrollo de un País",
          question: "¿A qué atribuye el autor del documento que el progreso y desarrollo de una nación dependa primordialmente?",
          description: "Cita célebre: 'El desarrollo de un país es cuestión de...'."
        }
      ],
      cards: [
        {
          id: "card_1",
          concept_name: "Concepto de Fernández Arena",
          content: "Ciencia social que persigue la satisfacción de metas por medio de una estructura humana.",
          points_multiplier: "1x"
        },
        {
          id: "card_2",
          concept_name: "Koontz y O'Donnell",
          content: "Dirección de un organismo social fundada en la destreza de guiar a sus participantes.",
          points_multiplier: "1x"
        },
        {
          id: "card_3",
          concept_name: "Revolución de la Agricultura",
          content: "Descubrimiento de cultivos que impulsó la vida sedentaria y las comunidades organizadas.",
          points_multiplier: "1x"
        },
        {
          id: "card_4",
          concept_name: "Organizaciones Antiguas",
          content: "Ejércitos greco-romanos y la iglesia como modelos tempranos de coordinación.",
          points_multiplier: "1x"
        },
        {
          id: "card_5",
          concept_name: "El Proceso Administrativo",
          content: "Acrecentamiento y conservación sistemática de talentos y conocimientos para la organización.",
          points_multiplier: "1x"
        },
        {
          id: "card_6",
          concept_name: "Eficacia del Esfuerzo Humano",
          content: "Prioridad del capital humano sobre los recursos físicos para alcanzar metas institucionales.",
          points_multiplier: "1x"
        },
        {
          id: "card_7",
          concept_name: "Compañía de Indias Orientales",
          content: "Organización mercantil transcontinental precursora de la estructura corporativa.",
          points_multiplier: "1x"
        },
        {
          id: "card_8",
          concept_name: "Desarrollo de un País",
          content: "El avance de las naciones como resultado directo de una administración eficiente y ética.",
          points_multiplier: "1x"
        },
        // Distractores
        {
          id: "card_distractor_1",
          concept_name: "Anarquía Corporativa",
          content: "Ausencia total de jerarquía y metas en entidades descentralizadas.",
          points_multiplier: "1x"
        },
        {
          id: "card_distractor_2",
          concept_name: "Aislamiento Autárquico",
          content: "Política económica cerrada que rechaza el intercambio comercial organizado.",
          points_multiplier: "1x"
        }
      ]
    },
    4: {
      level: 4,
      title: "Simulacro: ORIGEN Y DESARROLLO DE LA ADMINISTRACIÓN - Nivel Semi-difícil",
      difficulty: "semidificil",
      nodes: [
        { id: "node_1", label: "Definición Global de Administración", question: "¿Qué actividad articula y sincroniza las energías individuales para convertirlas en logro colectivo?", description: "Base teórica del artículo." },
        { id: "node_2", label: "Henri Fayol y Funciones Básicas", question: "¿Qué 5 funciones universales de la gerencia estableció la teoría clásica de Fayol?", description: "Prever, organizar, mandar, coordinar, controlar." },
        { id: "node_3", label: "Enfoque de Reyes Ponce", question: "¿Qué teoría resalta que administrar es la técnica de coordinar personas y cosas en un organismo?", description: "Reglas metodológicas de eficiencia." },
        { id: "node_4", label: "Enfoque de Fernández Arena", question: "¿Qué perspectiva enfatiza la satisfacción de metas institucionales a través de estructura social?", description: "Enfoque estructuralista." },
        { id: "node_5", label: "Koontz y O'Donnell: Conducción", question: "¿Cómo se concibe la administración cuando el énfasis recae en liderar a los colaboradores?", description: "Habilidad interpersonal directiva." },
        { id: "node_6", label: "Nómadas y Cooperación", question: "¿Cuál fue el detonante inicial de la división social del trabajo en la prehistoria?", description: "Supervivencia, caza de grandes animales y recolección." },
        { id: "node_7", label: "Sedentarismo Agrícola", question: "¿Qué fenómeno socioeconómico obligó a crear normas de almacenamiento, distribución y propiedad?", description: "Surgimiento de la agricultura." },
        { id: "node_8", label: "Ejércitos de la Antigüedad", question: "¿Por qué las legiones y ejércitos antiguos son considerados hitos administrativos tempranos?", description: "Estructura jerárquica estricta y líneas de abastecimiento." },
        { id: "node_9", label: "Iglesia Católica Romana", question: "¿Qué aporte estructural brindó la Iglesia a la administración a lo largo de los siglos?", description: "Jerarquía piramidal y delegación funcional de autoridad." },
        { id: "node_10", label: "Corporaciones Coloniales", question: "¿Qué rol jugó la Compañía de las Indias Orientales en el nacimiento de la gerencia mercantil?", description: "Pionera en sociedades por acciones y gobernanza delegada." },
        { id: "node_11", label: "La Empresa Moderna", question: "¿Cómo define el documento a la empresa respecto a las leyes y la sociedad del país?", description: "Unidad social productora sujeta al marco legal del país." },
        { id: "node_12", label: "Proceso Administrativo y RRHH", question: "¿Cuál es el fin último del proceso administrativo aplicado al talento según el texto?", description: "Acrecentar la salud, habilidad y bienestar del ser humano." },
        { id: "node_13", label: "Organismos Sociales", question: "¿Por qué Fayol recomendaba enseñar administración desde el hogar hasta niveles superiores?", description: "Todo grupo social requiere optimizar sus energías." },
        { id: "node_14", label: "Desarrollo Nacional", question: "¿Cómo influye la calidad administrativa en el destino económico y social de una nación?", description: "Sin administración eficiente, los recursos naturales se desperdician." },
        { id: "node_15", label: "Perspectiva Histórica", question: "¿Por qué es imprescindible estudiar la historia y antecedentes de la administración?", description: "Para comprender problemas actuales a la luz de experiencias previas." }
      ],
      cards: [
        { id: "card_1", concept_name: "Definición Global de Administración", content: "Coordinación y dirección sistemática del trabajo humano hacia metas prefijadas.", points_multiplier: "1x" },
        { id: "card_2", concept_name: "Henri Fayol y Funciones Básicas", content: "Previsión, organización, mando, coordinación y control gerencial.", points_multiplier: "1x" },
        { id: "card_3", concept_name: "Enfoque de Reyes Ponce", content: "Técnica de estructurar y gobernar personas y bienes con máxima eficiencia.", points_multiplier: "1x" },
        { id: "card_4", concept_name: "Enfoque de Fernández Arena", content: "Ciencia social orientada a fines institucionales mediante estructura humana.", points_multiplier: "1x" },
        { id: "card_5", concept_name: "Koontz y O'Donnell: Conducción", content: "Dirección sustentada en la pericia para guiar con efectividad a los miembros.", points_multiplier: "1x" },
        { id: "card_6", concept_name: "Nómadas y Cooperación", content: "Cooperación grupal indispensable para caza mayor y preservación biológica.", points_multiplier: "1x" },
        { id: "card_7", concept_name: "Sedentarismo Agrícola", content: "Gestión de excedentes agrícolas, asentamientos y especialización comunal.", points_multiplier: "1x" },
        { id: "card_8", concept_name: "Ejércitos de la Antigüedad", content: "Logística bélica, jerarquía de mando y distribución disciplinada de tropas.", points_multiplier: "1x" },
        { id: "card_9", concept_name: "Iglesia Católica Romana", content: "Modelo piramidal centralizado con líneas claras de autoridad territorial.", points_multiplier: "1x" },
        { id: "card_10", concept_name: "Corporaciones Coloniales", content: "Empresas comerciales pioneras en gestión accionaria y administración ultramarina.", points_multiplier: "1x" },
        { id: "card_11", concept_name: "La Empresa Moderna", content: "Unidad social de producción de satisfactores sometida a leyes vigentes.", points_multiplier: "1x" },
        { id: "card_12", concept_name: "Proceso Administrativo y RRHH", content: "Conservación y desarrollo del potencial, salud y capacidades del colaborador.", points_multiplier: "1x" },
        { id: "card_13", concept_name: "Organismos Sociales", content: "Universalidad de la administración en familias, escuelas y organizaciones.", points_multiplier: "1x" },
        { id: "card_14", concept_name: "Desarrollo Nacional", content: "Capacidad gerencial como pilar fundamental de la prosperidad de los pueblos.", points_multiplier: "1x" },
        { id: "card_15", concept_name: "Perspectiva Histórica", content: "Análisis del pasado administrativo para anticipar y resolver retos presentes.", points_multiplier: "1x" },
        // Distractores (30% = 4)
        { id: "card_distractor_1", concept_name: "Arbitraje Cambiario Automático", content: "Operativa algorítmica financiera moderna fuera del alcance del texto.", points_multiplier: "1x" },
        { id: "card_distractor_2", concept_name: "Dogma Autocrático Feudal", content: "Imposición de tributos territoriales sin planificación productiva.", points_multiplier: "1x" },
        { id: "card_distractor_3", concept_name: "Producción Artesanal Aislada", content: "Trabajo sin división de funciones ni supervisión coordinada.", points_multiplier: "1x" },
        { id: "card_distractor_4", concept_name: "Inferencia Estocástica No Paramétrica", content: "Método estadístico desvinculado de la teoría clásica.", points_multiplier: "1x" }
      ]
    },
    5: {
      level: 5,
      title: "Simulacro: ORIGEN Y DESARROLLO DE LA ADMINISTRACIÓN - Nivel Difícil (Integración Total)",
      difficulty: "dificil",
      nodes: [
        { id: "node_1", label: "Concepto Esencial de Administración", question: "¿Qué disciplina organiza y conduce los talentos individuales para alcanzar fines específicos?", description: "Definición primordial del artículo." },
        { id: "node_2", label: "Principio de Henri Fayol", question: "¿Qué 5 pilares funcionales estableció Fayol como responsabilidad indelegable de la gerencia?", description: "Previsión, organización, dirección, coordinación y control." },
        { id: "node_3", label: "Tesis de Reyes Ponce", question: "¿Qué enfoque resalta la técnica sistemática de articular personas y recursos materiales?", description: "Reglas de estructuración y manejo de organismos." },
        { id: "node_4", label: "Tesis de Fernández Arena", question: "¿Quién plantea que la administración es una ciencia social enfocada en satisfacer objetivos institucionales?", description: "Satisfacción integral mediante estructura humana." },
        { id: "node_5", label: "Tesis de Koontz y O'Donnell", question: "¿Qué autores fundamentan la administración en la destreza directiva de conducir a sus integrantes?", description: "Enfoque de relaciones y liderazgo directivo." },
        { id: "node_6", label: "Cooperación Nómada Primitiva", question: "¿Cuál fue el motivo por el cual las primeras tribus humanas debieron asociarse y organizarse?", description: "Recolección comunitaria y cacería de animales." },
        { id: "node_7", label: "Surgimiento de la Agricultura", question: "¿Qué hito dio origen a los primeros asentamientos humanos y la administración comunitaria?", description: "Descubrimiento de la agricultura y vida sedentaria." },
        { id: "node_8", label: "Logística Militar Antigua", question: "¿Qué aportaron los ejércitos griegos y romanos al desarrollo de la organización moderna?", description: "Estructuras jerárquicas, líneas de suministro y disciplina." },
        { id: "node_9", label: "Jerarquía de la Iglesia Católica", question: "¿Cómo influyó la Iglesia en los modelos organizacionales a través de los siglos?", description: "Estructura piramidal con delegación de responsabilidades." },
        { id: "node_10", label: "Compañías Transoceánicas", question: "¿Qué innovación administrativa introdujo la Compañía de las Indias Orientales?", description: "Gestión corporativa a gran escala y comercio global." },
        { id: "node_11", label: "Naturaleza Social de la Empresa", question: "¿Por qué la empresa es definida como una unidad social de producción sujeta a las leyes?", description: "Conjuga personas, capital y trabajo para el bien común." },
        { id: "node_12", label: "Conservación del Factor Humano", question: "¿Qué busca el proceso administrativo respecto a la salud, destrezas y bienestar del trabajador?", description: "Acrecentar y preservar el potencial del individuo." },
        { id: "node_13", label: "Universalidad de la Administración", question: "¿Por qué todos los organismos sociales requieren de la ciencia administrativa?", description: "Desde el hogar hasta grandes corporaciones optimizan recursos." },
        { id: "node_14", label: "Desarrollo Nacional y Gerencia", question: "¿Por qué el texto afirma que 'el desarrollo de un país es cuestión de administración'?", description: "La riqueza depende de la capacidad organizativa e institucional." },
        { id: "node_15", label: "Valor de la Perspectiva Histórica", question: "¿Para qué sirve el análisis de la historia y antecedentes de la administración?", description: "Aprender de aciertos pasados para enfrentar la realidad presente." },
        { id: "node_16", label: "El Ser Humano como Ente Social", question: "¿Qué rasgo innato del ser humano explica su tendencia natural a asociarse en grupos?", description: "Naturaleza sociable y necesidad de ayuda mutua." },
        { id: "node_17", label: "Responsabilidad del Crecimiento Económico", question: "¿Qué institución moderna es la encargada directa de hacer que los recursos sean productivos?", description: "La administración como motor económico indispensable." },
        { id: "node_18", label: "Aparición de la Administración Formal", question: "¿Cuándo y con qué rapidez surgió la administración como profesión indispensable?", description: "Crecimiento acelerado desde inicios del siglo XX." },
        { id: "node_19", label: "Satisfactores Colectivos", question: "¿Cuál es el fin último de la producción de bienes y servicios por parte de las empresas?", description: "Satisfacer las necesidades de la comunidad circundante." },
        { id: "node_20", label: "Eficacia Institucional", question: "¿Cómo logran las instituciones maximizar el rendimiento del esfuerzo colectivo?", description: "Coordinación armónica y evaluación periódica de resultados." }
      ],
      cards: [
        { id: "card_1", concept_name: "Concepto Esencial de Administración", content: "Organización y gobierno del esfuerzo humano hacia fines institucionales.", points_multiplier: "1x" },
        { id: "card_2", concept_name: "Principio de Henri Fayol", content: "Previsión, organización, mando, coordinación y control directivo.", points_multiplier: "1x" },
        { id: "card_3", concept_name: "Tesis de Reyes Ponce", content: "Técnica de coordinar personas y cosas para alcanzar máxima eficiencia.", points_multiplier: "1x" },
        { id: "card_4", concept_name: "Tesis de Fernández Arena", content: "Ciencia social que satisface objetivos mediante una estructura coordinada.", points_multiplier: "1x" },
        { id: "card_5", concept_name: "Tesis de Koontz y O'Donnell", content: "Dirección fundada en la pericia para guiar con éxito a los colaboradores.", points_multiplier: "1x" },
        { id: "card_6", concept_name: "Cooperación Nómada Primitiva", content: "Unión gregaria para la supervivencia, recolección y caza mayor.", points_multiplier: "1x" },
        { id: "card_7", concept_name: "Surgimiento de la Agricultura", content: "Transformación sedentaria y división inicial del trabajo comunitario.", points_multiplier: "1x" },
        { id: "card_8", concept_name: "Logística Militar Antigua", content: "Cadena de mando jerárquica y abastecimiento sistemático de tropas.", points_multiplier: "1x" },
        { id: "card_9", concept_name: "Jerarquía de la Iglesia Católica", content: "Estructura organizativa piramidal y administración eclesiástica formal.", points_multiplier: "1x" },
        { id: "card_10", concept_name: "Compañías Transoceánicas", content: "Corporaciones pioneras en emisión de acciones y gestión delegada.", points_multiplier: "1x" },
        { id: "card_11", concept_name: "Naturaleza Social de la Empresa", content: "Célula productiva de bienes y servicios sujeta al orden jurídico nacional.", points_multiplier: "1x" },
        { id: "card_12", concept_name: "Conservación del Factor Humano", content: "Preservación integral de conocimientos, salud y habilidades de la persona.", points_multiplier: "1x" },
        { id: "card_13", concept_name: "Universalidad de la Administración", content: "Aplicación indispensable en toda actividad humana individual o colectiva.", points_multiplier: "1x" },
        { id: "card_14", concept_name: "Desarrollo Nacional y Gerencia", content: "El progreso social y económico como fruto de una dirección competente.", points_multiplier: "1x" },
        { id: "card_15", concept_name: "Valor de la Perspectiva Histórica", content: "Comprensión del devenir histórico para resolver dilemas administrativos.", points_multiplier: "1x" },
        { id: "card_16", concept_name: "El Ser Humano como Ente Social", content: "Tendencia biológica y cultural a cooperar con sus semejantes.", points_multiplier: "1x" },
        { id: "card_17", concept_name: "Responsabilidad del Crecimiento Económico", content: "Transformación eficiente de recursos escasos en bienes productivos.", points_multiplier: "1x" },
        { id: "card_18", concept_name: "Aparición de la Administración Formal", content: "Institución moderna nacida con celeridad histórica en el siglo XX.", points_multiplier: "1x" },
        { id: "card_19", concept_name: "Satisfactores Colectivos", content: "Bienes y servicios creados para elevar la calidad de vida de la sociedad.", points_multiplier: "1x" },
        { id: "card_20", concept_name: "Eficacia Institucional", content: "Logro cabal de las metas organizacionales mediante sinergia grupal.", points_multiplier: "1x" },
        // Distractores (30% = 6)
        { id: "card_distractor_1", concept_name: "Modelo Feudal de Servidumbre", content: "Relación de vasallaje medieval sin planificación gerencial.", points_multiplier: "1x" },
        { id: "card_distractor_2", concept_name: "Especulación Financiera Sintética", content: "Derivados financieros ajenos al concepto clásico de Fayol.", points_multiplier: "1x" },
        { id: "card_distractor_3", concept_name: "Descoordinación Atomizada", content: "Dispersión improductiva de recursos sin dirección de objetivos.", points_multiplier: "1x" },
        { id: "card_distractor_4", concept_name: "Autosuficiencia Agrícola Primitiva", content: "Economía de subsistencia individual sin división técnica del trabajo.", points_multiplier: "1x" },
        { id: "card_distractor_5", concept_name: "Axioma de Descarte Arbitrario", content: "Premisa metodológica no contrastada científicamente.", points_multiplier: "1x" },
        { id: "card_distractor_6", concept_name: "Burocracia Inoperante Centralizada", content: "Trámites excesivos que ralentizan la eficacia institucional.", points_multiplier: "1x" }
      ]
    }
  }
};
