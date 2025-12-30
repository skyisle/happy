import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { BaseModal } from './BaseModal';
import { AskUserQuestionModalConfig, AskUserQuestionResult } from '../types';
import { Typography } from '@/constants/Typography';
import { StyleSheet } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/text';

interface AskUserQuestionModalProps {
    config: AskUserQuestionModalConfig;
    onClose: () => void;
    onConfirm: (result: AskUserQuestionResult) => void;
}

export function AskUserQuestionModal({ config, onClose, onConfirm }: AskUserQuestionModalProps) {
    const { theme } = useUnistyles();

    // Initialize state for each question
    // For single select: number (selected index) or -1 (none selected)
    // For multi select: number[] (selected indices)
    const [selections, setSelections] = useState<(number | number[])[]>(() =>
        config.questions.map(q => q.multiSelect ? [] : -1)
    );

    const handleOptionPress = useCallback((questionIndex: number, optionIndex: number) => {
        setSelections(prev => {
            const newSelections = [...prev];
            const question = config.questions[questionIndex];

            if (question.multiSelect) {
                // Multi-select: toggle the option
                const currentSelection = newSelections[questionIndex] as number[];
                if (currentSelection.includes(optionIndex)) {
                    newSelections[questionIndex] = currentSelection.filter(i => i !== optionIndex);
                } else {
                    newSelections[questionIndex] = [...currentSelection, optionIndex];
                }
            } else {
                // Single-select: set the option
                newSelections[questionIndex] = optionIndex;
            }

            return newSelections;
        });
    }, [config.questions]);

    const handleConfirm = useCallback(() => {
        const result: AskUserQuestionResult = {};
        selections.forEach((selection, index) => {
            result[index] = selection;
        });
        onConfirm(result);
    }, [selections, onConfirm]);

    // Check if all questions have at least one selection
    const isValid = selections.every((selection, index) => {
        const question = config.questions[index];
        if (question.multiSelect) {
            return (selection as number[]).length > 0;
        }
        return selection !== -1;
    });

    const styles = StyleSheet.create({
        container: {
            backgroundColor: theme.colors.surface,
            borderRadius: 14,
            width: Platform.select({ web: 400, default: 320 }),
            maxWidth: '90%',
            maxHeight: '80%',
            overflow: 'hidden',
            shadowColor: theme.colors.shadow.color,
            shadowOffset: {
                width: 0,
                height: 2
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5
        },
        scrollView: {
            maxHeight: 500,
        },
        scrollContent: {
            paddingVertical: 4,
        },
        questionContainer: {
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        questionDivider: {
            height: 1,
            backgroundColor: theme.colors.divider,
            marginHorizontal: 16,
        },
        header: {
            fontSize: 11,
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 6,
            ...Typography.default('semiBold'),
        },
        question: {
            fontSize: 15,
            color: theme.colors.text,
            marginBottom: 12,
            lineHeight: 20,
            ...Typography.default('semiBold'),
        },
        optionsContainer: {
            gap: 8,
        },
        option: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.colors.divider,
            backgroundColor: theme.colors.surface,
        },
        optionSelected: {
            borderColor: theme.colors.radio.active,
            backgroundColor: theme.dark ? 'rgba(10, 132, 255, 0.1)' : 'rgba(0, 122, 255, 0.08)',
        },
        optionPressed: {
            backgroundColor: theme.colors.surfacePressed,
        },
        radioButton: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            marginTop: 1,
        },
        radioButtonActive: {
            borderColor: theme.colors.radio.active,
        },
        radioButtonInactive: {
            borderColor: theme.colors.radio.inactive,
        },
        radioButtonDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.radio.dot,
        },
        checkbox: {
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 2,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            marginTop: 1,
        },
        checkboxActive: {
            borderColor: theme.colors.radio.active,
            backgroundColor: theme.colors.radio.active,
        },
        checkboxInactive: {
            borderColor: theme.colors.radio.inactive,
        },
        optionContent: {
            flex: 1,
        },
        optionLabel: {
            fontSize: 15,
            color: theme.colors.text,
            ...Typography.default('regular'),
        },
        optionDescription: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            marginTop: 2,
            lineHeight: 18,
            ...Typography.default('regular'),
        },
        buttonContainer: {
            borderTopWidth: 1,
            borderTopColor: theme.colors.divider,
            flexDirection: 'row',
        },
        button: {
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },
        buttonPressed: {
            backgroundColor: theme.colors.divider,
        },
        buttonSeparator: {
            width: 1,
            backgroundColor: theme.colors.divider,
        },
        buttonText: {
            fontSize: 17,
            color: theme.colors.textLink,
            ...Typography.default('semiBold'),
        },
        cancelText: {
            ...Typography.default('regular'),
        },
        buttonDisabled: {
            opacity: 0.4,
        },
    });

    const renderOption = (
        questionIndex: number,
        optionIndex: number,
        option: { label: string; description?: string },
        isSelected: boolean,
        isMultiSelect: boolean
    ) => {
        return (
            <Pressable
                key={optionIndex}
                onPress={() => handleOptionPress(questionIndex, optionIndex)}
                style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    pressed && styles.optionPressed,
                ]}
            >
                {isMultiSelect ? (
                    <View style={[
                        styles.checkbox,
                        isSelected ? styles.checkboxActive : styles.checkboxInactive,
                    ]}>
                        {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                    </View>
                ) : (
                    <View style={[
                        styles.radioButton,
                        isSelected ? styles.radioButtonActive : styles.radioButtonInactive,
                    ]}>
                        {isSelected && <View style={styles.radioButtonDot} />}
                    </View>
                )}
                <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    {option.description && (
                        <Text style={styles.optionDescription}>{option.description}</Text>
                    )}
                </View>
            </Pressable>
        );
    };

    return (
        <BaseModal visible={true} onClose={onClose} closeOnBackdrop={false}>
            <View style={styles.container}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {config.questions.map((question, questionIndex) => {
                        const currentSelection = selections[questionIndex];
                        const isMultiSelect = question.multiSelect ?? false;

                        return (
                            <React.Fragment key={questionIndex}>
                                {questionIndex > 0 && <View style={styles.questionDivider} />}
                                <View style={styles.questionContainer}>
                                    <Text style={styles.header}>{question.header}</Text>
                                    <Text style={styles.question}>{question.question}</Text>
                                    <View style={styles.optionsContainer}>
                                        {question.options.map((option, optionIndex) => {
                                            const isSelected = isMultiSelect
                                                ? (currentSelection as number[]).includes(optionIndex)
                                                : currentSelection === optionIndex;

                                            return renderOption(
                                                questionIndex,
                                                optionIndex,
                                                option,
                                                isSelected,
                                                isMultiSelect
                                            );
                                        })}
                                    </View>
                                </View>
                            </React.Fragment>
                        );
                    })}
                </ScrollView>

                <View style={styles.buttonContainer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={onClose}
                    >
                        <Text style={[styles.buttonText, styles.cancelText]}>
                            {t('common.cancel')}
                        </Text>
                    </Pressable>
                    <View style={styles.buttonSeparator} />
                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            pressed && isValid && styles.buttonPressed,
                            !isValid && styles.buttonDisabled,
                        ]}
                        onPress={handleConfirm}
                        disabled={!isValid}
                    >
                        <Text style={styles.buttonText}>
                            {t('common.confirm')}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </BaseModal>
    );
}
