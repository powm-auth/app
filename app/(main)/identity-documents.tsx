import {
  AnimatedEntry,
  BackgroundImage,
  Column,
  GlassCard,
  ListItem,
  PowmIcon,
  PowmIconName,
  PowmText,
  ScreenHeader,
} from '@/components';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
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

interface Document {
  id: string;
  type: string;
  status: 'Used' | 'Revoked';
  icon: PowmIconName;
}

export default function IdentityDocumentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [documents, setDocuments] = useState<Document[]>([
    { id: '1', type: 'Identity Card', status: 'Used', icon: 'id' },
    { id: '2', type: 'Passport', status: 'Used', icon: 'flag' },
    { id: '3', type: 'Driving License', status: 'Used', icon: 'data' },
  ]);

  const handleRevoke = (id: string) => {
    Alert.alert(
      "Revoke Document",
      "Are you sure you want to revoke this document? It will no longer be used for proofs.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Revoke", 
          style: "destructive", 
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setDocuments(prev => prev.filter(doc => doc.id !== id));
          }
        }
      ]
    );
  };

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
          <ScreenHeader title="Documents" />

          <View style={styles.listContainer}>
            {documents.map((doc, index) => (
              <AnimatedEntry key={doc.id} index={index} slideDistance={20}>
                <GlassCard padding={0} style={{ marginBottom: powmSpacing.md }}>
                  <ListItem 
                    title={doc.type}
                    subtitle={doc.status}
                    icon={doc.icon}
                    iconColor={powmColors.electricMain}
                    rightElement={
                      <Pressable 
                        onPress={() => handleRevoke(doc.id)}
                        style={styles.revokeButton}
                      >
                        <PowmText variant="text" style={{ fontSize: 12, color: powmColors.deletionRedHard, fontWeight: '600' }}>
                          Revoke
                        </PowmText>
                      </Pressable>
                    }
                    // onPress needed to enable ripple if desired, or disable if just a list
                  />
                </GlassCard>
              </AnimatedEntry>
            ))}
            
            {documents.length === 0 && (
              <View style={styles.emptyState}>
                <PowmText variant="text" color={powmColors.gray}>No documents found.</PowmText>
              </View>
            )}
          </View>

          {/* Privacy Disclaimer */}
          <View style={styles.disclaimerContainer}>
            <PowmIcon name="check" size={32} color={powmColors.electricMain} style={{ marginBottom: 12, opacity: 0.8 }} />
            <PowmText variant="text" color={powmColors.gray} align="center" style={styles.disclaimerText}>
              Powm doesn't store your documents. We just store an authentication proof on your side on your mobile phone, completely encrypted.
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
  listContainer: { marginBottom: powmSpacing.xxl },
  revokeButton: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderRadius: 12,
  },
  emptyState: { padding: 20, alignItems: 'center' },
  disclaimerContainer: {
    marginTop: 'auto',
    padding: 24,
    backgroundColor: 'rgba(160, 107, 255, 0.05)',
    borderRadius: powmRadii.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(160, 107, 255, 0.1)',
  },
  disclaimerText: {
    lineHeight: 20,
    fontSize: 13,
  },
});
