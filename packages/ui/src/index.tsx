import type { PropsWithChildren } from 'react';

export function Panel({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section style={{ border: '1px solid #d1d5db', borderRadius: 12, padding: 16, maxWidth: 640 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
