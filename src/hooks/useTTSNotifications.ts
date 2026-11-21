import { useTTS } from './useTTS';
import { useCallback } from 'react';

/**
 * Hook para integrar TTS en notificaciones/toasts del sistema
 * Uso: const { notifyWithVoice } = useTTSNotifications();
 *      notifyWithVoice('Transacción guardada', 'success');
 */
export function useTTSNotifications() {
  const { speak, isLoading, init } = useTTS();

  // Inicializar TTS al montar
  const initialize = useCallback(async () => {
    if (isLoading) return;
    await init();
  }, [init, isLoading]);

  // Mapear tipo de notificación a voz y texto
  const notifyWithVoice = useCallback(async (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    // Voces por tipo de notificación
    const voiceMap: Record<string, string> = {
      success: 'af_heart',    // Cálida, positiva
      error: 'af_bella',      // Expresiva, llama la atención
      warning: 'am_fenrir',   // Masculina profunda, seria
      info: 'af_nicole',      // Neutral, clara
    };

    const voice = voiceMap[type] || 'af_heart';
    
    // Prefijo según tipo
    const prefixMap: Record<string, string> = {
      success: '✅ ',
      error: '❌ ',
      warning: '⚠️ ',
      info: 'ℹ️ ',
    };

    const prefix = prefixMap[type] || '';
    const fullMessage = prefix + message;
    
    try {
      await speak(fullMessage, voice as any);
    } catch (err) {
      console.warn('TTS notification failed:', err);
    }
  }, [speak]);

  // Notificaciones predefinidas para Cap-Finanzas
  const notifyTransactionSaved = useCallback(async (description: string, amount?: number) => {
    const msg = amount 
      ? 'Transacción guardada: ' + description + ' por ' + amount.toLocaleString() + ' pesos'
      : 'Transacción guardada: ' + description;
    await notifyWithVoice(msg, 'success');
  }, [notifyWithVoice]);

  const notifyBalanceAlert = useCallback(async (message: string) => {
    await notifyWithVoice('Alerta de saldo: ' + message, 'warning');
  }, [notifyWithVoice]);

  const notifyReportReady = useCallback(async (reportName: string) => {
    await notifyWithVoice('Reporte listo: ' + reportName, 'info');
  }, [notifyWithVoice]);

  const notifyError = useCallback(async (error: string) => {
    await notifyWithVoice('Error: ' + error, 'error');
  }, [notifyWithVoice]);

  return {
    initialize,
    notifyWithVoice,
    notifyTransactionSaved,
    notifyBalanceAlert,
    notifyReportReady,
    notifyError,
    isReady: !isLoading,
  };
}