/**
 * HubziAmbient — Música de Fondo Procedural y Calmante para el Juego
 *
 * Genera música ambient directamente con Web Audio API (sin archivos externos).
 * Basada en escala pentatónica menor (la más calmante y armoniosa universalmente).
 * Ideal para reducir ansiedad de examen y mantener el estado de flow del estudiante.
 *
 * Características:
 * - Pad ambient suave (ondas sine moduladas por LFO lento)
 * - Melodía pentatónica aleatoria con notas de piano suave
 * - Notas de bajo profundas y sostenidas
 * - Reverb simulado con ConvolverNode
 * - Control de volumen con fade in/out suave
 */

class HubziAmbientEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.reverbNode = null;
    this.reverbGain = null;
    this.isPlaying = false;
    this.melodyTimerId = null;
    this.padNodes = [];
    this.targetVolume = 0.80;

    // Escala pentatónica menor en Do: Do, Mib, Fa, Sol, Sib
    // Universalmente calmante — usada en música meditativa y ambient asiático
    this.pentatonicNotes = [
      130.81, // C3
      155.56, // Eb3
      174.61, // F3
      196.00, // G3
      233.08, // Bb3
      261.63, // C4
      311.13, // Eb4
      349.23, // F4
      392.00, // G4
      466.16, // Bb4
      523.25, // C5
      622.25, // Eb5
    ];

    this.bassNotes = [65.41, 77.78, 87.31, 98.00, 116.54];
    this._listeners = [];
  }

  _init() {
    if (this.ctx) return true;
    if (typeof window === 'undefined') return false;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.reverbNode = this._createReverb(1.8, 2.0);
    if (this.reverbNode) {
      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.reverbNode.connect(this.reverbGain);
      this.reverbGain.connect(this.masterGain);
    }
    return true;
  }

  async _resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (_) { }
    }
  }

  _createReverb(duration = 2.0, decay = 2.0) {
    if (!this.ctx) return null;
    try {
      const sampleRate = this.ctx.sampleRate;
      const length = Math.floor(sampleRate * duration);
      const buffer = this.ctx.createBuffer(2, length, sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }
      const convolver = this.ctx.createConvolver();
      convolver.buffer = buffer;
      return convolver;
    } catch (_) {
      return null;
    }
  }

  _startAmbientPad() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const padFreqs = [130.81, 196.00, 261.63, 311.13];

    padFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, now);
      lfoGain.gain.setValueAtTime(4.0, now);
      lfo.connect(osc.frequency);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900 + idx * 120, now);
      filter.Q.setValueAtTime(1.0, now);

      oscGain.gain.setValueAtTime(0.0001, now);
      oscGain.gain.linearRampToValueAtTime(0.18 - idx * 0.02, now + 1.5);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(now);
      lfo.start(now);

      this.padNodes.push({ osc, oscGain, lfo });
    });
  }

  _playPianoNote(freq, startTime, volume = 0.22, duration = 1.8) {
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(volume * 0.5, startTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(gain);
    osc2.connect(gain);

    gain.connect(this.masterGain);
    if (this.reverbNode) {
      gain.connect(this.reverbNode);
    }

    osc1.start(startTime);
    osc1.stop(startTime + duration + 0.1);
    osc2.start(startTime);
    osc2.stop(startTime + duration + 0.1);
  }

  _playBassNote(freq, startTime, duration = 4.0) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, startTime);
    filter.Q.setValueAtTime(0.8, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.22, startTime + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  _scheduleMelody() {
    if (!this.isPlaying || !this.ctx) return;

    const now = this.ctx.currentTime;
    const phraseLength = 3 + Math.floor(Math.random() * 3);
    const tempo = 0.55 + Math.random() * 0.35;

    for (let i = 0; i < phraseLength; i++) {
      const noteIdx = Math.floor(Math.random() * this.pentatonicNotes.length);
      const freq = this.pentatonicNotes[noteIdx];
      const noteStart = now + i * tempo;
      const volume = 0.18 + Math.random() * 0.08;
      const duration = 1.2 + Math.random() * 0.8;
      this._playPianoNote(freq, noteStart, volume, duration);
    }

    if (Math.random() < 0.4) {
      const bassFreq = this.bassNotes[Math.floor(Math.random() * this.bassNotes.length)];
      this._playBassNote(bassFreq, now, 4.5 + Math.random() * 2.0);
    }

    const nextPhraseDelay = phraseLength * tempo + 3.0 + Math.random() * 3.5;
    this.melodyTimerId = setTimeout(() => {
      this._scheduleMelody();
    }, nextPhraseDelay * 1000);
  }

  async start() {
    if (this.isPlaying) return;
    if (!this._init()) return;
    await this._resume();

    this.isPlaying = true;

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.gain.linearRampToValueAtTime(this.targetVolume, now + 1.2);

    this._startAmbientPad();

    this.melodyTimerId = setTimeout(() => {
      this._scheduleMelody();
    }, 800);

    this._notify();
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.melodyTimerId) {
      clearTimeout(this.melodyTimerId);
      this.melodyTimerId = null;
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 1.5);

      setTimeout(() => {
        this.padNodes.forEach(({ osc, lfo }) => {
          try { osc.stop(); } catch (_) { }
          try { lfo.stop(); } catch (_) { }
        });
        this.padNodes = [];
      }, 1600);
    }

    this._notify();
  }

  async toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      await this.start();
    }
  }

  setVolume(vol) {
    this.targetVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && this.isPlaying) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(this.targetVolume, now + 0.5);
    }
  }

  subscribe(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter(l => l !== fn);
    };
  }

  _notify() {
    this._listeners.forEach(fn => fn({ isPlaying: this.isPlaying }));
  }
}

export const hubziAmbient = new HubziAmbientEngine();
