import { useContext } from 'react';
import { ChatContext } from './chatContextDef';
import { t } from '../i18n';

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error(t("usechatcontext-must-be-used-within-a-chatprovider"));
  }
  return context;
}
