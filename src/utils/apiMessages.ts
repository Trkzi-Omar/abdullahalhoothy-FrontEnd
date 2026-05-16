import i18n, { t } from '../i18n';

type ApiMessagePayload =
  | string
  | null
  | undefined
  | {
      message?: unknown;
      message_key?: unknown;
      detail?: unknown;
      error?: unknown;
      msg?: unknown;
    }
  | unknown[];

export const getApiMessageText = (payload: ApiMessagePayload): string | null => {
  if (payload == null) return null;
  if (typeof payload === 'string') return payload;
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const message = getApiMessageText(item as ApiMessagePayload);
      if (message) return message;
    }
    return null;
  }
  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const candidates = [obj.message, obj.detail, obj.error, obj.msg];
    for (const candidate of candidates) {
      if (typeof candidate === 'string') return candidate;
      if (candidate != null && typeof candidate === 'object') {
        const nested = getApiMessageText(candidate as ApiMessagePayload);
        if (nested) return nested;
      }
    }
  }
  return null;
};

// TODO(backend-key-migration): backend follow-up tracked in #300.
// Remove raw message fallbacks once all API responses emit stable message_key values.
const getApiMessageKey = (payload: ApiMessagePayload): string | null => {
  if (payload == null || typeof payload !== 'object') return null;
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const messageKey = getApiMessageKey(item as ApiMessagePayload);
      if (messageKey) return messageKey;
    }
    return null;
  }

  const obj = payload as Record<string, unknown>;
  if (typeof obj.message_key === 'string') return obj.message_key;

  for (const nestedValue of [obj.detail, obj.error, obj.msg]) {
    const nestedKey = getApiMessageKey(nestedValue as ApiMessagePayload);
    if (nestedKey) return nestedKey;
  }

  return null;
};

export const translateApiMessage = (
  payload: ApiMessagePayload,
  fallbackKey = 'request-failed'
): string => {
  const messageKey = getApiMessageKey(payload);
  if (messageKey && i18n.exists(messageKey)) return t(messageKey);

  const rawMessage = getApiMessageText(payload);

  if (!rawMessage) return t(fallbackKey);

  return rawMessage.replace(/\s*\(Status:\s*\d+\)\s*$/i, '').trim() || t(fallbackKey);
};

export const translateError = (error: unknown, fallbackKey = 'request-failed'): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as { response?: { data?: ApiMessagePayload } };
    const translated = translateApiMessage(apiError.response?.data, fallbackKey);
    if (translated) return translated;
  }

  if (error instanceof Error) return translateApiMessage(error.message, fallbackKey);

  return translateApiMessage(String(error || ''), fallbackKey);
};
