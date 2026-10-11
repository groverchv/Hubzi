import 'package:flutter/foundation.dart';

class ApiConfig {
  // En Web localhost:8000, en Emulador Android 10.0.2.2:8000
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:8000';
    return 'http://10.0.2.2:8000';
  }

  
  // Endpoint de test de salud
  static String get healthEndpoint => '$baseUrl/api/v1/health';
  
  // Endpoint para generar desafíos con IA (Groq / Gemini)
  static String get generateQuizEndpoint => '$baseUrl/api/v1/ai/generate-quiz';
  
  // Endpoint de apoyo psicológico Capi
  static String get companionSpeechEndpoint => '$baseUrl/api/v1/ai/companion-speech';
}
