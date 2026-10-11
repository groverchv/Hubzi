class ArcadeCard {
  final String id;
  final String conceptName;
  final String content;
  final String pointsMultiplier;
  final bool isDistractor;
  final String? matchesNodeId;

  ArcadeCard({
    required this.id,
    required this.conceptName,
    required this.content,
    this.pointsMultiplier = "1x",
    this.isDistractor = false,
    this.matchesNodeId,
  });

  factory ArcadeCard.fromJson(Map<String, dynamic> json) {
    return ArcadeCard(
      id: json['id']?.toString() ?? '',
      conceptName: json['concept_name'] ?? json['name'] ?? json['concept'] ?? '',
      content: json['content'] ?? json['definition'] ?? '',
      pointsMultiplier: json['points_multiplier'] ?? '1x',
      isDistractor: json['isDistractor'] ?? json['is_distractor'] ?? (json['id']?.toString().contains('distractor') ?? false),
      matchesNodeId: json['matchesNodeId'] ?? json['matches_node_id'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'concept_name': conceptName,
    'content': content,
    'points_multiplier': pointsMultiplier,
    'is_distractor': isDistractor,
  };
}

class ArcadeNode {
  final String id;
  final String label;
  final String question;
  final String hint;
  final String correctCardId;
  ArcadeCard? placedCard;

  ArcadeNode({
    required this.id,
    required this.label,
    required this.question,
    required this.hint,
    required this.correctCardId,
    this.placedCard,
  });

  factory ArcadeNode.fromJson(Map<String, dynamic> json) {
    return ArcadeNode(
      id: json['id']?.toString() ?? '',
      label: json['label'] ?? json['name'] ?? 'Concepto',
      question: json['question'] ?? '¿Cuál es la función o definición principal de este concepto?',
      hint: json['description'] ?? json['hint'] ?? '',
      correctCardId: json['correct_card_id'] ?? json['correctCardId'] ?? '',
    );
  }
}

class StudyFolder {
  final String id;
  final String name;
  final String description;
  final String icon;
  final String color;
  final List<dynamic> documents;

  StudyFolder({
    required this.id,
    required this.name,
    required this.description,
    this.icon = 'folder',
    this.color = 'emerald',
    this.documents = const [],
  });

  factory StudyFolder.fromJson(Map<String, dynamic> json) {
    return StudyFolder(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? 'Carpeta de Estudio',
      description: json['description'] ?? '',
      icon: json['icon'] ?? 'folder',
      color: json['color'] ?? 'emerald',
      documents: json['documents'] ?? [],
    );
  }
}

class GameLevelInfo {
  final int level;
  final String name;
  final int questions;
  final String difficulty;
  final String desc;

  const GameLevelInfo({
    required this.level,
    required this.name,
    required this.questions,
    required this.difficulty,
    required this.desc,
  });
}

const List<GameLevelInfo> kGameLevels = [
  GameLevelInfo(level: 1, name: 'Fácil', questions: 3, difficulty: 'facil', desc: 'Preguntas directas y evidentes'),
  GameLevelInfo(level: 2, name: 'Semi-normal', questions: 5, difficulty: 'seminormal', desc: 'Conceptos clave fundamentales'),
  GameLevelInfo(level: 3, name: 'Normal', questions: 8, difficulty: 'normal', desc: 'Análisis y relaciones estándar'),
  GameLevelInfo(level: 4, name: 'Semi-difícil', questions: 15, difficulty: 'semidificil', desc: 'Profundidad técnica e inferencias'),
  GameLevelInfo(level: 5, name: 'Difícil', questions: 20, difficulty: 'dificil', desc: 'Integración exhaustiva del texto'),
];
