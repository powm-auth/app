import { powmStyles } from '@/theme/powm-styles';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { getAttributeDisplayName, sortAttributeKeys } from '@/wallet/service';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button } from '../ui/Button';
import { Column } from '../ui/Column';
import { GlassCard } from '../ui/GlassCard';
import { PowmIcon } from '../ui/PowmIcon';
import { PowmText } from '../ui/PowmText';
import { Row } from '../ui/Row';
import { ActivityItem } from './HistoryItem';

interface HistoryDetailModalProps {
    visible: boolean;
    item: ActivityItem | null;
    onClose: () => void;
    onDelete?: (id: string) => void;
}

export const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({
    visible,
    item,
    onClose,
    onDelete,
}) => {
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (visible) {
            setShowAll(false);
        }
    }, [visible, item]);

    if (!item) return null;

    const isRejected = item.result === 'rejected';
    const statusText = isRejected ? 'Rejected' : 'Completed';
    const statusIcon = isRejected ? 'cross' : 'check';
    const statusColor = isRejected ? powmColors.deletionRedMain : powmColors.successGreen;
    const dataLabel = isRejected ? 'REQUESTED DATA' : 'SHARED DATA';
    const dataIcon = isRejected ? 'help' : 'check';

    const sortedAttributes = useMemo(() => {
        return sortAttributeKeys(item.attributes_requested);
    }, [item.attributes_requested]);

    const displayedAttributes = showAll ? sortedAttributes : sortedAttributes.slice(0, 3);
    const hasMore = sortedAttributes.length > 3;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={powmStyles.modalOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <GlassCard style={[powmStyles.modalContent, { maxHeight: '80%' }]}>
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: powmSpacing.md }}
                        showsVerticalScrollIndicator={false}
                    >
                        <Column gap={powmSpacing.lg} align="center">

                            {/* Header Icon */}
                            <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '20' }]}>
                                <PowmIcon
                                    name={item.type === 'anonymous' ? 'face' : 'powmLogo'}
                                    size={40}
                                    color={item.iconColor}
                                />
                            </View>

                            {/* Title & Status */}
                            <Column gap={4} align="center">
                                <PowmText variant="title" align="center" style={{ fontSize: 24 }}>
                                    {item.name}
                                </PowmText>
                                <View style={{
                                    backgroundColor: statusColor + '20',
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 100,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6
                                }}>
                                    <PowmIcon name={statusIcon} size={14} color={statusColor} />
                                    <PowmText variant="subtitle" color={statusColor} style={{ fontSize: 14 }}>
                                        {statusText}
                                    </PowmText>
                                </View>
                                <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 14, marginTop: 4 }}>
                                    {item.dateLabel === 'Today' || item.dateLabel === 'Yesterday' ? item.dateLabel : ''} at {item.time}
                                </PowmText>
                            </Column>

                            <View style={styles.divider} />

                            {/* Attributes List */}
                            <Column gap={powmSpacing.sm} style={{ width: '100%' }}>
                                <PowmText variant="subtitleSemiBold" color={powmColors.gray} style={{ fontSize: 14, marginBottom: 4 }}>
                                    {dataLabel}
                                </PowmText>

                                {displayedAttributes.map((attr, index) => (
                                    <Row key={attr} style={styles.attributeRow} align="center">
                                        <PowmIcon name={dataIcon} size={isRejected ? 28 : 20} color={isRejected ? powmColors.inactive : powmColors.successGreen} />
                                        <PowmText variant="text" style={{ fontSize: 16 }}>
                                            {getAttributeDisplayName(attr)}
                                        </PowmText>
                                    </Row>
                                ))}

                                {hasMore && (
                                    <TouchableOpacity
                                        onPress={() => setShowAll(!showAll)}
                                        style={styles.showMoreButton}
                                    >
                                        <PowmText variant="subtitle" color={powmColors.electricMain} style={{ fontSize: 14 }}>
                                            {showAll ? 'Show Less' : `Show ${sortedAttributes.length - 3} More`}
                                        </PowmText>
                                        <PowmIcon
                                            name="chevron"
                                            size={16}
                                            color={powmColors.electricMain}
                                            style={{ transform: [{ rotate: showAll ? '180deg' : '90deg' }] }}
                                        />
                                    </TouchableOpacity>
                                )}
                            </Column>

                            <View style={{ height: powmSpacing.md }} />

                            <Button
                                title="Close"
                                variant="secondary"
                                onPress={onClose}
                                style={{ width: '100%' }}
                            />

                            {onDelete && (
                                <TouchableOpacity
                                    onPress={() => onDelete(item.id)}
                                    style={{ padding: powmSpacing.sm }}
                                >
                                    <PowmText variant="text" color={powmColors.deletionRedMain} style={{ fontSize: 14 }}>
                                        Delete from history
                                    </PowmText>
                                </TouchableOpacity>
                            )}

                        </Column>
                    </ScrollView>
                </GlassCard>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: powmSpacing.xs,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    divider: {
        height: 1,
        backgroundColor: powmColors.glass.border,
        width: '100%',
        opacity: 0.3,
    },
    attributeRow: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: powmSpacing.md,
        borderRadius: powmRadii.md,
        gap: powmSpacing.md,
    },
    showMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: powmSpacing.sm,
        gap: 4,
    }
});
