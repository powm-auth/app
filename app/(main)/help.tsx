import {
  AnimatedEntry,
  BackgroundImage,
  Column,
  GlassCard,
  PowmIcon,
  PowmText,
  Row,
  ScreenHeader,
} from '@/components';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItemProps {
  question: string;
  answer: string;
  index: number;
}

const FAQItem = ({ question, answer, index }: FAQItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);

    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <AnimatedEntry index={index} slideDistance={20}>
      <GlassCard padding={0} style={{ marginBottom: powmSpacing.sm }}>
        <Pressable onPress={toggleExpand} style={styles.questionRow}>
          <Row align="center" gap={12} style={{ flex: 1 }}>
            <View style={styles.dot} />
            <PowmText variant="subtitleSemiBold" style={{ flex: 1, fontSize: 15 }}>
              {question}
            </PowmText>
          </Row>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <PowmIcon name="chevron" size={20} color={powmColors.inactive} />
          </Animated.View>
        </Pressable>

        {expanded && (
          <View style={styles.answerContainer}>
            <PowmText variant="text" color={powmColors.inactive} style={styles.answerText}>
              {answer}
            </PowmText>
          </View>
        )}
      </GlassCard>
    </AnimatedEntry>
  );
};

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const faqs = [
    {
      question: "What is Powm?",
      answer: "Powm is a digital wallet for your identity. It lets you prove who you are (like your age or name) to apps and people without sharing unnecessary personal details."
    },
    {
      question: "Is my data safe?",
      answer: "Yes. Your data lives on your phone, not on our servers. It is encrypted so only you can access it. When you share information, it is sent securely so that only the recipient can read it."
    },
    {
      question: "Can Powm see my data?",
      answer: "We cannot see your sensitive details like your name or date of birth. Non-sensitive data (like gender) uses privacy-enhancing techniques to prevent tracking."
    },
    {
      question: "How do I share my identity?",
      answer: "You can scan a QR code from an app, website, or another person's phone. You will see exactly what information they are asking for. If you approve, your wallet sends only that specific information securely."
    },
    {
      question: "Can I prove my age without showing my birthday?",
      answer: "Yes. You can request or be requested to only share your 18+ or 21+ status without ever revealing your actual date of birth."
    },
    {
      question: "What if I lose my phone?",
      answer: "Since your data is only on your phone, you will need your recovery phrase to restore your wallet on a new device. Make sure to keep your recovery phrase safe and offline."
    },
    {
      question: "Can I delete my history?",
      answer: "Yes. Your history is stored only on your phone for your own reference. You can delete any item or clear your entire history whenever you want."
    }
  ];

  return (
    <BackgroundImage>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + powmSpacing.lg, paddingBottom: insets.bottom + powmSpacing.xl },
          ]}
        >
          <ScreenHeader title="Help & FAQ" />

          <Column gap={0}>
            {faqs.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
                index={index}
              />
            ))}
          </Column>

          <View style={styles.footerNote}>
            <PowmText variant="text" color={powmColors.gray} align="center" style={{ fontSize: 12 }}>
              Still need help? Visit powm.app/support
            </PowmText>
          </View>

        </ScrollView>
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: powmSpacing.lg },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: powmColors.electricMain,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 34, // Indent text to align with question text (skipping dot)
  },
  answerText: {
    lineHeight: 20,
    fontSize: 13,
  },
  footerNote: {
    marginTop: powmSpacing.xxl,
    opacity: 0.6,
  },
});
