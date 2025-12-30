/**
 * AskUserQuestion Demo Page
 *
 * This is a development/test page to demonstrate the AskUserQuestion modal.
 * Place this in app/(app)/dev/ to access it, or import the component directly.
 *
 * Usage: Import and call the demo functions to test different scenarios.
 */

import React, { memo } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { StyleSheet } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import { Modal } from '@/modal';
import { Typography } from '@/constants/Typography';

// Demo scenarios for testing
const demoScenarios = {
    // Single question with single select
    singleQuestionSingleSelect: async () => {
        const result = await Modal.askQuestion([
            {
                question: 'Which implementation approach would you prefer?',
                header: 'Approach',
                options: [
                    { label: 'Option A', description: 'Use existing library for faster development' },
                    { label: 'Option B', description: 'Build custom solution for more control' },
                    { label: 'Option C', description: 'Hybrid approach combining both' },
                ],
                multiSelect: false,
            },
        ]);
        console.log('Result:', result);
        return result;
    },

    // Single question with multi select
    singleQuestionMultiSelect: async () => {
        const result = await Modal.askQuestion([
            {
                question: 'Which features should be included?',
                header: 'Features',
                options: [
                    { label: 'Dark mode', description: 'Support for dark theme' },
                    { label: 'Offline mode', description: 'Work without internet' },
                    { label: 'Analytics', description: 'Track usage metrics' },
                    { label: 'Push notifications' },
                ],
                multiSelect: true,
            },
        ]);
        console.log('Result:', result);
        return result;
    },

    // Multiple questions
    multipleQuestions: async () => {
        const result = await Modal.askQuestion([
            {
                question: 'What is your preferred programming paradigm?',
                header: 'Paradigm',
                options: [
                    { label: 'Functional', description: 'Immutable data, pure functions' },
                    { label: 'Object-Oriented', description: 'Classes and inheritance' },
                    { label: 'Procedural', description: 'Step-by-step instructions' },
                ],
                multiSelect: false,
            },
            {
                question: 'Which testing frameworks do you want to use?',
                header: 'Testing',
                options: [
                    { label: 'Jest' },
                    { label: 'Vitest' },
                    { label: 'Mocha' },
                ],
                multiSelect: true,
            },
        ]);
        console.log('Result:', result);
        return result;
    },

    // Maximum questions (4)
    maxQuestions: async () => {
        const result = await Modal.askQuestion([
            {
                question: 'Select database type',
                header: 'Database',
                options: [
                    { label: 'SQL', description: 'PostgreSQL, MySQL' },
                    { label: 'NoSQL', description: 'MongoDB, Redis' },
                ],
                multiSelect: false,
            },
            {
                question: 'Select API style',
                header: 'API',
                options: [
                    { label: 'REST' },
                    { label: 'GraphQL' },
                    { label: 'gRPC' },
                ],
                multiSelect: false,
            },
            {
                question: 'Select deployment platform',
                header: 'Deploy',
                options: [
                    { label: 'AWS' },
                    { label: 'GCP' },
                    { label: 'Azure' },
                    { label: 'Self-hosted' },
                ],
                multiSelect: false,
            },
            {
                question: 'Additional options',
                header: 'Options',
                options: [
                    { label: 'CI/CD', description: 'Automated pipelines' },
                    { label: 'Monitoring', description: 'Logs and metrics' },
                    { label: 'Documentation', description: 'Auto-generated docs' },
                ],
                multiSelect: true,
            },
        ]);
        console.log('Result:', result);
        return result;
    },

    // Korean language test
    koreanTest: async () => {
        const result = await Modal.askQuestion([
            {
                question: '어떤 방식으로 구현할까요?',
                header: '구현 방식',
                options: [
                    { label: '옵션 A', description: '빠른 개발을 위해 기존 라이브러리 사용' },
                    { label: '옵션 B', description: '더 많은 제어를 위해 커스텀 솔루션 구축' },
                    { label: '옵션 C', description: '두 가지를 결합한 하이브리드 접근' },
                ],
                multiSelect: false,
            },
        ]);
        console.log('Result:', result);
        return result;
    },
};

export const AskUserQuestionDemo = memo(function AskUserQuestionDemo() {
    const { theme } = useUnistyles();

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.groupped.background,
        },
        content: {
            padding: 16,
            gap: 12,
        },
        title: {
            fontSize: 24,
            color: theme.colors.text,
            marginBottom: 8,
            ...Typography.default('semiBold'),
        },
        description: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginBottom: 16,
            lineHeight: 20,
            ...Typography.default(),
        },
        button: {
            backgroundColor: theme.colors.surface,
            padding: 16,
            borderRadius: Platform.select({ default: 12, android: 16 }),
            shadowColor: theme.colors.shadow.color,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        buttonPressed: {
            backgroundColor: theme.colors.surfacePressed,
        },
        buttonTitle: {
            fontSize: 16,
            color: theme.colors.text,
            marginBottom: 4,
            ...Typography.default('semiBold'),
        },
        buttonDescription: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            ...Typography.default(),
        },
    });

    const handlePress = async (scenarioKey: keyof typeof demoScenarios) => {
        const result = await demoScenarios[scenarioKey]();
        if (result) {
            Modal.alert('Result', JSON.stringify(result, null, 2));
        } else {
            Modal.alert('Cancelled', 'User cancelled the dialog');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>AskUserQuestion Demo</Text>
            <Text style={styles.description}>
                Test the AskUserQuestion modal with different scenarios.
                Tap a button to open the modal and see the result.
            </Text>

            <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={() => handlePress('singleQuestionSingleSelect')}
            >
                <Text style={styles.buttonTitle}>Single Select</Text>
                <Text style={styles.buttonDescription}>
                    One question with 3 options, radio button style
                </Text>
            </Pressable>

            <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={() => handlePress('singleQuestionMultiSelect')}
            >
                <Text style={styles.buttonTitle}>Multi Select</Text>
                <Text style={styles.buttonDescription}>
                    One question with 4 options, checkbox style
                </Text>
            </Pressable>

            <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={() => handlePress('multipleQuestions')}
            >
                <Text style={styles.buttonTitle}>Multiple Questions</Text>
                <Text style={styles.buttonDescription}>
                    Two questions, one single select and one multi select
                </Text>
            </Pressable>

            <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={() => handlePress('maxQuestions')}
            >
                <Text style={styles.buttonTitle}>Maximum Questions (4)</Text>
                <Text style={styles.buttonDescription}>
                    Four questions with various options
                </Text>
            </Pressable>

            <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={() => handlePress('koreanTest')}
            >
                <Text style={styles.buttonTitle}>Korean Language Test</Text>
                <Text style={styles.buttonDescription}>
                    한국어 테스트 - Korean UI test
                </Text>
            </Pressable>
        </ScrollView>
    );
});

export default AskUserQuestionDemo;
