import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image, type ImageProps } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
export function RemoteImage({
  uri,
  label,
  onImageError,
  cachePolicy,
}: {
  uri: string;
  label: string;
  onImageError?: () => void;
  cachePolicy?: ImageProps['cachePolicy'];
}) {
  const { t } = useTranslation();
  const [attempt, setAttempt] = useState(0);
  const key = `${uri}:${attempt}`;
  const [state, setState] = useState<{ key: string; status: 'ready' | 'error' } | null>(null);
  const status = state?.key === key ? state.status : 'loading';
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
      ]}
    >
      <Image
        key={key}
        source={{ uri }}
        accessibilityLabel={label}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy={cachePolicy}
        onLoad={() => setState({ key, status: 'ready' })}
        onError={() => {
          setState({ key, status: 'error' });
          onImageError?.();
        }}
      />
      {status === 'loading' && <ActivityIndicator color={colors.primary} />}
      {status === 'error' && !onImageError && (
        <Pressable
          accessibilityRole="button"
          onPress={(event) => {
            event.stopPropagation();
            setAttempt((n) => n + 1);
          }}
          style={{
            padding: 12,
            minHeight: 48,
            backgroundColor: colors.surfacePaper,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.secondary }}>{t('fixes.imageError')}</Text>
          <Text style={{ color: colors.primary }}>{t('fixes.imageRetry')}</Text>
        </Pressable>
      )}
    </View>
  );
}
