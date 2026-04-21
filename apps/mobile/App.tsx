import { SafeAreaView, View } from 'react-native';

import { SharedCard, SharedHeading, SharedText } from '@fishing/shared-ui';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
      <View style={{ padding: 24, gap: 16 }}>
        <SharedHeading>Fishing mobile MVP</SharedHeading>
        <SharedText>Базовый shell приложения с подключённым shared UI-пакетом.</SharedText>

        <SharedCard title="Shared UI demo" subtitle="Компонент рендерится и в mobile, и в web">
          <SharedText>Следующий слой: карта, точки и прогноз клёва по выбранной точке.</SharedText>
        </SharedCard>
      </View>
    </SafeAreaView>
  );
}
