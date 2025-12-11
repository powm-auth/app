import {
    AnimatedEntry,
    BackgroundImage,
    Column,
    GlassCard,
    PowmIcon,
    PowmText,
    Row,
    TicketCard,
    TicketCardIcon
} from '@/components';
import { Notification, NotificationPanel } from '@/components/NotificationPanel';
import { ScannerCard } from '@/components/home/ScannerCard';
import { TicketDetailModal } from '@/components/home/TicketDetailModal';
import { getCurrentWallet } from '@/services/wallet-service';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TicketData {
    id: string;
    title: string;
    subtitle: string;
    icon: TicketCardIcon;
    modalData: {
        firstname?: string;
        lastname?: string;
        age?: string;
        country?: string;
    };
}

const AVAILABLE_TICKETS: TicketData[] = [
    {
        id: 'name-ticket',
        title: 'Name',
        subtitle: 'First and Lastname Proof',
        icon: {
            name: 'powmLogo',
            backgroundColor: 'rgba(160, 107, 255, 0.15)',
            color: powmColors.electricMain,
            size: 48,
        },
        modalData: {
            firstname: 'John',
            lastname: 'Doe',
        },
    },
    {
        id: 'age-ticket',
        title: 'Age',
        subtitle: 'Over 18 Proof',
        icon: {
            name: 'id',
            backgroundColor: 'rgba(160, 107, 255, 0.15)',
            color: powmColors.electricMain,
            size: 32,
        },
        modalData: {
            age: '24',
        }
    }
];

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const wallet = getCurrentWallet();
    const firstName = wallet?.attributes?.first_name?.value || 'User';

    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            title: 'Welcome to Powm',
            message: 'Secure your identity with our new encrypted tickets.',
            type: 'info',
            timestamp: new Date(),
            read: false,
        },
    ]);

    const [showTicketModal, setShowTicketModal] = useState(false);
    const [currentTicket, setCurrentTicket] = useState<TicketData['modalData'] | null>(null);
    const [ticketId, setTicketId] = useState('');

    const generateTicketId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = '';
        for (let i = 0; i < 15; i++) {
            if (i === 7) id += ' ';
            else id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    };

    const handleSeeTicket = (ticket: TicketData) => {
        setCurrentTicket(ticket.modalData);
        setTicketId(generateTicketId());
        setShowTicketModal(true);
    };

    const handleMarkAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    return (
        <BackgroundImage>
            <View style={styles.container}>

                <NotificationPanel
                    isOpen={isNotificationPanelOpen}
                    onClose={() => setIsNotificationPanelOpen(false)}
                    notifications={notifications}
                    onMarkAllRead={handleMarkAllRead}
                />

                <TicketDetailModal
                    visible={showTicketModal}
                    onClose={() => setShowTicketModal(false)}
                    ticket={currentTicket}
                    ticketId={ticketId}
                />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.content,
                        { paddingTop: insets.top + powmSpacing.lg },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <Row justify="space-between" align="center" style={styles.header}>
                        <PowmText variant="title">Welcome {firstName}!</PowmText>
                        <View style={{ width: 48, height: 48 }} />
                    </Row>

                    {/* 1. Scanner Card */}
                    <AnimatedEntry index={0}>
                        <View style={{ marginBottom: powmSpacing.xl }}>
                            <ScannerCard onPress={() => {
                                router.push('/scan');
                            }} />
                        </View>
                    </AnimatedEntry>

                    {/* ID Tickets Section */}
                    <Column gap={powmSpacing.sm} style={styles.ticketsSection}>
                        <AnimatedEntry index={1}>
                            <PowmText variant="subtitle" style={{ marginLeft: 4, marginBottom: 4 }}>
                                ID Tickets
                            </PowmText>
                        </AnimatedEntry>

                        {/* 2. Create an ID Ticket */}
                        <AnimatedEntry index={2}>
                            <GlassCard onPress={() => {
                                const { useRouter } = require('expo-router');
                                useRouter().push('/create-ticket');
                            }}>
                                <Row gap={16} align="center">
                                    <View style={styles.createIconContainer}>
                                        <PowmIcon name="add" size={48} color={powmColors.orangeElectricMain} />
                                    </View>
                                    <Column flex={1} gap={2}>
                                        <PowmText variant="subtitleSemiBold" style={{ fontSize: 16 }}>
                                            Create an ID Ticket
                                        </PowmText>
                                        <PowmText variant="text" color={powmColors.inactive}>
                                            Prove your identity to someone
                                        </PowmText>
                                    </Column>
                                </Row>
                            </GlassCard>
                        </AnimatedEntry>

                        {/* 3. Ticket List (Grouped in ONE Holder) */}
                        <AnimatedEntry index={3}>
                            <GlassCard padding={8}>
                                <Column gap={8}>
                                    {AVAILABLE_TICKETS.map((ticket) => (
                                        <TicketCard
                                            key={ticket.id}
                                            icon={ticket.icon}
                                            title={ticket.title}
                                            subtitle={ticket.subtitle}
                                            onPress={() => handleSeeTicket(ticket)}
                                            style={{ padding: 16, width: '100%' }}
                                        />
                                    ))}
                                </Column>
                            </GlassCard>
                        </AnimatedEntry>
                    </Column>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Bell Button */}
                <Pressable
                    style={[styles.bellButton, { top: insets.top + powmSpacing.lg }]}
                    onPress={() => setIsNotificationPanelOpen(true)}
                >
                    <PowmIcon name="bell" size={24} color={powmColors.white} />
                    {notifications.some((n) => !n.read) && (
                        <View style={styles.notificationDot} />
                    )}
                </Pressable>

            </View>
        </BackgroundImage>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: powmSpacing.lg,
    },
    header: {
        marginBottom: powmSpacing.xl,
        height: 48,
    },
    bellButton: {
        position: 'absolute',
        right: powmSpacing.lg,
        width: 48,
        height: 48,
        borderRadius: powmRadii.full,
        backgroundColor: 'rgba(42, 40, 52, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    notificationDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: powmColors.orangeElectricMain,
        borderWidth: 1,
        borderColor: 'rgba(42, 40, 52, 0.8)',
    },
    ticketsSection: {
        marginBottom: powmSpacing.xxl,
    },
    createIconContainer: {
        width: 48,
        height: 48,
        borderRadius: powmRadii.full,
        backgroundColor: 'rgba(255, 154, 46, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
