import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================
// TTS Provider Types
// ============================================================

export type TTSProvider = 'kokoro' | 'web-speech' | 'elevenlabs';

export interface TTSVoiceInfo {
  id: string;
  name: string;
  language: string;
  gender: 'Female' | 'Male';
  grade?: string;
  trait?: string;
  provider: TTSProvider;
  // ElevenLabs specific
  voiceId?: string;
  // Web Speech specific
  voiceURI?: string;
}

export type TTSVoice = TTSVoiceInfo['id'];

// ============================================================
// Kokoro Voices (English only - actual model support)
// ============================================================

const KOKORO_VOICES: TTSVoiceInfo[] = [
  // en-US Female (best quality first)
  { id: 'af_heart', name: 'Heart ❤️', language: 'en-US', gender: 'Female', grade: 'A', trait: 'Natural, warm', provider: 'kokoro' },
  { id: 'af_bella', name: 'Bella 🔥', language: 'en-US', gender: 'Female', grade: 'A-', trait: 'Expressive', provider: 'kokoro' },
  { id: 'af_nicole', name: 'Nicole 🎧', language: 'en-US', gender: 'Female', grade: 'B-', trait: 'Clear', provider: 'kokoro' },
  { id: 'af_alloy', name: 'Alloy', language: 'en-US', gender: 'Female', grade: 'B', trait: 'Balanced', provider: 'kokoro' },
  { id: 'af_aoede', name: 'Aoede', language: 'en-US', gender: 'Female', grade: 'C+', trait: 'Soft', provider: 'kokoro' },
  { id: 'af_kore', name: 'Kore', language: 'en-US', gender: 'Female', grade: 'C+', trait: '', provider: 'kokoro' },
  { id: 'af_nova', name: 'Nova', language: 'en-US', gender: 'Female', grade: 'C', trait: '', provider: 'kokoro' },
  { id: 'af_sarah', name: 'Sarah', language: 'en-US', gender: 'Female', grade: 'C+', trait: '', provider: 'kokoro' },
  { id: 'af_sky', name: 'Sky', language: 'en-US', gender: 'Female', grade: 'C-', trait: '', provider: 'kokoro' },
  { id: 'af_jessica', name: 'Jessica', language: 'en-US', gender: 'Female', grade: 'D', trait: '', provider: 'kokoro' },
  { id: 'af_river', name: 'River', language: 'en-US', gender: 'Female', grade: 'D', trait: '', provider: 'kokoro' },
  // en-US Male
  { id: 'am_fenrir', name: 'Fenrir', language: 'en-US', gender: 'Male', grade: 'C+', trait: 'Deep', provider: 'kokoro' },
  { id: 'am_michael', name: 'Michael', language: 'en-US', gender: 'Male', grade: 'C+', trait: 'Professional', provider: 'kokoro' },
  { id: 'am_puck', name: 'Puck', language: 'en-US', gender: 'Male', grade: 'C+', trait: 'Energetic', provider: 'kokoro' },
  { id: 'am_echo', name: 'Echo', language: 'en-US', gender: 'Male', grade: 'D', trait: '', provider: 'kokoro' },
  { id: 'am_eric', name: 'Eric', language: 'en-US', gender: 'Male', grade: 'D', trait: '', provider: 'kokoro' },
  { id: 'am_liam', name: 'Liam', language: 'en-US', gender: 'Male', grade: 'D', trait: '', provider: 'kokoro' },
  { id: 'am_onyx', name: 'Onyx', language: 'en-US', gender: 'Male', grade: 'D', trait: '', provider: 'kokoro' },
  { id: 'am_adam', name: 'Adam', language: 'en-US', gender: 'Male', grade: 'F+', trait: '', provider: 'kokoro' },
  { id: 'am_santa', name: 'Santa', language: 'en-US', gender: 'Male', grade: 'D-', trait: 'Festive', provider: 'kokoro' },
  // en-GB Female
  { id: 'bf_emma', name: 'Emma 🚺', language: 'en-GB', gender: 'Female', grade: 'B-', trait: 'British', provider: 'kokoro' },
  { id: 'bf_isabella', name: 'Isabella', language: 'en-GB', gender: 'Female', grade: 'C', trait: 'British', provider: 'kokoro' },
  { id: 'bf_alice', name: 'Alice 🚺', language: 'en-GB', gender: 'Female', grade: 'D', trait: 'British', provider: 'kokoro' },
  { id: 'bf_lily', name: 'Lily 🚺', language: 'en-GB', gender: 'Female', grade: 'D', trait: 'British', provider: 'kokoro' },
  // en-GB Male
  { id: 'bm_george', name: 'George 🚹', language: 'en-GB', gender: 'Male', grade: 'C', trait: 'British', provider: 'kokoro' },
  { id: 'bm_fable', name: 'Fable 🚹', language: 'en-GB', gender: 'Male', grade: 'C', trait: 'British', provider: 'kokoro' },
  { id: 'bm_lewis', name: 'Lewis', language: 'en-GB', gender: 'Male', grade: 'D+', trait: 'British', provider: 'kokoro' },
  { id: 'bm_daniel', name: 'Daniel 🚹', language: 'en-GB', gender: 'Male', grade: 'D', trait: 'British', provider: 'kokoro' },
];

// ============================================================
// Web Speech API Voices (dynamically loaded from browser)
// ============================================================

function getWebSpeechVoices(): TTSVoiceInfo[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  
  const voices = window.speechSynthesis.getVoices();
  return voices.map((v, i) => ({
    id: `web-${v.voiceURI.replace(/\s+/g, '-').toLowerCase()}`,
    name: `${v.name} ${v.localService ? '💻' : '☁️'}`,
    language: v.lang,
    gender: v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('mujer') || v.name.toLowerCase().includes('woman') ? 'Female' : 'Male',
    grade: 'A', // System voices are generally good quality
    trait: v.localService ? 'Local (offline)' : 'Cloud',
    provider: 'web-speech' as TTSProvider,
    voiceURI: v.voiceURI,
  }));
}

// ============================================================
// ElevenLabs Voices (configured via API key)
// ============================================================

const ELEVENLABS_DEFAULT_VOICES: TTSVoiceInfo[] = [
  // English voices
  { id: 'eleven-rachel', name: 'Rachel', language: 'en-US', gender: 'Female', grade: 'A', trait: 'Calm, storytelling', provider: 'elevenlabs', voiceId: '21m00Tcm4TlvDq8ikWAM' },
  { id: 'eleven-domi', name: 'Domi', language: 'en-US', gender: 'Female', grade: 'A', trait: 'Strong, confident', provider: 'elevenlabs', voiceId: 'AZnzlk1XvdvUeBnXmlld' },
  { id: 'eleven-bella', name: 'Bella', language: 'en-US', gender: 'Female', grade: 'A', trait: 'Soft, conversational', provider: 'elevenlabs', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { id: 'eleven-antoni', name: 'Antoni', language: 'en-US', gender: 'Male', grade: 'A', trait: 'Well-rounded', provider: 'elevenlabs', voiceId: 'ErXwobaYiN019PkySvjV' },
  { id: 'eleven-elli', name: 'Elli', language: 'en-US', gender: 'Female', grade: 'A', trait: 'Emotional', provider: 'elevenlabs', voiceId: 'MF3mGyEYCl7XYWbV9V6O' },
  { id: 'eleven-josh', name: 'Josh', language: 'en-US', gender: 'Male', grade: 'A', trait: 'Deep, resonant', provider: 'elevenlabs', voiceId: 'TxGEqnHWrfWFTfGW9XjX' },
  { id: 'eleven-arnold', name: 'Arnold', language: 'en-US', gender: 'Male', grade: 'A', trait: 'Crisp, authoritative', provider: 'elevenlabs', voiceId: 'VR6AewLTigWG4xSOukaG' },
  { id: 'eleven-adam', name: 'Adam', language: 'en-US', gender: 'Male', grade: 'A', trait: 'Deep, narrator', provider: 'elevenlabs', voiceId: 'pNInz6obpgDQGcFmaJgB' },
  { id: 'eleven-sam', name: 'Sam', language: 'en-US', gender: 'Male', grade: 'A', trait: 'Raspy, conversational', provider: 'elevenlabs', voiceId: 'yoZ06aMxZJJ28mfd3POQ' },
  // Spanish voices (multilingual_v2 model)
  { id: 'eleven-daniel-es', name: 'Daniel (ES)', language: 'es-ES', gender: 'Male', grade: 'A', trait: 'Natural, neutral Spanish', provider: 'elevenlabs', voiceId: 'onwK4e9ZLuTAKqWW03F9' },
  { id: 'eleven-elena-es', name: 'Elena (ES)', language: 'es-ES', gender: 'Female', grade: 'A', trait: 'Warm, conversational Spanish', provider: 'elevenlabs', voiceId: 'mtsI9qC75D42Rvb2pYIa' },
  { id: 'eleven-santiago-es', name: 'Santiago (ES)', language: 'es-MX', gender: 'Male', grade: 'A', trait: 'Mexican Spanish, professional', provider: 'elevenlabs', voiceId: 'XqmlW0gYvB5pFnLOpTHq' },
  { id: 'eleven-valentina-es', name: 'Valentina (ES)', language: 'es-MX', gender: 'Female', grade: 'A', trait: 'Mexican Spanish, friendly', provider: 'elevenlabs', voiceId: 'FGY2WhTYpPnrIDTdsKH5' },
  { id: 'eleven-lucia-es', name: 'Lucía (ES)', language: 'es-ES', gender: 'Female', grade: 'A', trait: 'Spanish from Spain, clear', provider: 'elevenlabs', voiceId: '9v7Kq3KOV15RjwNzWjDh' },
  { id: 'eleven-carlos-es', name: 'Carlos (ES)', language: 'es-ES', gender: 'Male', grade: 'A', trait: 'Spanish from Spain, deep', provider: 'elevenlabs', voiceId: 'TX3LPaxmHKxFdv7VOQHJ' },
];

// ============================================================
// All voices combined (Web Speech loaded dynamically)
// ============================================================

export const AVAILABLE_VOICES: TTSVoiceInfo[] = [
  ...KOKORO_VOICES,
  ...ELEVENLABS_DEFAULT_VOICES,
];

// ============================================================
// TTS State & Hook
// ============================================================

export interface TTSState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  loadedVoices: string[];
  device: 'webgpu' | 'wasm' | null;
  currentProvider: TTSProvider;
  webSpeechVoicesLoaded: boolean;
}

export function useTTS() {
  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const webSpeechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    error: null,
    loadedVoices: [],
    device: null,
    currentProvider: 'kokoro',
    webSpeechVoicesLoaded: false,
  });

  // Load Web Speech voices when available
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setState(prev => ({ ...prev, webSpeechVoicesLoaded: true }));
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Get all available voices (including dynamic Web Speech voices)
  const getAllVoices = useCallback((): TTSVoiceInfo[] => {
    const webVoices = getWebSpeechVoices();
    return [...AVAILABLE_VOICES, ...webVoices];
  }, []);

  // Initialize Kokoro worker
  const initKokoro = useCallback(async () => {
    if (workerRef.current) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, currentProvider: 'kokoro' }));
      
      workerRef.current = new Worker('/tts/worker.js', { type: 'module' });
      
      workerRef.current.onmessage = (e) => {
        const { status, ...data } = e.data;
        
        switch (status) {
          case 'loading_model_start':
            setState(prev => ({ ...prev, device: data.device }));
            break;
          case 'loading_model_ready':
            setState(prev => ({ 
              ...prev, 
              isLoading: false, 
              loadedVoices: data.voices || [],
              device: data.device,
            }));
            break;
          case 'loading_model_progress':
            break;
          case 'error':
            setState(prev => ({ ...prev, isLoading: false, error: data.error }));
            break;
        }
      };
      
      workerRef.current.onerror = (err) => {
        setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      };
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false, error: String(err) }));
    }
  }, []);

  // Speak with selected voice (routes to correct provider)
  const speak = useCallback(async (text: string, voiceId: TTSVoice = 'af_heart') => {
    const allVoices = getAllVoices();
    const voice = allVoices.find(v => v.id === voiceId);
    
    if (!voice) {
      setState(prev => ({ ...prev, error: `Voz no encontrada: ${voiceId}` }));
      return;
    }
    
    setState(prev => ({ ...prev, currentProvider: voice.provider }));
    
    switch (voice.provider) {
      case 'kokoro':
        return speakKokoro(text, voiceId);
      case 'web-speech':
        return speakWebSpeech(text, voice);
      case 'elevenlabs':
        return speakElevenLabs(text, voice);
      default:
        return speakKokoro(text, voiceId);
    }
  }, [getAllVoices]);

  // Kokoro TTS (existing implementation)
  const speakKokoro = useCallback(async (text: string, voiceId: TTSVoice) => {
    if (!workerRef.current) {
      await initKokoro();
    }
    
    if (!workerRef.current) {
      setState(prev => ({ ...prev, error: 'TTS worker not initialized' }));
      return;
    }
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    setState(prev => ({ ...prev, isPlaying: true, error: null }));
    
    return new Promise<void>((resolve, reject) => {
      const worker = workerRef.current!;
      let audioBuffers: AudioBuffer[] = [];
      let chunksReceived = 0;
      let chunksExpected = 0;
      
      const originalOnMessage = worker.onmessage;
      worker.onmessage = (e) => {
        const { status, ...data } = e.data;
        
        switch (status) {
          case 'chunk_count':
            chunksExpected = data.count;
            break;
          case 'stream_audio_data': {
            chunksReceived++;
            const audioBuffer = audioContextRef.current!.createBuffer(
              1,
              data.audio.byteLength / 2,
              24000
            );
            const int16 = new Int16Array(data.audio);
            const float32 = new Float32Array(int16.length);
            for (let i = 0; i < int16.length; i++) {
              float32[i] = int16[i] / 32768.0;
            }
            audioBuffer.copyToChannel(float32, 0);
            audioBuffers.push(audioBuffer);
            worker.postMessage({ type: 'buffer_processed' });
            break;
          }
          case 'complete':
            playBuffersSequentially(audioBuffers, audioContextRef.current!)
              .then(() => {
                setState(prev => ({ ...prev, isPlaying: false }));
                worker.onmessage = originalOnMessage;
                resolve();
              })
              .catch(reject);
            break;
          case 'error':
            setState(prev => ({ ...prev, isPlaying: false, error: data.error }));
            worker.onmessage = originalOnMessage;
            reject(new Error(data.error));
            break;
        }
      };
      
      worker.postMessage({ type: 'generate', text, voice: voiceId });
    });
  }, [initKokoro]);

  // Web Speech API TTS (for Spanish and other languages)
  const speakWebSpeech = useCallback(async (text: string, voice: TTSVoiceInfo) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setState(prev => ({ ...prev, error: 'Web Speech API no disponible en este navegador' }));
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    return new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Find the matching system voice
      const systemVoices = window.speechSynthesis.getVoices();
      const systemVoice = systemVoices.find(v => v.voiceURI === voice.voiceURI);
      
      if (systemVoice) {
        utterance.voice = systemVoice;
      }
      
      utterance.lang = voice.language;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
        webSpeechUtteranceRef.current = null;
        resolve();
      };
      
      utterance.onerror = (event) => {
        setState(prev => ({ ...prev, isPlaying: false, error: `Web Speech error: ${event.error}` }));
        webSpeechUtteranceRef.current = null;
        reject(new Error(event.error));
      };
      
      webSpeechUtteranceRef.current = utterance;
      setState(prev => ({ ...prev, isPlaying: true, error: null }));
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // ElevenLabs TTS (cloud API)
  const speakElevenLabs = useCallback(async (text: string, voice: TTSVoiceInfo) => {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || localStorage.getItem('elevenlabs_api_key');
    
    if (!apiKey) {
      setState(prev => ({ ...prev, error: 'ElevenLabs API key no configurada. Añádela en localStorage o VITE_ELEVENLABS_API_KEY' }));
      return;
    }
    
    if (!voice.voiceId) {
      setState(prev => ({ ...prev, error: 'Voice ID de ElevenLabs no configurado' }));
      return;
    }
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    setState(prev => ({ ...prev, isPlaying: true, error: null }));
    
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(`ElevenLabs API error: ${response.status} - ${error.detail || response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      await playBuffer(audioBuffer, audioContextRef.current);
      
      setState(prev => ({ ...prev, isPlaying: false }));
    } catch (err) {
      setState(prev => ({ ...prev, isPlaying: false, error: String(err) }));
      throw err;
    }
  }, []);

  // Stop current generation
  const stop = useCallback(() => {
    // Stop Kokoro
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' });
    }
    // Stop Web Speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Stop ElevenLabs (would need to track audio source)
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setState({
      isLoading: false,
      isPlaying: false,
      error: null,
      loadedVoices: [],
      device: null,
      currentProvider: 'kokoro',
      webSpeechVoicesLoaded: false,
    });
  }, []);

  return {
    ...state,
    init: initKokoro,
    speak,
    stop,
    cleanup,
    availableVoices: getAllVoices(),
    getAllVoices,
  };
}

// Helper: play audio buffers sequentially
async function playBuffersSequentially(buffers: AudioBuffer[], audioContext: AudioContext): Promise<void> {
  for (const buffer of buffers) {
    await new Promise<void>((resolve) => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.onended = () => resolve();
      source.start(0);
    });
  }
}

// Helper: play single buffer
async function playBuffer(buffer: AudioBuffer, audioContext: AudioContext): Promise<void> {
  return new Promise<void>((resolve) => {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.onended = () => resolve();
    source.start(0);
  });
  }