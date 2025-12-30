import * as React from 'react';
import { View, Text, Pressable, Platform, AppState } from 'react-native';
import { StyleSheet } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { ToolViewProps } from './_all';
import { Typography } from '@/constants/Typography';
import { sessionAnswerQuestion, sessionDeny } from '@/sync/ops';
import { t } from '@/text';
import * as Notifications from 'expo-notifications';

interface AskUserQuestionOption {
    label: string;
    description?: string;
}

interface AskUserQuestionInput {
    questions: Array<{
        question: string;
        header: string;
        options: AskUserQuestionOption[];
        multiSelect?: boolean;
    }>;
}

/**
 * AskUserQuestionView - Handles Claude's AskUserQuestion tool
 *
 * This tool is auto-approved and shows a UI for the user to answer questions.
 * When the user submits their answers, the response is sent back to Claude.
 * If the app is in the background, a local notification is sent.
 */
export const AskUserQuestionView = React.memo<ToolViewProps & { sessionId?: string }>(({ tool, sessionId }) => {
    const { theme } = useUnistyles();
    const input = tool.input as AskUserQuestionInput | undefined;

    // Track if notification was sent
    const notificationSentRef = React.useRef(false);

    // Initialize selections state
    const [selections, setSelections] = React.useState<(number | number[])[]>(() => {
        if (!input?.questions) return [];
        return input.questions.map(q => q.multiSelect ? [] : -1);
    });

    const [submitted, setSubmitted] = React.useState(false);

    // Send local notification if app is in background
    React.useEffect(() => {
        if (Platform.OS === 'web' || notificationSentRef.current) return;
        if (tool.permission?.status !== 'pending') return;

        const appState = AppState.currentState;
        if (appState !== 'active') {
            notificationSentRef.current = true;
            Notifications.scheduleNotificationAsync({
                content: {
                    title: t('notifications.questionTitle'),
                    body: input?.questions?.[0]?.question || t('notifications.questionBody'),
                    data: { sessionId, permissionId: tool.permission?.id },
                },
                trigger: null, // Immediate
            });
        }
    }, [tool.permission?.status, input?.questions, sessionId, tool.permission?.id]);

    const handleOptionPress = React.useCallback((questionIndex: number, optionIndex: number) => {
        if (submitted) return;

        setSelections(prev => {
            const newSelections = [...prev];
            const question = input?.questions?.[questionIndex];
            if (!question) return prev;

            if (question.multiSelect) {
                const currentSelection = newSelections[questionIndex] as number[];
                if (currentSelection.includes(optionIndex)) {
                    newSelections[questionIndex] = currentSelection.filter(i => i !== optionIndex);
                } else {
                    newSelections[questionIndex] = [...currentSelection, optionIndex];
                }
            } else {
                newSelections[questionIndex] = optionIndex;
            }

            return newSelections;
        });
    }, [input?.questions, submitted]);

    const handleSubmit = React.useCallback(async () => {
        if (!sessionId || !tool.permission?.id || submitted) return;

        const answers: Record<number, number | number[]> = {};
        selections.forEach((selection, index) => {
            answers[index] = selection;
        });

        setSubmitted(true);
        await sessionAnswerQuestion(sessionId, tool.permission.id, answers);
    }, [sessionId, tool.permission?.id, selections, submitted]);

    const handleSkip = React.useCallback(async () => {
        if (!sessionId || !tool.permission?.id || submitted) return;
        setSubmitted(true);
        await sessionDeny(sessionId, tool.permission.id, undefined, undefined, 'denied');
    }, [sessionId, tool.permission?.id, submitted]);

    // Check if all questions have at least one selection
    const isValid = React.useMemo(() => {
        if (!input?.questions) return false;
        return selections.every((selection, index) => {
            const question = input.questions[index];
            if (question?.multiSelect) {
                return (selection as number[]).length > 0;
            }
            return selection !== -1;
        });
    }, [selections, input?.questions]);

    // Don't show UI if permission is not pending or already answered
    if (tool.permission?.status !== 'pending' || submitted) {
        if (tool.permission?.status === 'approved' && tool.permission?.reason) {
            // Show submitted answers
            try {
                const answers = JSON.parse(tool.permission.reason) as Record<number, number | number[]>;
                return (
                    <View style={styles.answeredContainer}>
                        <Text style={styles.answeredTitle}>{t('askQuestion.answered')}</Text>
                        {input?.questions?.map((question, qIndex) => {
                            const answer = answers[qIndex];
                            const selectedLabels = question.multiSelect
                                ? (answer as number[]).map(i => question.options[i]?.label).join(', ')
                                : question.options[answer as number]?.label;
                            return (
                                <View key={qIndex} style={styles.answeredItem}>
                                    <Text style={styles.answeredHeader}>{question.header}</Text>
                                    <Text style={styles.answeredValue}>{selectedLabels}</Text>
                                </View>
                            );
                        })}
                    </View>
                );
            } catch {
                return null;
            }
        }
        return null;
    }

    if (!input?.questions || input.questions.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            {input.questions.map((question, questionIndex) => {
                const currentSelection = selections[questionIndex];
                const isMultiSelect = question.multiSelect ?? false;

                return (
                    <View key={questionIndex} style={styles.questionContainer}>
                        {questionIndex > 0 && <View style={styles.questionDivider} />}
                        <Text style={styles.header}>{question.header}</Text>
                        <Text style={styles.question}>{question.question}</Text>
                        <View style={styles.optionsContainer}>
                            {question.options.map((option, optionIndex) => {
                                const isSelected = isMultiSelect
                                    ? (currentSelection as number[]).includes(optionIndex)
                                    : currentSelection === optionIndex;

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
                            })}
                        </View>
                    </View>
                );
            })}

            <View style={styles.buttonContainer}>
                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        styles.skipButton,
                        pressed && styles.buttonPressed,
                    ]}
                    onPress={handleSkip}
                >
                    <Text style={styles.skipButtonText}>{t('common.skip')}</Text>
                </Pressable>
                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        styles.submitButton,
                        pressed && isValid && styles.buttonPressed,
                        !isValid && styles.buttonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!isValid}
                >
                    <Text style={[styles.submitButtonText, !isValid && styles.buttonTextDisabled]}>
                        {t('askQuestion.submit')}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
});

const styles = StyleSheet.create((theme) => ({
    container: {
        paddingBottom: 8,
    },
    questionContainer: {
        marginBottom: 12,
    },
    questionDivider: {
        height: 1,
        backgroundColor: theme.colors.divider,
        marginBottom: 12,
    },
    header: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
        ...Typography.default('semiBold'),
    },
    question: {
        fontSize: 15,
        color: theme.colors.text,
        marginBottom: 10,
        lineHeight: 20,
        ...Typography.default('semiBold'),
    },
    optionsContainer: {
        gap: 6,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
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
        width: 18,
        height: 18,
        borderRadius: 9,
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
        width: 18,
        height: 18,
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
        fontSize: 14,
        color: theme.colors.text,
        ...Typography.default('regular'),
    },
    optionDescription: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
        lineHeight: 16,
        ...Typography.default('regular'),
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipButton: {
        backgroundColor: theme.colors.surfaceHighest,
    },
    submitButton: {
        backgroundColor: theme.colors.radio.active,
    },
    buttonPressed: {
        opacity: 0.8,
    },
    buttonDisabled: {
        opacity: 0.4,
    },
    skipButtonText: {
        fontSize: 15,
        color: theme.colors.text,
        ...Typography.default('semiBold'),
    },
    submitButtonText: {
        fontSize: 15,
        color: '#FFFFFF',
        ...Typography.default('semiBold'),
    },
    buttonTextDisabled: {
        color: '#FFFFFF',
    },
    answeredContainer: {
        padding: 12,
        backgroundColor: theme.colors.surfaceHighest,
        borderRadius: 8,
    },
    answeredTitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 8,
        ...Typography.default('semiBold'),
    },
    answeredItem: {
        marginBottom: 6,
    },
    answeredHeader: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        ...Typography.default('semiBold'),
    },
    answeredValue: {
        fontSize: 14,
        color: theme.colors.text,
        ...Typography.default('regular'),
    },
}));
