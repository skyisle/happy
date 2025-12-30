import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Modal } from '@/modal';
import { Typography } from '@/constants/Typography';

export default memo(function AskQuestionDemoScreen() {
    const [lastResult, setLastResult] = React.useState<string>('No action taken yet');

    const showSingleSelect = async () => {
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
        setLastResult(result ? `Selected: ${JSON.stringify(result)}` : 'Cancelled');
    };

    const showMultiSelect = async () => {
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
        setLastResult(result ? `Selected: ${JSON.stringify(result)}` : 'Cancelled');
    };

    const showMultipleQuestions = async () => {
        const result = await Modal.askQuestion([
            {
                question: 'What is your preferred programming paradigm?',
                header: 'Paradigm',
                options: [
                    { label: 'Functional', description: 'Immutable data, pure functions' },
                    { label: 'Object-Oriented', description: 'Classes and inheritance' },
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
        setLastResult(result ? `Selected: ${JSON.stringify(result)}` : 'Cancelled');
    };

    const showMaxQuestions = async () => {
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
        setLastResult(result ? `Selected: ${JSON.stringify(result)}` : 'Cancelled');
    };

    const showKoreanTest = async () => {
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
        setLastResult(result ? `선택됨: ${JSON.stringify(result)}` : '취소됨');
    };

    return (
        <ScrollView style={styles.container} testID="ask-question-demo">
            <View style={styles.header}>
                <Text style={[styles.title, Typography.default('semiBold')]}>AskUserQuestion Demo</Text>
                <Text style={[styles.subtitle, Typography.default()]}>
                    Test the AskUserQuestion modal
                </Text>
            </View>

            <ItemList>
                <ItemGroup title="Single Question">
                    <Item
                        title="Single Select (Radio)"
                        subtitle="One question with 3 options"
                        onPress={showSingleSelect}
                        testID="btn-single-select"
                    />
                    <Item
                        title="Multi Select (Checkbox)"
                        subtitle="One question with 4 options"
                        onPress={showMultiSelect}
                        testID="btn-multi-select"
                    />
                </ItemGroup>

                <ItemGroup title="Multiple Questions">
                    <Item
                        title="Two Questions"
                        subtitle="Single select + Multi select"
                        onPress={showMultipleQuestions}
                        testID="btn-multiple-questions"
                    />
                    <Item
                        title="Maximum Questions (4)"
                        subtitle="Four questions with various options"
                        onPress={showMaxQuestions}
                        testID="btn-max-questions"
                    />
                </ItemGroup>

                <ItemGroup title="Language Test">
                    <Item
                        title="Korean Language"
                        subtitle="한국어 UI 테스트"
                        onPress={showKoreanTest}
                        testID="btn-korean"
                    />
                </ItemGroup>

                <ItemGroup title="Last Result">
                    <View style={styles.resultContainer}>
                        <Text style={[styles.resultText, Typography.mono()]} testID="result-text">
                            {lastResult}
                        </Text>
                    </View>
                </ItemGroup>
            </ItemList>
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7'
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5E7'
    },
    title: {
        fontSize: 24,
        marginBottom: 4
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93'
    },
    resultContainer: {
        padding: 16,
        backgroundColor: '#fff'
    },
    resultText: {
        fontSize: 14,
        color: '#007AFF'
    },
});
