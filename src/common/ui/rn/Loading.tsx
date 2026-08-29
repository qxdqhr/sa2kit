import React from 'react';

import { Loading as Sa2Loading, type LoadingProps } from '@sa2kit-ui/rn';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type Props = LoadingProps & {
  fullScreen?: boolean;
};

/** RN Loading：兼容宿主 fullScreen 全屏遮罩 */
export function Loading({ active = true, fullScreen = false, className, style }: Props) {
  if (!active) return null;
  if (fullScreen) {
    return (
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color="#19c8b9" />
      </View>
    );
  }
  return <Sa2Loading active={active} className={className} style={style} />;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f0',
    zIndex: 50,
  },
});
