# shorttpd 요구사항 분석

## 애플리케이션 개요

정적 파일 서버. `serve/` 디렉토리를 HTTP로 브라우징·다운로드·업로드할 수 있다.
선택적 JWT 인증(`USE_AUTH=yes`)을 통해 경로별 접근 권한을 제어한다.

---

## 도메인 1: Permission (경로 접근 권한)

### 데이터 모델
- `AccessLevel`: `'r'` | `'rw'` | `'rwd'`
  - `r` = 읽기 전용
  - `rw` = 읽기 + 쓰기(업로드)
  - `rwd` = 읽기 + 쓰기 + 삭제
- `PathPermission`: `{ path: string, access: AccessLevel }`
  - `path`가 `'*'`이면 모든 경로에 대한 fallback

### 비즈니스 규칙

#### parsePermissions(raw: string): PathPermission[]
- JSON 문자열을 파싱하여 PathPermission 배열 반환
- 파싱 실패(잘못된 JSON) → 빈 배열 반환
- 배열이 아닌 값 → 빈 배열 반환
- 각 항목에서 `path`, `access`가 string이 아닌 것 → 해당 항목 제외

#### resolveAccess(permissions, requestPath): AccessLevel | null
- 요청 경로에 대해 **가장 긴 prefix**가 일치하는 권한을 반환 (longest-prefix-match)
- `'*'` path는 prefix 매칭에서 제외, 다른 매칭이 없을 때 fallback으로 사용
- 선행 `/` 없는 경로는 정규화하여 처리 (`'docs'` → `'/docs'`)
- 아무것도 매칭되지 않으면 `null` 반환

#### canRead / canWrite / canDelete
- `canRead`: `'r'`, `'rw'`, `'rwd'` → true / `null` → false
- `canWrite`: `'rw'`, `'rwd'` → true / `'r'`, `null` → false
- `canDelete`: `'rwd'` → true / `'r'`, `'rw'`, `null` → false

---

## 도메인 2: User (사용자 관리)

### 데이터 모델 (UserEntity)
| 필드 | 타입 | 설명 |
|------|------|------|
| seq | number (PK) | 자동 증가 |
| username | string (unique) | 로그인 ID |
| password | string | bcrypt 해시 저장 |
| permission | string | PathPermission[] JSON 문자열 |

### 비즈니스 규칙

#### UsersRepository

**createUser(dto)**
- username 중복 시 → HTTP 409
- 비밀번호는 bcrypt(rounds=10) 해시 후 저장
- permissions 미전달 시 → 빈 배열 `[]`로 저장

**findByUsername(username)**
- 존재하면 UserEntity 반환
- 존재하지 않으면 `null` 반환 (예외 없음)

**getAllUsers()**
- 전체 유저 목록 반환

**deleteUser(user)**
- seq 기준으로 삭제
- 삭제 성공 시 `true` 반환

**updateUser(dto)**
- username으로 유저 조회 → 없으면 HTTP 404
- `password` 전달 시 → bcrypt 해시 후 업데이트
- `permissions` 전달 시 → JSON 문자열로 변환하여 업데이트
- 두 필드 모두 없으면 기존 값 유지

**changePassword(username, dto)**
- 유저 없으면 → HTTP 404
- 현재 비밀번호 불일치 → HTTP 400
- 신규 비밀번호 bcrypt 해시 후 저장

#### UsersService

**verifyUser(dto): UserDTO**
- username 미존재 → BadRequestException (메시지: '이메일과 비밀번호를 확인해주세요.')
- 비밀번호 불일치 → BadRequestException (동일 메시지 — 타이밍 공격 방지)
- 성공 시 `password` 필드를 제외한 UserDTO 반환

**removeUser(username)**
- 유저 없으면 → HTTP 400
- 존재하면 repository에 삭제 위임

**나머지 메서드 (findByUsername, listAllUsers, signUp, updateUser, changePassword)**
- repository에 직접 위임

---

## 도메인 3: Auth (인증)

### 비즈니스 규칙

#### AuthService

**signJwt(username): string**
- `{ sub: username }` 페이로드로 JWT 발급
- 시크릿은 ConfigService에서 `JWT_SECRET` 키로 읽음
- JwtService 오류 시 → InternalServerErrorException

#### JwtStrategy
- 쿠키(`jwt`)에서 JWT 추출
- `payload.sub`이 `ADMIN_USERNAME`(env, 기본 `'shorttpd'`)이면 → DB 조회 없이 전체 권한(`rwd`) admin 객체 반환
- 그 외: `payload.sub`(username)으로 DB에서 유저 조회
- 유저 미존재 → UnauthorizedException

#### SelectableJwtAuthGuard
- `@PublicFromJWT()` 데코레이터가 붙은 핸들러 → 인증 없이 통과
- 그 외 → JwtAuthGuard 실행

---

## 도메인 4: Files (파일 서비스)

### 환경설정
- `serve/` 디렉토리를 루트(`/`)로 서빙
- `WEB_VIEW_EXCLUDE`: 목록에서 숨길 파일/디렉토리명 (comma-separated)
- `WEB_VIEW_EXTENSION`: 브라우저에서 직접 표시할 확장자 (comma-separated)
- `UPLOAD_MAX_SIZE_MB`: 업로드 최대 크기 (기본 512MB)

### 비즈니스 규칙

#### directoryReader(path, excludes): FileEntry[]
- 디렉토리 항목을 읽어 `FileEntry[]` 반환
- excludes에 포함된 이름은 제외
- 디렉토리는 파일보다 **먼저** 정렬 (각각 알파벳 오름차순)
- 디렉토리: `{ dir: true, size: 'Directory', lastModified: null }`
- 파일: `{ dir: false, size: 포맷된 크기, lastModified: 수정 시각 문자열 }`
- 파일 크기 포맷: `B` / `KB` / `MB` / `GB`

#### FilesService.listFiles(uri): string | FileEntry[]
- URI 디코딩 후 `serve/` 하위 경로로 변환
- **path traversal 차단**: `serve/` 외부로 벗어나는 경로 → HTTP 404
- 디렉토리 → FileEntry[] 반환
- 파일 → 절대경로 문자열 반환
- 경로 미존재 → HTTP 404

#### FilesService.shouldShowInBrowser(file): boolean
- 파일 확장자가 `WEB_VIEW_EXTENSION`에 포함되면 `true`

#### FilesService.uploadFile(uri, file)
- **path traversal 차단** → HTTP 400
- 디렉토리 미존재 → HTTP 404
- 대상이 디렉토리가 아님 → HTTP 400
- 파일을 `file.originalname`으로 해당 디렉토리에 저장

#### FilesService.mkdir(uri)
- **path traversal 차단** → HTTP 400
- 이미 존재 → HTTP 409
- 디렉토리 생성

#### FilesService.rmdir(uri)
- **path traversal 차단** → HTTP 400
- 미존재 → HTTP 404
- 파일이면 → HTTP 400
- 비어있지 않으면 → HTTP 400
- 빈 디렉토리만 삭제 가능

#### FilesService.deleteFile(uri)
- **path traversal 차단** → HTTP 400
- 미존재 → HTTP 404
- 대상이 디렉토리이면 → HTTP 400 (파일만 삭제 가능)
- 파일 삭제

#### FilesService.canWrite / canDelete
- permission JSON 문자열과 요청 경로를 받아 Permission 도메인에 위임

---

## 도메인 5: PermissionGuard

### 비즈니스 규칙
- **GET 요청** → 항상 통과
- **`USE_AUTH !== 'yes'`** → POST/PUT/DELETE도 통과
- JWT 쿠키 없음 → ForbiddenException
- JWT 검증 실패 → ForbiddenException
- admin username(env: `ADMIN_USERNAME`, 기본 `'shorttpd'`)이면 → 모든 메서드 통과
- 일반 유저:
  - DB에 없으면 → ForbiddenException
  - **DELETE**: `canDelete` false → ForbiddenException ('삭제 권한 없음')
  - **POST/PUT**: `canWrite` false → ForbiddenException ('쓰기 권한 없음')

---

## 도메인 6: SuccessInterceptor

### 비즈니스 규칙
- `@Render()` 데코레이터가 붙은 핸들러(템플릿 렌더링) → 래핑 없이 원본 반환
- 그 외 JSON 응답 → `{ success: true, data: <원본> }` 형태로 래핑

---

## 알려진 결함 (원본 코드 기준)

1. **UsersRepository.findByUsername**: 유저 없을 때 `null` 대신 예외 throw → UsersService.removeUser에서 null 체크 불가
2. **UsersService.verifyUserAndSignJWT**: JWT 서명 실패 시 `catch` 블록이 비어있어 `undefined` 반환
3. **UsersService**: JwtService 의존성이 있어 AuthService와 책임 혼재
4. **FilesService**: path traversal 방어 로직 없음
5. **fileManager**: 파일 크기를 raw bytes로 반환 (포맷 없음)
6. **SuccessInterceptor**: Render 핸들러 여부를 체크하지 않아 view 데이터도 래핑됨

---

## TDD 구현 순서

1. `permission.types` — 순수 함수, 외부 의존성 없음
2. `fileManager` — fs mock 필요
3. `AuthService` — JwtService, ConfigService mock
4. `UsersRepository` — TypeORM Repository mock
5. `UsersService` — UsersRepository mock
6. `FilesService` — fs mock, ConfigService mock
7. `PermissionGuard` — JwtService, ConfigService, UsersService mock
8. `SuccessInterceptor` — Reflector mock
