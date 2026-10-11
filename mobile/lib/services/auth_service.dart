import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class UserProfile {
  final String id;
  final String email;
  final String username;
  final String gender;
  final int age;
  final String assignedVoiceGender;

  UserProfile({
    required this.id,
    required this.email,
    required this.username,
    required this.gender,
    required this.age,
    required this.assignedVoiceGender,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] ?? json['_id'] ?? 'guest_id',
      email: json['email'] ?? 'invitado@hubzy.app',
      username: json['username'] ?? 'Invitado',
      gender: json['gender'] ?? 'masculino',
      age: json['age'] ?? 20,
      assignedVoiceGender: json['assigned_voice_gender'] ?? 'female',
    );
  }
}

class AuthService {
  static UserProfile? currentUser;

  static UserProfile createGuestUser() {
    currentUser = UserProfile(
      id: 'guest_user_${DateTime.now().millisecondsSinceEpoch}',
      email: 'invitado@hubzy.app',
      username: 'Invitado',
      gender: 'masculino',
      age: 20,
      assignedVoiceGender: 'female',
    );
    return currentUser!;
  }

  static Future<UserProfile?> login({
    required String email,
    required String password,
  }) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/api/v1/auth/login');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email.trim().toLowerCase(),
          'password': password,
        }),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        currentUser = UserProfile.fromJson(data['user']);
        return currentUser;
      }
    } catch (e) {
      debugPrint("Error login auth: $e");
    }
    // Si no hay red, permitir continuar como invitado/offline
    return null;
  }

  static Future<UserProfile?> register({
    required String email,
    required String password,
    required String username,
    required String gender,
    required int age,
  }) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/api/v1/auth/register');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email.trim().toLowerCase(),
          'password': password,
          'username': username.trim(),
          'gender': gender,
          'age': age,
        }),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        currentUser = UserProfile.fromJson(data['user']);
        return currentUser;
      }
    } catch (e) {
      debugPrint("Error register auth: $e");
    }
    return null;
  }
}
