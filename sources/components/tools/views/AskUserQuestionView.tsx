import * as React from 'react';
import { View, Text, TouchableOpacity, AppState } from 'react-native';
import { StyleSheet, useStyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { ToolViewPropsWithSession } from './_all';
import { ToolSectionView } from '../ToolSectionView';
import { sessionAnswerQuestion } from '@/sync/ops';
import { useHappyAction } from '@/hooks/useHappyAction';
import { t } from '@/text';
import * as z from 'zod';

// Schema for the AskUserQuestion tool input
const questionOptionSchema = z.object({
    label: z.string(),
    description: z.string().optional(),
});

const questionSchema = z.object({
    question: z.string(),
    header: z.string().max(12).optional(),
    options: z.array(questionOptionSchema).min(2).max(4),
    multiSelect: z.boolean().optional().default(false),
});

const askUserQuestionInputSchema = z.object({
    questions: z.array(questionSchema).min(1).max(3),
});

type QuestionOption = z.infer<typeof questionOptionSchema>;
type Question = z.infer<typeof questionSchema>;

interface AnswerState {
    [questionIndex: number]: number[]; // Array of selected option indices
}

export const AskUserQuestionView = React.memo<ToolViewPropsWithSession>(({ tool, sessionId }) => {
    const { styles, theme } = useStyles(stylesheet);
    const [answers, setAnswers] = React.useState<AnswerState>({});
    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const notificationShownRef = React.useRef(false);

    // Parse the tool input
    const parsed = askUserQuestionInputSchema.safeParse(tool.input);
    const questions = parsed.success ? parsed.data.questions : [];

    // Check if the tool is still pending (waiting for answers)
    const isPending = tool.permission?.status === 'pending' || tool.state === 'running';

    // Show notification when app goes to background and question is pending
    React.useEffect(() => {
        if (!isPending || isSubmitted || notificationShownRef.current) return;

        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (nextAppState === 'background' && !notificationShownRef.current) {
                notificationShownRef.current = true;
                try {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: t('notifications.questionTitle'),
                            body: t('notifications.questionBody'),
                        },
                        trigger: null, // Immediate notification
                    });
                } catch (error) {
                    console.warn('Failed to send notification:', error);
                }
            }
        });

        return () => {
            subscription.remove();
        };
    }, [isPending, isSubmitted]);

    // Handle option selection
    const handleOptionSelect = React.useCallback((questionIndex: number, optionIndex: number, multiSelect: boolean) => {
        setAnswers(prev => {
            const currentSelections = prev[questionIndex] || [];

            if (multiSelect) {
                // Toggle the option in multi-select mode
                if (currentSelections.includes(optionIndex)) {
                    return {
                        ...prev,
                        [questionIndex]: currentSelections.filter(i => i !== optionIndex)
                    };
                } else {
                    return {
                        ...prev,
                        [questionIndex]: [...currentSelections, optionIndex]
                    };
                }
            } else {
                // Single select - replace the selection
                return {
                    ...prev,
                    [questionIndex]: [optionIndex]
                };
            }
        });
    }, []);

    // Submit action
    const submitAction = React.useCallback(async () => {
        if (!sessionId || !tool.id) return;

        const answerPayload = questions.map((_, qIndex) => ({
            questionIndex: qIndex,
            selectedOptions: answers[qIndex] || []
        }));

        const response = await sessionAnswerQuestion(sessionId, tool.id, answerPayload);
        if (response.success) {
            setIsSubmitted(true);
        } else {
            throw new Error(response.error || 'Failed to submit answers');
        }
    }, [sessionId, tool.id, questions, answers]);

    const [isSubmitting, doSubmit] = useHappyAction(submitAction);

    // Check if all questions have at least one answer
    const canSubmit = React.useMemo(() => {
        return questions.every((_, index) => {
            const selectedOptions = answers[index] || [];
            return selectedOptions.length > 0;
        });
    }, [questions, answers]);

    // If no questions or parsing failed, return null
    if (questions.length === 0) {
        return null;
    }

    // If already submitted or completed, show "Answered" state
    if (isSubmitted || tool.state === 'completed') {
        return (
            <ToolSectionView>
                <View style={styles.answeredContainer}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                    <Text style={styles.answeredText}>{t('askQuestion.answered')}</Text>
                </View>
            </ToolSectionView>
        );
    }

    return (
        <ToolSectionView>
            <View style={styles.container}>
                {questions.map((question, qIndex) => (
                    <View key={qIndex} style={styles.questionContainer}>
                        {question.header && (
                            <Text style={styles.questionHeader}>{question.header}</Text>
                        )}
                        <Text style={styles.questionText}>{question.question}</Text>

                        <View style={styles.optionsContainer}>
                            {question.options.map((option, oIndex) => {
                                const isSelected = (answers[qIndex] || []).includes(oIndex);
                                const IconComponent = question.multiSelect
                                    ? (isSelected ? 'checkbox' : 'square-outline')
                                    : (isSelected ? 'radio-button-on' : 'radio-button-off');

                                return (
                                    <TouchableOpacity
                                        key={oIndex}
                                        style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                                        onPress={() => handleOptionSelect(qIndex, oIndex, question.multiSelect || false)}
                                        activeOpacity={0.7}
                                        disabled={!isPending}
                                    >
                                        <View style={styles.optionContent}>
                                            <Ionicons
                                                name={IconComponent}
                                                size={22}
                                                color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                                            />
                                            <View style={styles.optionTextContainer}>
                                                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                                                    {option.label}
                                                </Text>
                                                {option.description && (
                                                    <Text style={styles.optionDescription}>{option.description}</Text>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}

                {isPending && (
                    <TouchableOpacity
                        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                        onPress={doSubmit}
                        disabled={!canSubmit || isSubmitting}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.submitButtonText, !canSubmit && styles.submitButtonTextDisabled]}>
                            {isSubmitting ? t('common.loading') : t('askQuestion.submit')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </ToolSectionView>
    );
});

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        gap: 16,
    },
    questionContainer: {
        gap: 8,
    },
    questionHeader: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    questionText: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.text,
        lineHeight: 22,
    },
    optionsContainer: {
        gap: 8,
        marginTop: 4,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    optionButtonSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        flex: 1,
    },
    optionTextContainer: {
        flex: 1,
        gap: 2,
    },
    optionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text,
    },
    optionLabelSelected: {
        color: theme.colors.primary,
    },
    optionDescription: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        lineHeight: 18,
    },
    submitButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        backgroundColor: theme.colors.surfaceHigh,
    },
    submitButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    submitButtonTextDisabled: {
        color: theme.colors.textSecondary,
    },
    answeredContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    answeredText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.success,
    },
}));
