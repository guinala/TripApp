import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PhotoCredit } from '@/types/explore';
import { colors, fonts } from '@/constants/theme';

export function PhotoAttribution({ credits }: { credits: PhotoCredit[] }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  if (!credits.length) return null;

  return (
    <View style={{ padding: 10, gap: 4 }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {credits.map((credit, index) => (
          <Pressable
            key={`${credit.name}-${index}`}
            accessibilityRole={credit.uri ? 'link' : undefined}
            disabled={!credit.uri}
            hitSlop={6}
            onPress={(event) => {
              event.stopPropagation();

              if (!credit.uri) return;

              setFailed(false);
              void Linking.openURL(credit.uri).catch(() => setFailed(true));
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sansRegular,
                fontSize: 11,
                color: colors.textSecondary,
              }}
            >
              {index === 0
                ? t('dynamicExplore.photoCredit', {
                    author: credit.name,
                  })
                : `· ${credit.name}`}
            </Text>
          </Pressable>
        ))}
      </View>

      {failed && (
        <Text accessibilityRole="alert">
          {t('dynamicExplore.creditLinkError', {
            defaultValue: 'No se pudo abrir el enlace.',
          })}
        </Text>
      )}
    </View>
  );
}
