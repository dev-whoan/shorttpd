# Traffic Light (Red / Yellow / Green) 테스트 컨벤션

> 팀 내 TDD 사이클을 **신호등 색상**으로 명명한 컨벤션입니다.
> 각 단계는 반드시 순서대로 진행하며, 각 단계 완료 시 커밋을 남깁니다.

---

## 개요

```
🔴 Red  →  🟡 Yellow  →  🟢 Green
```

| 단계 | 상태 | 목표 |
|------|------|------|
| 🔴 Red | 테스트 실패 | 요구사항을 spec으로 표현 |
| 🟡 Yellow | 빌드/타입 오류 수정 | 테스트가 실행 가능한 상태 확보 |
| 🟢 Green | 테스트 통과 | 최소한의 구현으로 spec 통과 |

---

## 🔴 Red 단계

### 정의
구현 코드 없이 **spec(테스트) 파일만 작성**한 상태.
`yarn test` 실행 시 테스트가 실패해야 합니다.

### 특징
- 구현 파일이 없거나, 메서드가 비어있거나, `throw new Error('not implemented')`
- 테스트 실패 원인은 **"구현이 없어서"** 여야 함 (설정 오류, 문법 오류가 아님)
- 이 단계에서 **요구사항의 엣지 케이스**를 최대한 정의

### 권장사항
- spec은 반드시 `__analysis.md` 또는 요구사항 문서를 **먼저 작성**한 뒤 그것을 기반으로 작성
- 기존 구현 코드를 보고 spec을 작성하지 않는다 (구현 종속 테스트가 됨)
- 각 `describe` 블록 최상단에 출처 주석 작성: `// __analysis.md > 도메인 N: XXX`
- `it()` 설명은 **행동 중심**으로 작성: `"rw 권한 유저는 canUpload가 true이다"`
- 경계값, 오류 케이스, 정상 케이스를 모두 포함

### 권고사항
- Red 상태를 커밋으로 남긴다: `git commit -m "[Red] UsersService: verifyUser 실패 케이스 spec"`
- 한 번에 모든 도메인을 Red로 만들지 말고, **도메인 단위**로 Red → Green 사이클을 반복
- 외부 의존성(DB, fs, HTTP)은 mock으로 격리

### 체크리스트
- [ ] `__analysis.md`에 해당 요구사항이 명시되어 있는가?
- [ ] `yarn test`가 실패하는가? (compile error가 아닌 assertion 실패)
- [ ] spec 파일 상단에 출처 주석이 있는가?

---

## 🟡 Yellow 단계

### 정의
테스트가 **실행은 되지만 아직 통과하지 못하는** 상태.
컴파일 오류, 모듈 설정 오류, 타입 오류 등을 수정하여 테스트가 실행 가능한 상태를 만드는 단계.

### 특징
- `yarn test`가 `FAIL`은 출력하지만 `Test suite failed to run`이 아닌 상태
- 즉, assertion 실패(`expect(x).toBe(y)`)는 있어도 실행 자체는 됨
- 타입 선언, DI 설정, mock 보완 등이 주요 작업

### 권장사항
- Red 단계에서 컴파일 오류가 발생하면 Yellow를 먼저 해결한 뒤 다음 단계로
- 이 단계에서 구현 로직을 작성하지 않는다 — mock 반환값을 조정하거나 인터페이스만 선언
- 빈 메서드 stub으로 타입 오류만 해소: `deleteFile(uri: string): void {}`

### 권고사항
- Yellow는 별도 커밋 없이 Red 커밋에 포함해도 무방
- 단, 타입 수정이 실질적인 설계 변경을 포함하면 별도 커밋 권장

### 체크리스트
- [ ] `yarn test`가 `Test suite failed to run` 없이 실행되는가?
- [ ] 모든 실패가 `expect` assertion 실패인가?
- [ ] 구현 로직이 추가되지 않았는가?

---

## 🟢 Green 단계

### 정의
**모든 테스트가 통과**하는 상태.
Red에서 정의한 spec을 통과시키는 **최소한의 구현**을 작성합니다.

### 특징
- `yarn test`가 `Tests: N passed`
- `yarn build`도 성공
- 구현이 spec을 통과하는 **최소한**이어야 함 — 과도한 설계나 미래 대비 코드 금지

### 권장사항
- spec을 통과시키는 것 이상의 구현을 하지 않는다
- 리팩터링은 Green 이후 별도 단계에서 진행 (테스트가 보호망이 됨)
- Green 완료 후 커밋: `git commit -m "[Green] FilesService: deleteFile 구현"`

### 권고사항
- Green 커밋 전 반드시 `yarn test && yarn build` 동시 통과 확인
- 테스트 커버리지 측정: `yarn test --coverage`로 미커버 분기 확인 후 Yellow로 되돌아가 spec 보완
- 한 Green 커밋에 여러 도메인을 한꺼번에 포함하지 않는다

### 체크리스트
- [ ] `yarn test`가 전체 통과인가?
- [ ] `yarn build`가 성공인가?
- [ ] 구현이 spec에 없는 동작을 추가로 하고 있지 않은가?
- [ ] 새로운 public 메서드/엔드포인트가 생겼다면 spec도 추가했는가?

---

## 커밋 메시지 컨벤션

```
[Red]    <도메인>: <테스트 대상 요약>
[Yellow] <도메인>: <수정 내용 요약>     (생략 가능)
[Green]  <도메인>: <구현 내용 요약>
```

### 예시
```
[Red]    JwtStrategy: admin username DB 조회 생략 spec
[Green]  JwtStrategy: admin username 처리 구현
[Red]    FilesService: deleteFile spec
[Green]  FilesService: deleteFile 구현 + FilesController 파일 삭제 엔드포인트
```

---

## 프로세스 요약

```
1. __analysis.md에 요구사항 정의
        ↓
2. [Red] spec 작성 → yarn test FAIL 확인 → 커밋
        ↓
3. [Yellow] 실행 가능 상태로 수정 (필요 시)
        ↓
4. [Green] 최소 구현 → yarn test PASS + yarn build → 커밋
        ↓
5. 다음 도메인으로 반복
```

---

## 자주 하는 실수

| 실수 | 설명 | 대처 |
|------|------|------|
| 구현 보고 spec 작성 | 테스트가 구현에 종속됨 | `__analysis.md` 먼저 작성 |
| Red 없이 바로 구현 | TDD 사이클 깨짐 | spec 먼저, 실패 확인 후 구현 |
| Green에서 과잉 구현 | spec에 없는 동작 추가 | spec에 없으면 구현하지 않음 |
| spec에 인증 누락 | admin 경로 등 인증 엣지 케이스 미검증 | `__analysis.md`의 인증 항목 체크 |
| 컨트롤러 spec에 권한 플래그 미검증 | 뷰에 전달되는 데이터 누락 | 렌더링 데이터 전체를 spec으로 정의 |
