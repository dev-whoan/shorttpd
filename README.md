# shorttpd

Simple HTTP web server for serving static files, built with NestJS.

## Features

- Web browser-based file explorer
- File upload / folder creation / deletion
- Optional JWT-based authentication
- Per-user, per-path permission control (`r` / `rw` / `rwd`)
- Admin panel for user management (Basic Auth protected)
- Docker support

---

## Installation

### Prerequisites

- Node.js 22+
- Yarn

### Local

```bash
# Install dependencies
yarn install

# Development
yarn start:dev

# Production build
yarn build
yarn start:prod
```

- 프로젝트 루트에 `serve/` 폴더를 생성하고, 이곳에 파일을 두면 브라우저에서 탐색할 수 있습니다.

### Docker

```bash
docker run --rm \
  -p 5050:5050 \
  -v /path/to/.env:/shorttpd/.env \
  -v /path/to/serve:/shorttpd/serve \
  --name shorttpd \
  ghcr.io/dev-whoan/shorttpd:0.0.5
```
  - `.env` 파일을 마운트 하지 않고, 환경변수로 등록해도 됩니다.
  - `-v /path/to/serve:/shorttpd/serve` 옵션으로 파일을 서빙할 디렉토리를 지정할 수 있습니다.
---

## Configuration

`.env` 파일을 프로젝트 루트(또는 Docker의 경우 `/shorttpd/.env`)에 생성합니다.

```env
PORT=5050

# JWT 인증 사용 여부 (yes / no)
USE_AUTH=yes
JWT_SECRET=your_jwt_secret

# 어드민 페이지 설정
ADMIN_PAGE_PREFIX=/admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin

# 브라우저에서 직접 열기를 허용할 확장자 (쉼표 구분)
WEB_VIEW_EXTENSION=json,conf,ini,png,jpeg,jpg,gif,txt

# 파일 목록에서 숨길 파일/폴더 이름 (쉼표 구분)
WEB_VIEW_EXCLUDE=.env,node_modules,some_thing_to_exclude
```

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PORT` | 서버 포트 | `5000` |
| `USE_AUTH` | 인증 활성화 여부 | `no` |
| `JWT_SECRET` | JWT 서명 키 | — |
| `ADMIN_PAGE_PREFIX` | 어드민 페이지 경로 (예: `/admin`) | — |
| `ADMIN_USERNAME` | 어드민 Basic Auth 아이디 | `shorttpd` |
| `ADMIN_PASSWORD` | 어드민 Basic Auth 비밀번호 | `shorttpd_password` |
| `WEB_VIEW_EXTENSION` | 브라우저 뷰어 허용 확장자 | — |
| `WEB_VIEW_EXCLUDE` | 숨길 파일/폴더 이름 | — |

---

## Usage

### 파일 서빙

서버 실행 후 `serve/` 폴더에 파일을 두면 브라우저에서 탐색할 수 있습니다.

- Docker: `-v /host/path:/shorttpd/serve`
- 로컬: 프로젝트 루트의 `serve/` 디렉토리

### 인증

`USE_AUTH=yes`로 설정하면 로그인한 사용자만 파일에 접근할 수 있습니다.

### 권한 시스템

유저별로 경로마다 접근 수준을 지정할 수 있습니다.

| 레벨 | 읽기 | 업로드/폴더 생성 | 삭제 |
|------|:----:|:---------------:|:----:|
| `r`  | O    | X               | X    |
| `rw` | O    | O               | X    |
| `rwd`| O    | O               | O    |

권한은 가장 긴 prefix 경로 기준으로 매칭되며, `*`는 기본값(fallback)으로 동작합니다.

```json
[
  { "path": "*",       "access": "r"   },
  { "path": "/photos", "access": "rw"  },
  { "path": "/docs",   "access": "rwd" }
]
```

### 어드민 페이지

`ADMIN_PAGE_PREFIX`에 설정한 경로로 접속하면 Basic Auth 인증 후 사용자 관리 페이지에 접근할 수 있습니다.

- 사용자 추가 / 삭제
- 사용자별 권한 설정
