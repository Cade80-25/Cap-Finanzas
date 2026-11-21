import { useState, useEffect } from 'react';

interface ElevenLabsConfigProps {
  fetchElevenLabsVoices?: (apiKey?: string) => Promise<void>;
}

export function ElevenLabsConfig({ fetchElevenLabsVoices }: ElevenLabsConfigProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('elevenlabs_api_key');
    if (stored) setApiKey(stored);
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      localStorage.removeItem('elevenlabs_api_key');
      if (fetchElevenLabsVoices) await fetchElevenLabsVoices();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    setIsSaving(true);
    localStorage.setItem('elevenlabs_api_key', apiKey.trim());
    if (fetchElevenLabsVoices) await fetchElevenLabsVoices(apiKey.trim());
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = async () => {
    setApiKey('');
    localStorage.removeItem('elevenlabs_api_key');
    if (fetchElevenLabsVoices) await fetchElevenLabsVoices();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasKey = !!localStorage.getItem('elevenlabs_api_key') || !!import.meta.env.VITE_ELEVENLABS_API_KEY;

  return (
    <details className="border-t pt-4">
      <summary className="cursor-pointer font-medium text-gray-700 flex items-center gap-2">
        🔑 Configuración ElevenLabs (Cloud)
        {hasKey && <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Configurado ✓</span>}
      </summary>
      <div className="mt-3 space-y-3 text-sm">
        <p className="text-gray-600">
          Para usar voces premium de ElevenLabs (incluyendo español), necesitas una API key.
          <br />
          <a href="https://elevenlabs.io/app/speech-synthesis" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Consigue tu key en ElevenLabs →
          </a>
        </p>
        
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">API Key:</span>
            <div className="relative mt-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasKey ? '••••••••••••••••' : '«redacted:sk_…»'}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showKey ? 'Ocultar key' : 'Mostrar key'}
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !apiKey.trim() && !hasKey}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isSaving ? 'Guardando...' : hasKey ? 'Actualizar key' : 'Guardar key'}
            </button>
            {hasKey && (
              <button
                onClick={handleClear}
                disabled={isSaving}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50 transition-colors text-sm"
              >
                Eliminar key
              </button>
            )}
          </div>

          {saved && (
            <p className="text-green-600 text-sm">✅ API key guardada en localStorage (persiste entre sesiones)</p>
          )}
        </div>

        <div className="border-t pt-3 text-xs text-gray-500 space-y-1">
          <p>• La key se guarda solo en tu navegador (localStorage), no se envía a ningún servidor salvo ElevenLabs</p>
          <p>• Modelo usado: <code>eleven_multilingual_v2</code> (soporta 29 idiomas incluyendo español)</p>
          <p>• Voces disponibles: 9 inglés + 6 español (España y México)</p>
          {import.meta.env.VITE_ELEVENLABS_API_KEY && (
            <p className="text-blue-600">• También detectada VITE_ELEVENLABS_API_KEY en variables de entorno (tiene prioridad)</p>
          )}
        </div>
      </div>
    </details>
  );
}