import type { PropsWithChildren, ReactNode } from 'react';
import { Text, View } from 'react-native';

export function SharedCard({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 18,
        padding: 16,
        backgroundColor: '#0f172a',
      }}
    >
      <Text style={{ color: '#7dd3fc', fontSize: 12, textTransform: 'uppercase', fontWeight: '700' }}>{title}</Text>
      {subtitle ? <Text style={{ color: '#e2e8f0', marginTop: 6, marginBottom: 10 }}>{subtitle}</Text> : null}
      <View>{children}</View>
    </View>
  );
}

export function SharedHeading({ children }: { children: ReactNode }) {
  return <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: '700' }}>{children}</Text>;
}

export function SharedText({ children }: { children: ReactNode }) {
  return <Text style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 22 }}>{children}</Text>;
}
