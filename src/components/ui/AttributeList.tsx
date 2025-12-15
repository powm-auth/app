import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import { ANONYMOUS_ID_INFO_MESSAGE, ANONYMOUS_ID_INFO_TITLE } from '@/utils/constants';
import { getAttributeDisplayName } from '@/wallet/service';
import React from 'react';
import { Alert, TouchableOpacity, View, ViewStyle } from 'react-native';
import { PowmIcon } from './PowmIcon';
import { PowmText } from './PowmText';

export interface AttributeItem {
    key: string;
    value: string | boolean | number | null | undefined;
    isAvailable?: boolean;
}

interface AttributeListProps {
    attributes: AttributeItem[];
    style?: ViewStyle;
    showPlaceholder?: boolean;
    title?: string;
    appName?: string;
    showInfoIcon?: boolean;
}

export const AttributeList: React.FC<AttributeListProps> = ({
    attributes,
    style,
    showPlaceholder = true,
    title,
    appName = 'this app',
    showInfoIcon = false
}) => {
    return (
        <View style={style}>
            {title && (
                <PowmText variant="subtitle" align="center" style={{ fontSize: 20, marginBottom: powmSpacing.xxl }}>
                    {title}
                </PowmText>
            )}
            <View style={{ gap: powmSpacing.sm }}>
                {attributes.map((item) => {
                    const hasValue = item.isAvailable !== false && item.value !== null && item.value !== undefined && item.value !== '';

                    let displayValue: string;

                    if (item.key === 'anonymous_id' && (!item.value || item.value === '')) {
                        displayValue = 'Generated ID';
                    } else if (typeof item.value === 'boolean') {
                        displayValue = item.value ? 'Yes' : 'No';
                    } else if (hasValue) {
                        displayValue = String(item.value);
                    } else {
                        displayValue = 'Not available';
                    }

                    return (
                        <View key={item.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <PowmText variant="text" color={powmColors.gray} style={{ flex: 1 }}>
                                {getAttributeDisplayName(item.key)}
                            </PowmText>
                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <PowmText
                                    variant="text"
                                    color={(hasValue || displayValue === 'Generated ID') ? powmColors.electricMain : powmColors.inactive}
                                    style={{ textAlign: 'right', opacity: (hasValue || displayValue === 'Generated ID') ? 1 : 0.6, flexShrink: 1 }}
                                    numberOfLines={1}
                                >
                                    {displayValue}
                                </PowmText>
                                {displayValue === 'Generated ID' && showInfoIcon && (
                                    <TouchableOpacity
                                        onPress={() => Alert.alert(
                                            'Anonymous ID',
                                            `This ID is unique to the relationship between you and ${appName}, meaning they cannot track you across other services.\n\nYou can always reset your Anonymous ID in the settings.`,
                                            [
                                                { text: 'OK', style: 'cancel' },
                                                {
                                                    text: 'Learn More',
                                                    onPress: () => Alert.alert(ANONYMOUS_ID_INFO_TITLE, ANONYMOUS_ID_INFO_MESSAGE)
                                                }
                                            ]
                                        )}
                                        style={{ marginLeft: powmSpacing.xs }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <PowmIcon name="info" size={18} color={powmColors.electricMain} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};
