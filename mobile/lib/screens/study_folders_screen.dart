import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/game_models.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import 'arcade_arena_screen.dart';

class StudyFoldersScreen extends StatefulWidget {
  final UserProfile user;
  const StudyFoldersScreen({super.key, required this.user});

  @override
  State<StudyFoldersScreen> createState() => _StudyFoldersScreenState();
}

class _StudyFoldersScreenState extends State<StudyFoldersScreen> {
  List<StudyFolder> _folders = [];
  bool _isLoading = true;
  StudyFolder? _openedFolder;

  @override
  void initState() {
    super.initState();
    _loadFolders();
  }

  Future<void> _loadFolders() async {
    setState(() => _isLoading = true);
    final list = await ApiService.fetchFolders(userId: widget.user.id);
    setState(() {
      _folders = list;
      _isLoading = false;
    });
  }

  void _showCreateFolderDialog() {
    final nameCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFF38BDF8), width: 2),
        ),
        title: Text(
          "NUEVA CARPETA DE ESTUDIO",
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
        ),
        content: TextField(
          controller: nameCtrl,
          style: GoogleFonts.outfit(color: Colors.white),
          decoration: InputDecoration(
            hintText: "Ej. Biología Celular, Derecho...",
            hintStyle: GoogleFonts.outfit(color: Colors.white38),
            filled: true,
            fillColor: const Color(0xFF030712),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text("CANCELAR", style: GoogleFonts.outfit(color: Colors.white60)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B)),
            onPressed: () {
              if (nameCtrl.text.trim().isNotEmpty) {
                final newF = StudyFolder(
                  id: "folder_${DateTime.now().millisecondsSinceEpoch}",
                  name: nameCtrl.text.trim(),
                  description: "Carpeta personalizada",
                );
                setState(() => _folders.insert(0, newF));
                Navigator.pop(ctx);
              }
            },
            child: Text("CREAR", style: GoogleFonts.outfit(color: Colors.black, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF030712),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        title: Row(
          children: [
            const CircleAvatar(
              backgroundColor: Color(0xFF0284C7),
              radius: 16,
              child: Icon(Icons.person, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            Text(
              widget.user.username,
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _loadFolders,
          ),
        ],
      ),
      body: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 520),
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A).withValues(alpha: 0.95),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFF38BDF8).withValues(alpha: 0.3), width: 1.5),
            boxShadow: const [
              BoxShadow(color: Colors.black45, blurRadius: 30, offset: Offset(0, 10)),
            ],
          ),
          child: _openedFolder == null ? _buildFolderListView() : _buildFolderDetailView(_openedFolder!),
        ),
      ),
    );
  }

  Widget _buildFolderListView() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Cabecera: Mis carpetas + Botón Nueva Carpeta
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Mis Carpetas de Estudio",
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  "Documentos y reactivos privados de ${widget.user.username}",
                  style: GoogleFonts.outfit(color: Colors.white54, fontSize: 12),
                ),
              ],
            ),
            ElevatedButton.icon(
              onPressed: _showCreateFolderDialog,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF59E0B),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: const Icon(Icons.add, size: 18),
              label: Text("NUEVA CARPETA", style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12)),
            ),
          ],
        ),

        const SizedBox(height: 18),

        if (_isLoading)
          const Center(child: Padding(padding: EdgeInsets.all(30), child: CircularProgressIndicator(color: Color(0xFF38BDF8))))
        else
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: _folders.length,
              itemBuilder: (context, idx) {
                final folder = _folders[idx];
                return GestureDetector(
                  onTap: () => setState(() => _openedFolder = folder),
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B).withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFF38BDF8).withValues(alpha: 0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.folder, color: Color(0xFFF59E0B), size: 28),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                folder.name.toUpperCase(),
                                style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                "Listo para jugar",
                                style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          folder.description,
                          style: GoogleFonts.outfit(color: Colors.white60, fontSize: 12.5),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.description, color: Colors.white54, size: 16),
                                const SizedBox(width: 6),
                                Text("1 archivo (administracion.pdf)", style: GoogleFonts.outfit(color: Colors.white70, fontSize: 12)),
                              ],
                            ),
                            Text(
                              "Entrar >",
                              style: GoogleFonts.outfit(color: const Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildFolderDetailView(StudyFolder folder) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Botón volver a carpetas + Título
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => setState(() => _openedFolder = null),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      "CARPETA ABIERTA",
                      style: GoogleFonts.outfit(color: const Color(0xFFF59E0B), fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                  Text(
                    folder.name,
                    style: GoogleFonts.outfit(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 20),

        Text(
          "ARCHIVOS LISTOS PARA EL JUEGO",
          style: GoogleFonts.outfit(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold),
        ),

        const SizedBox(height: 10),

        // Tarjeta de administracion.pdf
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF38BDF8).withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.picture_as_pdf, color: Color(0xFFEF4444), size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("administracion.pdf", style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                    Text("105 KB • Integrado y Analizado", style: GoogleFonts.outfit(color: Colors.white54, fontSize: 12)),
                  ],
                ),
              ),
              const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 20),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Botón Iniciar Juego Directamente
        ElevatedButton.icon(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => ArcadeArenaScreen(folder: folder)),
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF10B981),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 8,
          ),
          icon: const Icon(Icons.sports_esports, size: 22),
          label: Text(
            "INICIAR JUEGO DIRECTAMENTE",
            style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 0.8),
          ),
        ),
      ],
    );
  }
}
