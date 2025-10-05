# Gemini 프로젝트 분석: pet-finder-app

이 문서는 `pet-finder-app` 프로젝트의 구조와 핵심 구성 요소에 대한 저의 이해를 요약한 것입니다.

## 1. 프로젝트 개요

-   **프레임워크**: React Native (Expo로 관리)
-   **언어**: TypeScript를 사용하여 애플리케이션 전반의 타입 안정성을 보장합니다.
-   **핵심 목적**: 사용자가 잃어버린 반려동물(주로 강아지)을 찾을 수 있도록 돕는 모바일 앱. 사용자는 실종 동물에 대한 게시글이나 목격담을 올릴 수 있습니다.
-   **주요 라이브러리**:
    -   `react-navigation`: 화면 네비게이션 관리
    -   `axios`: 백엔드 API와의 HTTP 통신
    -   `expo-location`: 사용자 위치 정보 처리
    -   `expo-notifications`: 푸시 알림 기능
    -   `expo-image-picker`: 사용자 기기에서 이미지 선택

## 2. 디렉토리 구조

-   `/screens`: 앱의 각 화면을 구성하는 최상위 컴포넌트가 위치합니다.
-   `/components`: 여러 화면에서 재사용되는 UI 컴포넌트(`PostCard`, `AppHeader`, `LoginForm` 등)가 위치합니다.
-   `/service`: API 연동을 관리합니다. `mockApi.ts` 파일은 현재 Mock 데이터/함수와 실제 백엔드 통신을 위한 `axios` 클라이언트를 모두 포함하고 있습니다.
-   `/utils`: 유틸리티 함수들이 위치합니다. (`pushNotifications.ts`, `time.ts` 등)
-   `/assets`: 이미지, SVG 아이콘 등 정적 에셋을 저장합니다.
-   `/types.tsx`: 네비게이션, API 응답, 데이터 모델(Post, User 등)에 대한 TypeScript 타입을 중앙에서 관리합니다.

## 3. 네비게이션 구조 (`App.tsx`)

네비게이션은 `react-navigation`을 기반으로 하며, `AuthContext`를 통해 관리되는 사용자의 인증 상태에 따라 분기됩니다.

-   **`AuthContext`**: 전역 인증 상태(`isLoggedIn`, `userMemberName`)와 함수(`signIn`, `signOut`)를 제공하는 React Context입니다.

-   **조건부 스택**:
    -   `isLoggedIn`이 `false`이면 **`AuthStackScreen`** 이 렌더링됩니다.
    -   `isLoggedIn`이 `true`이면 **`MainAppStackScreen`** 이 렌더링됩니다.

### `AuthStackScreen` (비로그인 상태)

게스트 사용자를 위한 네이티브 스택 네비게이터입니다.
-   `Lost`: 메인 화면 (게시글 목록 표시)
-   `PostDetail`: 게시글 상세 정보의 읽기 전용 버전 (`PostDetailGuestScreen`)
-   `LoginScreen`: 사용자 로그인 화면
-   `SignUpScreen`: 사용자 회원가입 화면

### `MainAppStackScreen` (로그인 상태)

인증된 사용자를 위한 핵심 앱 기능이 포함된 네이티브 스택 네비게이터입니다.

-   **`RootTab` (메인 진입점)**: 4개의 메인 탭으로 구성된 하단 탭 네비게이터입니다.
    -   **`RootTabNavigator`**:
        -   **Lost (홈)**: 메인 피드 화면 (`LostScreen`)
        -   **Match (매칭)**: 사용자의 게시글과 관련된 잠재적 매칭 목록 (`MatchScreen`)
        -   **Chat (채팅)**: 사용자의 채팅방 목록 (`ChatScreen`)
        -   **MyPage (마이페이지)**: 사용자 프로필 및 활동 화면 (`MypageScreen`)
-   **`MainStack` 내 다른 화면**:
    -   `PostDetail`: 모든 기능이 포함된 게시글 상세 화면 (`PostDetailScreen`)
    -   `WritePostScreen`: 게시글 작성 및 수정을 위한 폼
    -   `ChatDetail`: 개별 채팅 대화 화면
    -   `NotificationsScreen`: 알림 목록 표시
    -   `Report`: 게시글 신고 화면

## 4. 화면별 역할 (`/screens`)

-   `LostScreen.tsx`: 앱의 메인 화면. 선택된 탭에 따라 '실종' 또는 '목격' 게시글 목록을 표시하며, 새 게시글 작성을 위한 플로팅 버튼이 있습니다.
-   `MatchScreen.tsx`: 사용자의 실종/목격 게시글과 일치할 가능성이 있는 게시글 목록을 보여줍니다.
-   `ChatScreen.tsx`: 사용자가 참여하고 있는 모든 채팅 대화 목록을 표시합니다.
-   `ChatDetailScreen.tsx`: 단일 채팅방 내의 메시지를 보여주고 새 메시지를 보낼 수 있게 합니다.
-   `MypageScreen.tsx`: 사용자 프로필 정보와 자신이 작성한 게시글 목록을 보여줍니다. 로그아웃 기능이 있습니다.
-   `LoginScreen.tsx`: 사용자 로그인을 처리합니다.
-   `SignUpScreen.tsx`: 신규 사용자 회원가입을 처리합니다.
-   `PostDetailScreen.tsx`: 로그인한 사용자를 위한 게시글 상세 정보 화면으로, 채팅 시작, 귀가 완료 처리 등 상호작용이 가능합니다.
-   `PostDetailGuestScreen.tsx`: 비로그인 사용자를 위한 읽기 전용 상세 화면입니다.
-   `WritePostScreen.tsx`: '실종' 또는 '목격' 게시글을 작성하거나 수정하기 위한 폼입니다.
-   `NotificationsScreen.tsx`: 사용자에게 온 알림 목록을 표시합니다.
-   `ReportScreen.tsx`: 부적절한 게시물을 신고하기 위한 폼입니다.

## 5. API 연동 현황

-   **인증 API**: 로그인, 회원가입, 프로필 조회 기능이 모두 연동되었습니다. (`/api/auth`, `/api/users/profiles`)
-   **게시글 목록/상세 API**: 게시글 목록 조회(`LostScreen`), 내 게시글 목록 조회(`MypageScreen`), 게시글 상세 조회(`PostDetail...`) 기능이 모두 연동되었습니다.
-   **견종 검색 API**: 게시글 작성 시, 견종 이름 자동완성 기능이 연동되었습니다.
-   **게시글 생성/수정/삭제 API**: 생성, 수정, 삭제 기능이 모두 정상적으로 연동되었습니다.
-   **Mock API**: `MatchScreen`, `ChatScreen` 등 아직 기능이 구현되지 않은 부분에서 Mock 데이터를 사용하고 있습니다.

## 6. 최근 주요 작업

-   **게시글 목록/상세 기능 연동:**
    -   `LostScreen`과 `MypageScreen`에서 `getPosts`, `getMyPosts` API를 호출하여 실제 데이터를 표시하도록 수정했습니다.
    -   백엔드 응답(`lostDateTime`)과 프론트엔드(`Post.date`) 간의 날짜 형식 불일치 문제를 해결했습니다. (`service/mockApi.ts`)
    -   '발견' 게시글의 상태(`status`)가 '실종'으로 잘못 표시되던 문제를, `MISSING`을 `SIGHTED`로 변환하여 해결했습니다.
    -   `PostCard` 컴포넌트에 실제 게시글 이미지가 표시되도록 수정했습니다.

-   **게시글 상세 화면 기능 강화:**
    -   백엔드에서 좌표값만 넘어오는 `location` 정보를, Google Maps API를 이용한 **리버스 지오코딩**을 통해 완전한 주소 문자열로 변환하여 표시하도록 개선했습니다.
    -   게시글 이미지를 클릭하면 전체 화면으로 확대해서 볼 수 있는 **이미지 모달 기능**을 추가했습니다.
    -   백엔드 `gender` 값 (`MALE`, `FEMALE`)을 프론트엔드에서 '수컷', '암컷'으로 변환하여 표시하도록 `mapGenderToKorean` 유틸리티 함수를 추가하고 적용했습니다.

-   **게시글 작성 기능 데이터 매핑:**
    -   게시글 작성 시, 프론트엔드의 데이터 모델(`PostPayload`)과 백엔드가 요구하는 데이터 모델 간의 필드명 불일치(`species` -> `dogType` 등) 문제를 해결하기 위해 `mapPayloadToApi` 변환 함수를 추가했습니다.
    -   성별 데이터 `NEUTRAL` 값 전송을 위해 `types.tsx`와 `WritePostForm.tsx`의 관련 로직을 수정했습니다.

-   **UI 및 버그 수정:**
    -   `MypageScreen`에서 불필요한 이메일 정보 표시를 제거했습니다.
    -   `LostScreen`에서 상세 화면을 보고 뒤로 돌아왔을 때, 다른 탭의 게시글이 표시되던 버그를 `useIsFocused` 훅을 사용하여 수정했습니다.
    -   `MypageScreen`에서 내 게시글 목록을 가져오지 못하던 버그(API 응답 필드명 불일치: `posts` vs `content`)를 수정했습니다.

## 7. 백엔드 API 관련 참고사항

-   **상태 값 불일치:** '발견' 게시글 조회 시, 백엔드에서 `status` 값을 일관성 없이 `MISSING` 또는 `SIGHTED`로 보내주고 있습니다. 현재 프론트엔드에서 `MISSING`을 `SIGHTED`로 변환하여 임시 처리하고 있으나, 백엔드에서 데이터 일관성을 맞춰주는 것이 권장됩니다.
-   **위치 정보:** 게시글 상세 조회 API는 `location` 주소 문자열을 반환하지 않고 위도/경도 값만 반환합니다. 이로 인해 프론트엔드에서 매번 리버스 지오코딩 API를 호출해야 하므로, 백엔드에서 주소 문자열도 함께 내려주는 것이 성능에 유리합니다.

## 8. 게시글 생성 및 상세 페이지 연동 완료

-   **상태**: **완료**
-   **기존 문제**: 게시글 작성 시 `500 Internal Server Error`가 발생하여 연동이 중단된 상태였습니다.
-   **원인 분석**:
    -   로그 분석 결과, 게시글 생성 자체(`POST /lost-posts`)는 **성공**하고 있었습니다.
    -   문제는 게시글 생성 직후, 상세 페이지로 이동하는 과정에서 발생했습니다.
    -   프론트엔드 코드가 API 응답으로 받은 게시글 ID(`postId`)를 제대로 사용하지 않고, `undefined` ID와 잘못된 게시글 타입(`found-posts`)으로 상세 정보를 요청(`GET /found-posts/undefined`)하는 로직상의 버그가 있었습니다.
-   **해결**:
    -   `WritePostScreen.tsx`에서 게시글 생성 성공 후, `navigation.replace`를 호출할 때 API 응답값인 `newPost.postId`와 현재 화면의 `type`을 정확히 전달하도록 수정했습니다.
    -   이로써 게시글 생성 후, 방금 생성된 게시글의 상세 페이지로 정상적으로 이동하게 됩니다.
-   **결론**: 게시글 생성, 수정, 삭제 및 상세 조회 기능이 모두 정상적으로 연동되었습니다.

## 9. 게시글 수정 기능 관련 현재 이슈 및 제안 (2025-10-05)

게시글 수정 기능 구현 중, 아래와 같은 두 가지 이슈가 식별되었으며 백엔드 팀의 확인 및 협의가 필요합니다.

### 9.1. `deletedImageUrls` 처리 오류

-   **현상**: `deletedImageUrls` 배열에 삭제할 이미지의 S3 Object Key (예: `postFound/image.jpeg`)를 담아 요청하면, 서버에서 `400 Bad Request`와 함께 `S3405: 유효하지 않은 S3 URL입니다.` 오류가 발생합니다.
-   **분석**:
    -   `existingImageUrls` 필드에 **동일한 형식의 Object Key**를 담아 보내면 정상적으로 처리됩니다.
    -   프론트엔드에서는 두 필드 모두 동일한 방식으로 URL을 가공하여 전송하고 있음을 디버그 로그를 통해 확인했습니다.
-   **결론**: `existingImageUrls`는 정상 동작하는 것으로 보아, 서버 측에서 `deletedImageUrls` 필드를 처리하는 로직에만 문제가 있을 가능성이 매우 높습니다.

-   **해결 완료 !!!!**

### 9.2. 이미지 순서 보존을 위한 API 개선 제안

-   **현상**: 현재 API 구조는 '기존 이미지'와 '새로운 이미지'를 별개의 필드(`existingImageUrls`, `images`)로 받기 때문에, 사용자가 UI에서 설정한 이미지들의 최종 순서(특히 기존 이미지와 새 이미지가 섞여있는 경우)를 서버가 알 수 없습니다.
-   **해결 제안**:
    -   API가 `finalImageOrder`와 같은 단일 필드로 최종 순서 정보를 받도록 변경합니다. (또는 현재의 `existingImageUrls` 필드를 재활용)
    -   이 배열에는 최종 순서에 따라 **기존 이미지의 S3 Object Key**와, **새 이미지의 위치를 나타내는 고유한 Placeholder** (예: `__NEW_IMAGE_0__`, `__NEW_IMAGE_1__`)를 함께 담아 전송합니다.
    -   **예시 `data` JSON:**
        ```json
        {
          "finalImageOrder": [
            "postFound/existing1.jpg",
            "__NEW_IMAGE_0__",
            "postFound/existing2.jpg"
          ],
          "deletedImageUrls": [ ... ]
        }
        ```
    -   이 방식을 통해 백엔드는 프론트엔드에서 보낸 `images` 파일들과 `finalImageOrder`를 조합하여 완벽한 최종 순서를 재구성할 수 있습니다.
    -   **추후 해결 예정, 현재는 기존 existingImageUrls로 기존 파일을 보내고 있음.** 
