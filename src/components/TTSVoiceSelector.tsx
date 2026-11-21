import { useState, useMemo } from 'react';
import { AVAILABLE_VOICES, TTSVoice, TTSVoiceInfo } from '../hooks/useTTS';

interface VoiceSelectorProps {
  selectedVoice: TTSVoice;
  onVoiceChange: (voice: TTSVoice) => void;
  language?: 'en-US' | 'en-GB' | 'es-es' | 'all';
  showLanguageFilter?: boolean;
  className?: string;
}

export function VoiceSelector({ 
  selectedVoice, 
  onVoiceChange, 
  language = 'all',
  showLanguageFilter = true,
  className = ''
}: VoiceSelectorProps) {
  const [filterLang, setFilterLang] = useState<'all' | string>('all');
  const [filterGender, setFilterGender] = useState<'all' | 'Female' | 'Male'>('all');
  const [filterProvider, setFilterProvider] = useState<'all' | 'kokoro' | 'web-speech' | 'elevenlabs'>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get unique languages from available voices
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    AVAILABLE_VOICES.forEach(v => langs.add(v.language));
    return Array.from(langs).sort();
  }, []);

  const filteredVoices = useMemo(() => {
    return AVAILABLE_VOICES.filter(v => {
      const langMatch = filterLang === 'all' || v.language === filterLang;
      const genderMatch = filterGender === 'all' || v.gender === filterGender;
      const providerMatch = filterProvider === 'all' || v.provider === filterProvider;
      return langMatch && genderMatch && providerMatch;
    });
  }, [filterLang, filterGender, filterProvider]);

  const topVoices = filteredVoices.filter(v => ['A', 'A-', 'B-', 'B'].includes(v.grade?.[0] || ''));
  const otherVoices = filteredVoices.filter(v => !['A', 'A-', 'B-', 'B'].includes(v.grade?.[0] || ''));

  const getGradeColor = (grade?: string) => {
    if (!grade) return 'text-gray-600 bg-gray-50';
    if (grade.startsWith('A')) return 'text-green-600 bg-green-50';
    if (grade.startsWith('B')) return 'text-yellow-600 bg-yellow-50';
    if (grade.startsWith('C')) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'kokoro': return { label: 'Kokoro', class: 'bg-purple-100 text-purple-700' };
      case 'web-speech': return { label: 'Navegador', class: 'bg-green-100 text-green-700' };
      case 'elevenlabs': return { label: 'ElevenLabs', class: 'bg-blue-100 text-blue-700' };
      default: return { label: provider, class: 'bg-gray-100 text-gray-700' };
    }
  };

  const getLanguageFlag = (lang: string) => {
    if (lang.startsWith('en-US')) return '🇺🇸';
    if (lang.startsWith('en-GB')) return '🇬🇧';
    if (lang.startsWith('es')) return '🇪🇸';
    if (lang.startsWith('fr')) return '🇫🇷';
    if (lang.startsWith('de')) return '🇩🇪';
    if (lang.startsWith('it')) return '🇮🇹';
    if (lang.startsWith('pt')) return '🇵🇹';
    if (lang.startsWith('ja')) return '🇯🇵';
    if (lang.startsWith('ko')) return '🇰🇷';
    if (lang.startsWith('zh')) return '🇨🇳';
    return '🌐';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Language, Gender & Provider Filters */}
      {showLanguageFilter && (
        <div className="flex flex-wrap gap-2">
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">🌐 Todos los idiomas</option>
            {availableLanguages.map(lang => (
              <option key={lang} value={lang}>
                {getLanguageFlag(lang)} {lang}
              </option>
            ))}
          </select>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">👥 Todos los géneros</option>
            <option value="Female">👩 Femenino</option>
            <option value="Male">👨 Masculino</option>
          </select>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">🔧 Todos los proveedores</option>
            <option value="kokoro">🤖 Kokoro (Local, Inglés)</option>
            <option value="web-speech">🌐 Navegador (Sistema, Multi-idioma)</option>
            <option value="elevenlabs">☁️ ElevenLabs (Cloud, Personalizadas)</option>
          </select>
        </div>
      )}

      {/* Top Recommended Voices */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          ⭐ Recomendadas
          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
            {topVoices.length}
          </span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {topVoices.map(voice => (
            <VoiceOption
                            key={voice.id}
                            voice={voice}
                            isSelected={selectedVoice === voice.id}
                            onSelect={() => onVoiceChange(voice.id)}
                            getProviderBadge={getProviderBadge}
                            getLanguageFlag={getLanguageFlag}
                            getGradeColor={getGradeColor}
                          />
          ))}
        </div>
      </div>

      {/* Other Voices (collapsible) */}
      {otherVoices.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            {showAdvanced ? '▼' : '▶'} Otras voces ({otherVoices.length})
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 ml-4">
              {otherVoices.map(voice => (
                <VoiceOption
                                key={voice.id}
                                voice={voice}
                                isSelected={selectedVoice === voice.id}
                                onSelect={() => onVoiceChange(voice.id)}
                                getProviderBadge={getProviderBadge}
                                getLanguageFlag={getLanguageFlag}
                                getGradeColor={getGradeColor}
                              />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface VoiceOptionProps {
  voice: TTSVoiceInfo;
  isSelected: boolean;
  onSelect: () => void;
  getProviderBadge: (provider: string) => { label: string; class: string };
  getLanguageFlag: (lang: string) => string;
  getGradeColor: (grade?: string) => string;
}

function VoiceOption({ voice, isSelected, onSelect, getProviderBadge, getLanguageFlag, getGradeColor }: VoiceOptionProps) {
  const gradeColor = 
    !voice.grade ? 'border-gray-300 bg-gray-50' :
    voice.grade.startsWith('A') ? 'border-green-300 bg-green-50' :
    voice.grade.startsWith('B') ? 'border-yellow-300 bg-yellow-50' :
    voice.grade.startsWith('C') ? 'border-orange-300 bg-orange-50' :
    'border-red-300 bg-red-50';

  const providerBadge = getProviderBadge(voice.provider);
  const flag = getLanguageFlag(voice.language);

  return (
    <button
      onClick={onSelect}
      className={`
        w-full p-3 text-left rounded-lg border-2 transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : gradeColor}
        hover:border-blue-400 hover:shadow-md
      `}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium text-gray-900">{voice.name}</div>
        <span className={`px-2 py-0.5 text-xs rounded font-medium ${providerBadge.class}`}>
          {providerBadge.label}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
        <span className="px-1.5 py-0.5 rounded text-white bg-gray-400">
          {flag} {voice.language}
        </span>
        <span className="px-1.5 py-0.5 rounded text-white bg-gray-400">
          {voice.gender === 'Female' ? '👩' : '👨'} {voice.gender}
        </span>
        {voice.grade && (
          <span className={`px-1.5 py-0.5 rounded font-medium ${getGradeColor(voice.grade)}`}>
            {voice.grade}
          </span>
        )}
      </div>
      {voice.trait && (
        <div className="mt-1 text-xs text-gray-400 italic">{voice.trait}</div>
      )}
      {isSelected && (
        <div className="mt-2 text-xs text-blue-600 font-medium">✓ Seleccionada</div>
      )}
    </button>
  );
}