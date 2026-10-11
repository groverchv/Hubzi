import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/auth_service.dart';
import 'study_folders_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isRegisterMode = false;
  final _emailCtrl = TextEditingController(text: "demo@hubzy.app");
  final _pwdCtrl = TextEditingController(text: "123456");
  final _nameCtrl = TextEditingController(text: "Alex");
  String _gender = "Hombre";
  double _age = 20;
  bool _isLoading = false;
  String? _errorMsg;

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });

    final user = await AuthService.login(
      email: _emailCtrl.text,
      password: _pwdCtrl.text,
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    final activeUser = user ?? AuthService.createGuestUser();
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => StudyFoldersScreen(user: activeUser)),
    );
  }

  Future<void> _handleRegister() async {
    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });

    final user = await AuthService.register(
      email: _emailCtrl.text,
      password: _pwdCtrl.text,
      username: _nameCtrl.text,
      gender: _gender.toLowerCase(),
      age: _age.toInt(),
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    final activeUser = user ?? AuthService.createGuestUser();
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => StudyFoldersScreen(user: activeUser)),
    );
  }

  void _handleGuest() {
    final guest = AuthService.createGuestUser();
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => StudyFoldersScreen(user: guest)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF030712),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 30),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 440),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A).withValues(alpha: 0.95),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: const Color(0xFF38BDF8).withValues(alpha: 0.4), width: 2),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0284C7).withValues(alpha: 0.25),
                  blurRadius: 40,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Cabecera: Avatar Capi + Título
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Color(0xFF0284C7),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.psychology, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "PORTAL DE ACCESO",
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF38BDF8),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                          ),
                        ),
                        Text(
                          _isRegisterMode ? "Crear Cuenta" : "Iniciar Sesión",
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Selector de Modo (Ingresar / Registrarme)
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF030712),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _isRegisterMode = false),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: !_isRegisterMode ? const Color(0xFF0284C7) : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Center(
                              child: Text(
                                "INGRESAR",
                                style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _isRegisterMode = true),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: _isRegisterMode ? const Color(0xFF6366F1) : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Center(
                              child: Text(
                                "REGISTRARME",
                                style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                if (_isRegisterMode) ...[
                  _buildInputLabel("NOMBRE O APODO"),
                  _buildTextField(_nameCtrl, "Ej. Alex, Mateo...", Icons.person),
                  const SizedBox(height: 14),
                ],

                _buildInputLabel("CORREO ELECTRÓNICO"),
                _buildTextField(_emailCtrl, "tu.correo@ejemplo.com", Icons.email),
                const SizedBox(height: 14),

                _buildInputLabel("CONTRASEÑA"),
                _buildTextField(_pwdCtrl, "••••••••", Icons.lock, isPassword: true),
                const SizedBox(height: 14),

                if (_isRegisterMode) ...[
                  _buildInputLabel("GÉNERO (CALIBRA VOZ DE CAPI)"),
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          label: Text("Hombre", style: GoogleFonts.outfit(color: Colors.white)),
                          selected: _gender == "Hombre",
                          selectedColor: const Color(0xFF0284C7),
                          backgroundColor: const Color(0xFF1E293B),
                          onSelected: (val) => setState(() => _gender = "Hombre"),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ChoiceChip(
                          label: Text("Mujer", style: GoogleFonts.outfit(color: Colors.white)),
                          selected: _gender == "Mujer",
                          selectedColor: const Color(0xFFEC4899),
                          backgroundColor: const Color(0xFF1E293B),
                          onSelected: (val) => setState(() => _gender = "Mujer"),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  _buildInputLabel("EDAD: ${_age.toInt()} AÑOS"),
                  Slider(
                    value: _age,
                    min: 10,
                    max: 60,
                    divisions: 50,
                    activeColor: const Color(0xFF38BDF8),
                    onChanged: (val) => setState(() => _age = val),
                  ),
                  const SizedBox(height: 14),
                ],

                if (_errorMsg != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      _errorMsg!,
                      style: GoogleFonts.outfit(color: const Color(0xFFF43F5E), fontSize: 13),
                    ),
                  ),

                // Botón Primario
                ElevatedButton(
                  onPressed: _isLoading ? null : (_isRegisterMode ? _handleRegister : _handleLogin),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isRegisterMode ? const Color(0xFF6366F1) : const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(
                          _isRegisterMode ? "CREAR CUENTA Y COMENZAR" : "INICIAR SESIÓN EN HUBZY",
                          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                ),

                const SizedBox(height: 12),

                // Ingresar directo como invitado
                OutlinedButton.icon(
                  onPressed: _handleGuest,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF38BDF8),
                    side: const BorderSide(color: Color(0xFF38BDF8)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  icon: const Icon(Icons.auto_awesome, size: 18),

                  label: Text("Ingresar Directo (Sin Registro / Invitado)", style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
                ),

                const SizedBox(height: 14),
                Text(
                  "🔒 Tus documentos y carpetas son 100% privados e independientes.",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(color: Colors.white38, fontSize: 11),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInputLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: GoogleFonts.outfit(
          color: const Color(0xFF94A3B8),
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController ctrl, String hint, IconData icon, {bool isPassword = false}) {
    return TextField(
      controller: ctrl,
      obscureText: isPassword,
      style: GoogleFonts.outfit(color: Colors.white),
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: const Color(0xFF38BDF8), size: 18),
        hintText: hint,
        hintStyle: GoogleFonts.outfit(color: Colors.white38),
        filled: true,
        fillColor: const Color(0xFF030712),
        contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }
}
