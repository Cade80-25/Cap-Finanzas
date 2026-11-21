import { useState } from 'react';
import { useTTS, TTSVoice, TTSVoiceInfo } from '../hooks/useTTS';
import { VoiceSelector } from './TTSVoiceSelector';

export function TTSControlPanel() {
  const { 
      isLoading, 
      isPlaying, 
      error, 
      loadedVoices, 
      device, 
      init, 
      speak, 
      stop,
      availableVoices,
      currentProvider
    } = useTTS();
  
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>('af_heart');
  const [testText, setTestText] = useState('¡Hola! Esta es una prueba de voz local en Cap-Finanzas. Funciona sin internet y sin APIs externas.');

  const handleTestSpeak = async () => {
    if (!testText.trim()) return;
    try {
      await speak(testText, selectedVoice);
    } catch (err) {
      console.error('TTS Error:', err);
    }
  };

  const isReady = loadedVoices.length > 0 && !isLoading;
  const currentVoice = availableVoices.find(v => v.id === selectedVoice);

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'kokoro': return { label: 'Kokoro (Local, Inglés)', color: 'bg-purple-100 text-purple-700' };
      case 'web-speech': return { label: 'Navegador (Sistema, Multi-idioma)', color: 'bg-green-100 text-green-700' };
      case 'elevenlabs': return { label: 'ElevenLabs (Cloud, Personalizadas)', color: 'bg-blue-100 text-blue-700' };
      default: return { label: provider, color: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">🎙️ Text-to-Speech Local (Kokoro)</h2>
          <p className="text-sm text-gray-500 mt-1">
            Modelo ONNX 82M params • WebGPU/WASM • 100% offline • Apache-2.0
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            device === 'webgpu' ? 'bg-green-100 text-green-700' :
            device === 'wasm' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {device?.toUpperCase() || '—'}
          </span>
          {isLoading && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 animate-pulse">
              Cargando modelo...
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4 text-sm">
        <span className={isReady ? 'text-green-600' : 'text-gray-400'}>
          {isReady ? '✅ Listo' : '⏳ Cargando modelo (primera vez ~30s)'}
        </span>
        <span className="text-gray-400">|</span>
        <span className={isPlaying ? 'text-blue-600' : 'text-gray-400'}>
          {isPlaying ? '🔊 Reproduciendo...' : '⏸️ Detenido'}
        </span>
        {error && (
          <>
            <span className="text-gray-400">|</span>
            <span className="text-red-600">❌ {error}</span>
          </>
        )}
      </div>

      {/* Voice Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Voz seleccionada: <strong>{availableVoices.find(v => v.id === selectedVoice)?.name || selectedVoice}</strong>
        </label>
        <VoiceSelector
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
          showLanguageFilter={true}
        />
      </div>

      {/* Test Area */}
      <div className="border-t pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Probar texto:
        </label>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Escribe el texto a sintetizar..."
        />
        <div className="flex gap-3 mt-3">
          <button
            onClick={handleTestSpeak}
            disabled={!isReady || isPlaying || !testText.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPlaying ? '⏳ Generando...' : '▶️ Probar voz'}
          </button>
          <button
            onClick={stop}
            disabled={!isPlaying}
            className="px-6 py-2.5 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ⏹️ Detener
          </button>
          {!isReady && !isLoading && (
            <button
              onClick={init}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              🔄 Inicializar TTS
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <details className="border-t pt-4 text-sm text-gray-500">
        <summary className="cursor-pointer font-medium text-gray-700">ℹ️ Detalles técnicos</summary>
        <div className="mt-2 space-y-1">
          <p>• Modelo: <code>onnx-community/Kokoro-82M-v1.0-ONNX</code> (quantized fp32/q8)</p>
          <p>• Voces: {availableVoices.length} voces (en-US / en-GB / es-ES)</p>
          <p>• Backend: {device === 'webgpu' ? 'WebGPU (GPU acelerado)' : device === 'wasm' ? 'WASM (CPU)' : 'Detectando...'}</p>
          <p>• Caché: Service Worker + Cache API (offline tras primera carga)</p>
          <p>• Licencia: Apache-2.0 (gratis, comercial, sin atribución requerida)</p>
        </div>
      </details>
    </div>
  );
}