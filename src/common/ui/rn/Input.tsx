import React from 'react';
import { Input as Sa2Input } from '@sa2kit-ui/rn';
import type { MobileInputProps } from '@sa2kit-ui/shared';
import { View, type TextInputProps } from 'react-native';

type Props = MobileInputProps &
  Pick<TextInputProps, 'secureTextEntry' | 'autoCapitalize' | 'keyboardType' | 'autoCorrect'> & {
    /** RN TextInput 习惯 API */
    onChangeText?: (text: string) => void;
    multiline?: boolean;
    editable?: boolean;
    style?: object;
  };

/** 动森 Input：同时接受 onChange(string) 与 onChangeText，并透传常见 RN 字段 */
export function Input({
  onChange,
  onChangeText,
  multiline: _multiline,
  editable,
  style,
  disabled,
  ...rest
}: Props) {
  const node = (
    <Sa2Input
      {...rest}
      disabled={disabled || editable === false}
      onChange={(value) => {
        onChange?.(value);
        onChangeText?.(value);
      }}
    />
  );
  if (style) {
    return <View style={style as object}>{node}</View>;
  }
  return node;
}
