"""
Documentos de muestra curados de Hubzy.

Permiten que un usuario nuevo pruebe la generación de tableros SIN tener un
PDF propio a la mano — el mayor punto de fricción del onboarding. Cada texto
está escrito para que el clasificador de dominio lo detecte inequívocamente y
el motor procedural correspondiente produzca problemas resolubles.
"""

SAMPLE_DOCUMENTS = {
    "matematicas_fracciones": {
        "name": "Fracciones y Álgebra Básica.txt",
        "domain": "matematica",
        "description": "Operaciones con fracciones, ecuaciones de primer grado y porcentajes.",
        "extracted_text": """Fracciones y operaciones fundamentales

Una fracción representa una parte de un todo. El numerador indica cuántas partes se toman y el denominador en cuántas partes iguales se divide la unidad. Para sumar fracciones con distinto denominador se busca el mínimo común múltiplo: 1/2 + 1/3 = 3/6 + 2/6 = 5/6. Un error muy común es sumar numeradores y denominadores directamente, obteniendo 2/5, lo cual es incorrecto.

Para multiplicar fracciones se multiplican los numeradores entre sí y los denominadores entre sí: 2/3 × 4/5 = 8/15. Para dividir, se multiplica por el recíproco: 1/2 ÷ 1/4 = 1/2 × 4/1 = 2.

Ecuaciones de primer grado

Una ecuación es una igualdad con una incógnita. Resolver 2x + 6 = 14 significa despejar x: restamos 6 en ambos lados (2x = 8) y dividimos entre 2, obteniendo x = 4. La regla fundamental es que lo que se hace a un lado de la igualdad debe hacerse también al otro.

Porcentajes

Un porcentaje es una fracción de denominador 100. El 25% de 80 es 80 × 25/100 = 20. Para calcular aumentos se suma el porcentaje al total; para descuentos se resta.""",
    },
    "fisica_mecanica": {
        "name": "Magnitudes y Movimiento.txt",
        "domain": "fisica",
        "description": "Magnitudes del SI, velocidad, fuerza y energía con sus unidades.",
        "extracted_text": """Magnitudes físicas y el Sistema Internacional

La física estudia magnitudes medibles. Las magnitudes fundamentales del SI son: masa (kg), longitud (m), tiempo (s), corriente eléctrica (A), temperatura (K), cantidad de sustancia (mol) e intensidad luminosa (cd). De ellas se derivan el resto.

La velocidad es distancia recorrida entre tiempo transcurrido: v = d/t, y se mide en m/s. Para convertir de km/h a m/s se divide entre 3.6: 72 km/h = 20 m/s. La aceleración es el cambio de velocidad en el tiempo: a = Δv/Δt, en m/s².

Fuerza y leyes de Newton

La segunda ley de Newton establece que F = m·a, donde la fuerza se mide en newtons (N). Una masa de 5 kg acelerada a 2 m/s² experimenta una fuerza de 10 N. El peso es la fuerza con que la gravedad atrae un cuerpo: W = m·g, con g ≈ 9.8 m/s².

Energía

La energía cinética es Ec = ½mv² en joules (J). La energía potencial gravitatoria es Ep = m·g·h. El trabajo mecánico es W = F·d, también en joules.""",
    },
    "historia_bolivia": {
        "name": "Historia de Bolivia.txt",
        "domain": "historia",
        "description": "Independencia, república y transformaciones del siglo XX.",
        "extracted_text": """Historia de Bolivia: de la colonia a la república

El Alto Perú fue parte del Virreinato del Río de la Plata desde 1776. La guerra de independencia comenzó con los pronunciamientos de 1809 en Sucre y La Paz, considerados los primeros gritos libertarios de Sudamérica. Tras quince años de lucha, Simón Bolívar y Antonio José de Sucre consolidaron la independencia con la victoria de Ayacucho en 1824.

El 6 de agosto de 1825 se proclamó la República de Bolívar, que luego tomó el nombre de Bolivia. Sucre fue su primer presidente. Durante el siglo XIX el país perdió extensos territorios: la costa del Pacífico en la Guerra del Pacífico (1879-1884) frente a Chile, conflicto que dejó a Bolivia sin salida al mar.

El siglo XX trajo la Revolución Nacional de 1952, liderada por el MNR, que estableció el voto universal, la reforma agraria y la nacionalización de las minas de estaño. El Chaco (1932-1935) frente a Paraguay había devastado al país antes de estas transformaciones.""",
    },
    "programacion_python": {
        "name": "Fundamentos de Python.txt",
        "domain": "programacion",
        "description": "Variables, estructuras de datos, control de flujo y funciones.",
        "extracted_text": """Fundamentos de programación en Python

Python es un lenguaje interpretado de tipado dinámico. Las variables no se declaran con tipo: x = 5 crea un entero, nombre = "Ana" una cadena. Las estructuras de datos básicas son listas (mutables, [1, 2, 3]), tuplas (inmutables, (1, 2)), diccionarios (pares clave-valor, {"edad": 20}) y conjuntos (elementos únicos).

Control de flujo

El condicional if/elif/else ejecuta bloques según condiciones booleanas. El bucle for itera sobre secuencias: for i in range(5) produce 0 a 4. El bucle while repite mientras la condición sea verdadera. break sale del bucle y continue salta a la siguiente iteración.

Funciones

Una función se define con def: def suma(a, b): return a + b. Puede tener parámetros por defecto y devolver múltiples valores como tupla. Las funciones son ciudadanos de primera clase: pueden asignarse a variables y pasarse como argumentos.

Errores comunes

Confundir = (asignación) con == (comparación), olvidar que los índices empiezan en 0, y modificar una lista mientras se itera sobre ella son los errores más frecuentes de principiantes.""",
    },
}


def get_sample(sample_id: str) -> dict | None:
    """Devuelve una copia del documento de muestra o None."""
    doc = SAMPLE_DOCUMENTS.get(sample_id)
    return dict(doc) if doc else None


def list_samples() -> list[dict]:
    """Metadatos públicos de las muestras (sin el texto completo)."""
    return [
        {
            "id": sid,
            "name": d["name"],
            "domain": d["domain"],
            "description": d["description"],
        }
        for sid, d in SAMPLE_DOCUMENTS.items()
    ]
