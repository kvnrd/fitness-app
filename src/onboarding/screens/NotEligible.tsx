import { View } from 'react-native';
import { NOT_ELIGIBLE_BODY, NOT_ELIGIBLE_TITLE } from '../../legal/text';
import { OnbScreen } from '../ui/OnbScreen';
import { OnbSub, OnbTitle } from '../ui/OnbText';
import { Wordmark } from '../ui/Wordmark';

/** Screen 4: dead end. No age, no threshold, no buttons, no back, no retry. [ATTORNEY] */
export function NotEligibleScreen() {
  return (
    <OnbScreen centerContent>
      <View style={{ position: 'absolute', top: 8, left: 24 }}>
        <Wordmark />
      </View>
      <View style={{ gap: 12 }} accessibilityLiveRegion="polite">
        <OnbTitle>{NOT_ELIGIBLE_TITLE}</OnbTitle>
        <OnbSub>{NOT_ELIGIBLE_BODY}</OnbSub>
      </View>
    </OnbScreen>
  );
}
