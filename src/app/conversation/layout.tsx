'use client';

import '@/styles/chat.css';
import { ConversationLayout } from '@/components/conversation/layout';

export default function ConversationLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConversationLayout>{children}</ConversationLayout>;
}
