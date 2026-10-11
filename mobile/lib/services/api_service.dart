import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/game_models.dart';

class ApiService {
  // Obtener lista de carpetas del usuario desde MongoDB
  static Future<List<StudyFolder>> fetchFolders({String? userId}) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/api/v1/folders${userId != null ? '?user_id=$userId' : ''}');
      final res = await http.get(uri).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        final list = (data['folders'] as List<dynamic>? ?? []);
        return list.map((f) => StudyFolder.fromJson(f)).toList();
      }
    } catch (e) {
      debugPrint("Error obteniendo carpetas: $e");
    }
    return [
      StudyFolder(
        id: "folder_administracion_default",
        name: "Administración General",
        description: "Origen y Desarrollo de la Administración (Perspectivas - UCB San Pablo)",
      )
    ];
  }

  // Generar Tablero oficial de juego por Carpeta y Nivel (1 a 5)
  static Future<Map<String, dynamic>> generateBoardForFolder({
    required String folderId,
    required int level,
    required int questionCount,
    required String difficulty,
    bool force = false,
  }) async {
    try {
      final uri = Uri.parse(
        '${ApiConfig.baseUrl}/api/v1/folders/$folderId/generate-game?level=$level&question_count=$questionCount&difficulty=$difficulty${force ? '&force=true' : ''}',
      );
      final res = await http.post(uri).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data != null && data['nodes'] != null && (data['nodes'] as List).isNotEmpty) {
          debugPrint("Tablero generado exitosamente desde el Backend para nivel $level!");
          return data;
        }
      }
    } catch (e) {
      debugPrint("Aviso: backend ocupado o sin respuesta rápida, usando datos enriquecidos de administracion.pdf: $e");
    }

    // Fallback estático idéntico a staticAdminGame.js
    return _getStaticAdminBoard(level);

  }

  // Consulta interactiva al asistente de voz Capi (Groq/Gemini)
  static Future<String> askCapybara({
    required String message,
    required List<ArcadeNode> nodes,
    required List<ArcadeCard> hand,
    required String theme,
  }) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/api/v1/arena/capy-ask');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'message': message,
          'nodes': nodes.map((n) => {'id': n.id, 'label': n.label, 'placed': n.placedCard != null}).toList(),
          'hand': hand.map((c) => {'id': c.id, 'concept': c.conceptName}).toList(),
          'theme': theme,
        }),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        return data['reply'] ?? data['speech'] ?? "¡Muy bien! Respira profundo y analiza las relaciones clave.";
      }
    } catch (e) {
      debugPrint("Error consultando a Capi en backend: $e");
    }

    if (message.contains("error") || message.contains("wrong")) {
      return "El error solo es retroalimentación para tu cerebro. Respira con calma y busca la función principal.";
    }
    return "¡Excelente conexión neuronal! Cada acierto consolida tu aprendizaje.";
  }

  // Banco estático fiel a administracion.pdf (extraído de frontend/src/utils/staticAdminGame.js)
  static Map<String, dynamic> _getStaticAdminBoard(int level) {
    if (level == 1) {
      return {
        "title": "ORIGEN Y DESARROLLO DE LA ADMINISTRACIÓN - Nivel Fácil",
        "nodes": [
          {
            "id": "node_1",
            "label": "Definición de Administración",
            "question": "¿Qué actividad humana organiza y dirige el trabajo individual y colectivo para alcanzar objetivos?",
            "description": "Revisa la actividad encargada de hacer productivos los recursos.",
            "correct_card_id": "card_1"
          },
          {
            "id": "node_2",
            "label": "Concepto de Henri Fayol",
            "question": "¿Quién definió la administración como el acto de prever, organizar, dirigir, coordinar y controlar a través de la gerencia?",
            "description": "Es uno de los pioneros clásicos de la administración citado en el documento.",
            "correct_card_id": "card_2"
          },
          {
            "id": "node_3",
            "label": "Ámbito de Acción",
            "question": "¿Cuál es la unidad social de producción o servicio que constituye el ámbito de acción principal de la administración?",
            "description": "Entendida como la unidad social constituida por personas, bienes y conocimientos técnicos.",
            "correct_card_id": "card_3"
          }
        ],
        "cards": [
          {
            "id": "card_1",
            "concept_name": "Definición de Administración",
            "content": "Actividad humana encargada de organizar y dirigir el trabajo individual y colectivo efectivo en términos de objetivos.",
            "points_multiplier": "1x",
            "is_distractor": false
          },
          {
            "id": "card_2",
            "concept_name": "Concepto de Henri Fayol",
            "content": "Administrar es prever, organizar, dirigir, coordinar y controlar a través de la gerencia institucional.",
            "points_multiplier": "1x",
            "is_distractor": false
          },
          {
            "id": "card_3",
            "concept_name": "Ámbito de Acción",
            "content": "La Empresa, unidad social de producción o servicio conformada por personas que aportan bienes y trabajo.",
            "points_multiplier": "1x",
            "is_distractor": false
          },
          {
            "id": "card_distractor_1",
            "concept_name": "Economía de Escala Feudal",
            "content": "Sistema de producción medieval cerrado sin coordinación gerencial moderna.",
            "points_multiplier": "1x",
            "is_distractor": true
          }
        ]
      };
    } else {
      // Niveles 2 a 5
      return {
        "title": "ORIGEN Y DESARROLLO DE LA ADMINISTRACIÓN - Nivel $level",
        "nodes": [
          {
            "id": "node_1",
            "label": "División del Trabajo",
            "question": "¿Qué principio postula la especialización de las tareas para incrementar la eficiencia productiva?",
            "description": "Principio clásico expuesto por Adam Smith y aplicado en la administración científica.",
            "correct_card_id": "card_1"
          },
          {
            "id": "node_2",
            "label": "Teoría Burocrática",
            "question": "¿Qué modelo estructural propuso Max Weber basado en jerarquías, normas explícitas y racionalidad?",
            "description": "Estructura formal que busca la máxima precisión y previsibilidad organizacional.",
            "correct_card_id": "card_2"
          },
          {
            "id": "node_3",
            "label": "Escuela de Relaciones Humanas",
            "question": "¿Qué corriente liderada por Elton Mayo demostró la influencia de la motivación y el clima social en el trabajo?",
            "description": "Estudios realizados en los experimentos de la planta de Hawthorne.",
            "correct_card_id": "card_3"
          },
          {
            "id": "node_4",
            "label": "Enfoque Sistémico",
            "question": "¿Qué perspectiva concibe a la organización como un sistema abierto en constante intercambio con su entorno?",
            "description": "Enfoque integrador que une insumos, procesos y salidas organizacionales.",
            "correct_card_id": "card_4"
          }
        ],
        "cards": [
          {
            "id": "card_1",
            "concept_name": "División del Trabajo",
            "content": "Especialización de funciones y tareas para optimizar tiempos y destrezas operativas.",
            "points_multiplier": "1x",
            "is_distractor": false
          },
          {
            "id": "card_2",
            "concept_name": "Teoría Burocrática",
            "content": "Modelo racional-legal con jerarquía formal, procedimientos estandarizados y división de autoridad.",
            "points_multiplier": "1x",
            "is_distractor": false
          },
          {
            "id": "card_3",
            "concept_name": "Escuela de Relaciones Humanas",
            "content": "Énfasis en los factores psicológicos, grupos informales y liderazgo participativo.",
            "points_multiplier": "1x",
            "is_distractor": false
          },
          {
            "id": "card_4",
            "concept_name": "Enfoque Sistémico",
            "content": "Interdependencia de subsistemas organizacionales interactuando dinámicamente con el medio ambiente.",
            "points_multiplier": "1x",
            "is_distractor": false
          },
          {
            "id": "card_distractor_2",
            "concept_name": "Autocracia Monárquica",
            "content": "Centralización absoluta del poder sin bases técnico-administrativas ni retroalimentación.",
            "points_multiplier": "1x",
            "is_distractor": true
          }
        ]
      };
    }
  }
}
