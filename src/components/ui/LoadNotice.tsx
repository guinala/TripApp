import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { ui } from '@/components/explore/PlacesUI';

export function LoadNotice({
  loading = false,
  error = false,
  message,
  onRetry,
}: {
  loading?: boolean;
  error?: boolean;
  message?: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  if (!loading && !error && !message) return null;
  return (
    <View style={ui.card} accessibilityLiveRegion="polite">
      {loading && <ActivityIndicator color={colors.primary} />}
      <Text style={ui.text}>{message ?? t(loading ? 'fixes.loading' : 'fixes.loadError')}</Text>
      {onRetry && !loading && (
        <Pressable style={ui.secondary} accessibilityRole="button" onPress={onRetry}>
          <Text style={[ui.text, { padding: 14, color: colors.primary }]}>{t('places.retry')}</Text>
        </Pressable>
      )}
    </View>
  );
}
