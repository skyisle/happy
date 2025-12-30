# AskUserQuestion 구현 플랜

Claude의 내장 도구 `AskUserQuestion`을 앱에서 지원하기 위한 구현 플랜입니다.

## 개요

`AskUserQuestion`은 Claude가 사용자에게 선택형 질문을 할 수 있는 내장 도구입니다.
- 권한 요청 UI 없이 자동 승인
- 채팅 내 인라인으로 질문 표시
- 사용자 응답을 Claude에게 전달
- 앱이 백그라운드일 때 로컬 알림 전송

## 도구 스키마

```typescript
{
  questions: Array<{
    question: string;           // 사용자에게 표시할 질문
    header: string;             // 짧은 라벨 (최대 12자)
    options: Array<{
      label: string;            // 선택지 텍스트 (1-5 단어)
      description?: string;     // 선택지 설명 (선택적)
    }>;                         // 2-4개 선택 옵션
    multiSelect?: boolean;      // true: 다중 선택 (체크박스), false: 단일 선택 (라디오)
  }>;                           // 1-4개 질문
}
```

---

## 구현 단계

### 1. 번역 추가

**파일**: `sources/text/_default.ts` 및 모든 번역 파일

```typescript
// common 섹션에 추가
common: {
  skip: 'Skip',
  confirm: 'Confirm',
  // ...
}

// tools.names 섹션에 추가
tools: {
  names: {
    askQuestion: 'Question',
    // ...
  },
  desc: {
    askQuestionCount: ({ count }: { count: number }) =>
      count === 1 ? '1 question' : `${count} questions`,
    // ...
  }
}

// 새 섹션 추가
askQuestion: {
  submit: 'Submit',
  answered: 'Answered',
},

notifications: {
  questionTitle: 'Question from Claude',
  questionBody: 'Claude is asking for your input',
},
```

**번역 파일**: `ca.ts`, `es.ts`, `pl.ts`, `pt.ts`, `ru.ts`, `zh-Hans.ts`

---

### 2. sessionAnswerQuestion RPC 추가

**파일**: `sources/sync/ops.ts`

```typescript
/**
 * Answer an AskUserQuestion tool call
 * This auto-approves the permission and sends the user's answers
 */
export async function sessionAnswerQuestion(
  sessionId: string,
  id: string,
  answers: Record<number, number | number[]>
): Promise<void> {
  // Approve the permission with the answers as the reason (serialized)
  const request: SessionPermissionRequest = {
    id,
    approved: true,
    reason: JSON.stringify(answers),
    decision: 'approved'
  };
  await apiSocket.sessionRPC(sessionId, 'permission', request);
}
```

---

### 3. AskUserQuestionView 컴포넌트 생성

**파일**: `sources/components/tools/views/AskUserQuestionView.tsx`

**주요 기능**:
1. `tool.permission?.status === 'pending'`일 때 질문 UI 표시
2. 단일 선택 (라디오 버튼) / 다중 선택 (체크박스) 지원
3. 모든 질문에 최소 1개 선택 필수 (Submit 버튼 활성화 조건)
4. Skip 버튼으로 거부 가능
5. 앱이 백그라운드일 때 `expo-notifications`로 로컬 알림 전송
6. 답변 완료 후 결과 표시

**컴포넌트 구조**:
```typescript
export const AskUserQuestionView = React.memo<ToolViewProps & { sessionId?: string }>(
  ({ tool, sessionId }) => {
    // 상태 관리
    const [selections, setSelections] = useState<(number | number[])[]>([...]);
    const [submitted, setSubmitted] = useState(false);

    // 백그라운드 알림
    useEffect(() => {
      if (AppState.currentState !== 'active' && tool.permission?.status === 'pending') {
        Notifications.scheduleNotificationAsync({...});
      }
    }, [tool.permission?.status]);

    // 옵션 선택 핸들러
    const handleOptionPress = useCallback((questionIndex, optionIndex) => {...}, []);

    // 제출 핸들러
    const handleSubmit = useCallback(async () => {
      await sessionAnswerQuestion(sessionId, tool.permission.id, answers);
    }, []);

    // Skip 핸들러
    const handleSkip = useCallback(async () => {
      await sessionDeny(sessionId, tool.permission.id);
    }, []);

    return (
      <View>
        {/* 질문 목록 */}
        {input.questions.map((question, index) => (
          <QuestionItem
            key={index}
            question={question}
            selection={selections[index]}
            onSelect={handleOptionPress}
          />
        ))}

        {/* 버튼 */}
        <View style={styles.buttonContainer}>
          <Button title="Skip" onPress={handleSkip} />
          <Button title="Submit" onPress={handleSubmit} disabled={!isValid} />
        </View>
      </View>
    );
  }
);
```

---

### 4. Tool Registry 등록

**파일**: `sources/components/tools/views/_all.tsx`

```typescript
import { AskUserQuestionView } from './AskUserQuestionView';

export const toolViewRegistry: Record<string, ToolViewComponent> = {
  // ... 기존 도구들
  AskUserQuestion: AskUserQuestionView as ToolViewComponent,
};
```

---

### 5. knownTools 등록

**파일**: `sources/components/tools/knownTools.tsx`

```typescript
const ICON_QUESTION = (size: number = 24, color: string = '#000') =>
  <Ionicons name="help-circle-outline" size={size} color={color} />;

export const knownTools = {
  // ... 기존 도구들

  'AskUserQuestion': {
    title: t('tools.names.askQuestion'),
    icon: ICON_QUESTION,
    noStatus: true,
    minimal: false,
    input: z.object({
      questions: z.array(z.object({
        question: z.string(),
        header: z.string().max(12),
        options: z.array(z.object({
          label: z.string(),
          description: z.string().optional(),
        })).min(2).max(4),
        multiSelect: z.boolean().optional().default(false),
      })).min(1).max(4)
    }).partial().loose(),
    extractSubtitle: (opts) => {
      // 첫 번째 질문을 부제목으로 표시
      const q = opts.tool.input?.questions?.[0]?.question;
      return q?.length > 50 ? q.substring(0, 50) + '...' : q;
    },
    extractDescription: (opts) => {
      const count = opts.tool.input?.questions?.length || 0;
      return t('tools.desc.askQuestionCount', { count });
    }
  }
};
```

---

### 6. ToolView 수정

**파일**: `sources/components/tools/ToolView.tsx`

**수정 1**: AskUserQuestionView에 sessionId 전달

```typescript
const SpecificToolView = getToolViewComponent(tool.name);
if (SpecificToolView) {
  // AskUserQuestion needs sessionId for submitting answers
  const extraProps = tool.name === 'AskUserQuestion' ? { sessionId } : {};
  return (
    <View style={styles.content}>
      <SpecificToolView
        tool={tool}
        metadata={props.metadata}
        messages={props.messages ?? []}
        {...extraProps}
      />
      {/* ... */}
    </View>
  );
}
```

**수정 2**: AskUserQuestion에 대해 PermissionFooter 숨기기

```typescript
{/* AskUserQuestion handles its own permission flow */}
{tool.permission && sessionId && tool.name !== 'AskUserQuestion' && (
  <PermissionFooter
    permission={tool.permission}
    sessionId={sessionId}
    toolName={tool.name}
    toolInput={tool.input}
    metadata={props.metadata}
  />
)}
```

---

## 플로우 다이어그램

```
Claude calls AskUserQuestion tool
        │
        ▼
Tool appears with permission.status === 'pending'
        │
        ▼
ToolView renders AskUserQuestionView (not PermissionFooter)
        │
        ├─── App in background? ──► Send local notification
        │
        ▼
User sees questions with radio/checkbox options
        │
        ├─── User taps Skip ──► sessionDeny() ──► Claude receives denial
        │
        ▼
User selects options and taps Submit
        │
        ▼
sessionAnswerQuestion(sessionId, permissionId, answers)
        │
        ▼
Claude receives JSON-encoded answers in permission.reason
```

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `sources/sync/ops.ts` | `sessionAnswerQuestion` 함수 추가 |
| `sources/components/tools/views/AskUserQuestionView.tsx` | 새 파일 생성 |
| `sources/components/tools/views/_all.tsx` | Registry에 등록 |
| `sources/components/tools/knownTools.tsx` | Tool 정의 추가 |
| `sources/components/tools/ToolView.tsx` | sessionId 전달 + PermissionFooter 숨기기 |
| `sources/text/_default.ts` | 번역 키 추가 |
| `sources/text/translations/*.ts` | 각 언어 번역 추가 (6개 파일) |

**총 12개 파일, +577줄**
