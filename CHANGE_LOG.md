# CHANGE LOG

## 0.0.5

### Security
- 패스워드 평문 로깅 제거
- 인증 없이 접근 가능하던 유저 삭제·회원가입 API 보호
- 파일 업로드 경로 탐색(Path Traversal) 취약점 차단
- 빈 catch 블록 제거로 에러 묵살 방지

### Features
- **프로필 페이지** 추가 (`GET /users/profile`) — 로그인한 사용자가 본인의 권한 확인 및 비밀번호 변경 가능
  - 권한 목록 배지 색상 구분 (`r` 회색 / `rw` 파란색 / `rwd` 주황색)
  - 현재 비밀번호 확인 후 변경 (`PATCH /users/password`)
- **파일 업로드** 기능 추가 — 권한이 있는 사용자가 현재 디렉토리에 파일 업로드 가능
- **파일 업로드 Progress Bar** — 전체 바이트 기준 실시간 진행률 표시
- **최대 업로드 용량 설정** — `UPLOAD_MAX_SIZE_MB` 환경변수로 제한 가능 (기본 512MB)
- **파일 크기 자동 포맷** — `B` / `KB` / `MB` / `GB` 단위 자동 변환
- **권한 시스템** 도입 — 사용자별·디렉토리별 `r` / `rw` / `rwd` 3단계 권한 분리
  - `r`: 읽기 전용
  - `rw`: 읽기 + 파일 업로드 + 폴더 생성
  - `rwd`: 읽기 + 파일 업로드 + 폴더 생성 + 빈 폴더 삭제
  - 최장 접두사 매칭(longest-prefix match) 방식으로 경로 해석
  - `*` 와일드카드로 전체 경로 기본값 설정 가능
- **폴더 생성** 기능 추가 — `rw` 이상 권한 보유 시 현재 디렉토리에 폴더 생성 가능
- **폴더 삭제** 기능 추가 — `rwd` 권한 보유 시 비어있는 폴더 삭제 가능
- **유저 수정** 기능 추가 — 어드민 페이지에서 비밀번호 변경 및 권한 수정 가능
- **어드민 JWT 발급** — Basic Auth 통과 시 JWT 쿠키 자동 발급으로 API 인증 통합

### Bug Fixes
- `GET /admin` 이후 `POST /users/signup`, `DELETE /users` 호출 시 302 redirect 문제 해결
- `ConfigModule.forRoot({ isGlobal: true })` 적용으로 모든 모듈에서 `ConfigService` 별도 import 불필요
- `SuccessInterceptor`가 `@Render()` 핸들러 응답을 감싸 템플릿 데이터가 누락되던 문제 해결
- 어드민 계정이 DB에 없어 `JwtStrategy.validate()` 실패하던 문제 해결

### Architecture
- `AuthService`가 JWT 서명 책임을 직접 담당하도록 역할 분리
- `AuthModule` ↔ `UsersModule` 순환 의존성을 `forwardRef()`로 해결
- `JwtModule.register` → `JwtModule.registerAsync` + `ConfigService` 전환 (앱 로드 시점 env 누락 방지)
- 미사용 `AppController` / `AppService` 제거
- `JwtPayload` class → interface 변환
- `PATCH /users` 엔드포인트 추가 (어드민 유저 수정)
- `PATCH /users/password` 엔드포인트 추가 (사용자 본인 비밀번호 변경)
- `GET /users/profile` 엔드포인트 추가 (프로필 페이지 렌더링)
- `PUT *` 엔드포인트 추가 (폴더 생성)
- `DELETE *` 엔드포인트 추가 (폴더 삭제)
- `PermissionGuard` — POST / PUT / DELETE 메서드별 권한 분기, 어드민 계정 우회 처리
- `permission.types.ts` — `canRead` / `canWrite` / `canDelete` 헬퍼 함수 추가
- 파일 업로드 응답 redirect → JSON(`{ success: true }`)으로 변경

### Code Quality
- `strictNullChecks`, `noImplicitAny` 등 TypeScript strict 옵션 활성화
- `XMLHttpRequest` → `fetch` 기반 HTTP 유틸리티로 교체 (업로드는 progress 지원을 위해 XHR 유지)
- 불필요한 `async/await` 제거 (단순 위임 메서드)
- `getAllUser` → `getAllUsers` 오타·복수형 통일
- `boostrap` → `bootstrap` 오타 수정

### Dependencies
- NestJS `^9` → `^10`
- TypeScript `^4` → `^5`
- `tsconfig` target `ES2017` → `ES2021`
- 미사용 패키지(`mysql2`, `path`) 제거
- npm → **yarn** 마이그레이션

### UI/UX
- 전체 UI **Tailwind CSS** 기반으로 재설계 (CDN 방식)
- 기존 커스텀 CSS 파일 전체 제거 (`header.css`, `body.css`, `footer.css`, `admin.css`, `login.css`)
- 파일 브라우저(`index`) — 반응형 그리드 테이블, 업로드 영역 및 Progress Bar 통합
- 로그인 페이지 — 카드 레이아웃, Enter 키 제출 지원
- 어드민 페이지 — 사용자 목록 테이블, 추가/수정/삭제 모달 다이얼로그
- 어드민 Edit User 모달에 권한 레벨 설명 추가 (`r` / `rw` / `rwd`)
- 파일 브라우저에 폴더 생성 입력란 추가
- `rwd` 권한 보유 시 파일 목록에 폴더 삭제 버튼 표시
- 파일 브라우저 헤더에 Profile 버튼 추가 (로그인 시)
- 프로필 페이지 신규 추가 — 권한 확인 및 비밀번호 변경
