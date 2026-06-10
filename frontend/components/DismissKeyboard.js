import React from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";

/**
 * Wraps a NON-scrolling screen so tapping anywhere outside a TextInput dismisses
 * the keyboard.
 *
 * For scrollable screens, prefer adding `keyboardShouldPersistTaps="handled"` to
 * the ScrollView/FlatList instead — that dismisses the keyboard on outside taps
 * and during scroll while still letting buttons receive their tap.
 *
 * `accessible={false}` keeps the wrapper invisible to screen readers so it does
 * not capture the whole screen as one accessibility element.
 */
export default function DismissKeyboard({ children, style }) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[{ flex: 1 }, style]}>{children}</View>
    </TouchableWithoutFeedback>
  );
}
