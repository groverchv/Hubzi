/**
 * Sound FX & Emotion Audio Engine para la Capibara y Eventos de la Arena.
 * Utiliza Web Audio API nativo (soporte universal sin dependencias externas, cero latencia).
 */

class CapyAudioEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Sonido emocional de Capibara llorando de verdad (Whimpering & Crying Squeaks / Sollozo)
   * Simula gemidos vocales suaves que caen en tono, vibrato de llanto y sollozos agudos.
   */
  playCapyCry() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Primer Sollozo / Gémido agudo triste (Sobbing Squeak 1)
    this._createSob(now + 0.05, 580, 320, 0.45, 0.28);

    // 2. Segundo Sollozo más intenso con vibrato de lágrima (Sobbing Squeak 2)
    this._createSob(now + 0.55, 680, 260, 0.65, 0.35, true);

    // 3. Suspiro quebrado de tristeza (Sniffle / Whimper)
    this._createSniffle(now + 1.25, 0.4);

    // 4. Tercer Sollozo resignado y suave que se desvanece
    this._createSob(now + 1.70, 520, 220, 0.55, 0.22);
  }

  /**
   * Genera un sollozo individual con formante vocal orgánico
   */
  _createSob(startTime, startFreq, endFreq, duration, volume = 0.3, withVibrato = false) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Forma de onda cálida y orgánica (triangular filtrada para imitar vocalización de animal)
    osc.type = 'triangle';

    // Curva de frecuencia: ataque ascendente rápido y descenso largo quejumbroso
    osc.frequency.setValueAtTime(startFreq * 0.85, startTime);
    osc.frequency.linearRampToValueAtTime(startFreq, startTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), startTime + duration);

    // Vibrato de temblor si está llorando intensamente
    if (withVibrato) {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(9.5, startTime); // 9.5 Hz temblor de sollozo
      lfoGain.gain.setValueAtTime(25, startTime);
      lfo.connect(osc.frequency);
      lfo.start(startTime);
      lfo.stop(startTime + duration);
    }

    // Filtro pasa-bajos para eliminar asperezas y darle textura suave/animal
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, startTime);
    filter.frequency.exponentialRampToValueAtTime(500, startTime + duration);
    filter.Q.setValueAtTime(3, startTime);

    // Envolvente de volumen: sollozo que entra, tiene cresta y se apaga temblando
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  /**
   * Simula un resoplido / sollozo entrecortado (aire y sollozo de nariz)
   */
  _createSniffle(startTime, duration = 0.3) {
    if (!this.ctx) return;

    // Buffer de ruido blanco filtrado para el sollozo de aire
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, startTime);
    filter.frequency.exponentialRampToValueAtTime(1400, startTime + duration * 0.6);
    filter.Q.setValueAtTime(4, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(startTime);
  }

  /**
   * Sonido de victoria / ronroneo feliz de la Capibara (Happy Chittering)
   */
  playCapyHappy() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Ráfaga de 3 gorgoritos alegres en escala ascendente
    [523, 659, 783, 1046].forEach((freq, idx) => {
      const startTime = now + idx * 0.10;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, startTime + 0.12);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.20);
    });
  }
}

export const capyAudio = new CapyAudioEngine();

