# SNSHero 안드로이드 하이브리드 앱 (Android App with In-App Billing)

본 프로젝트는 **SNSHero (SNS히어로)**의 구글 플레이 스토어 출시를 위한 공식 안드로이드 하이브리드 앱(Kotlin + WebView + Google Play In-App Billing 6.x) 소스 코드입니다.

---

## 📱 주요 특징 및 기술 스택
- **구글 인앱 결제 정책 컴플라이언스 100% 준수**:
  - `WebView`의 User-Agent에 `SNSHeroApp/1.0`을 자동 주입하여 웹상점 진입 시 PayPal 등 외인 결제 수단을 자동 은닉하고, **Google Play In-App Billing**만 활성화.
- **웹뷰 타겟 URL**: `https://dayyoung.github.io/snshero` (웹뷰 내에서 `AndroidBridge` 브리지 수신)
- **Google Play Billing Client**: `com.android.billingclient:billing-ktx:6.2.1`
- **양방향 통신(JS Bridge)**:
  - App -> Web: `window.onInAppPurchaseSuccess(skuId)`
  - Web -> App: `window.AndroidBridge.buyInAppItem(skuId)`

---

## 🚀 빌드 및 구글 플레이 스토어 빌드/출시 가이드

### 1. Android Studio에서 프로젝트 열기
1. `Android Studio`를 실행합니다.
2. `Open`을 선택하고 `/android-app` 디렉터리를 선택하여 연 후 Gradle Sync를 수행합니다.

### 2. Google Play Console에 앱 및 상품 등록
1. [Google Play Console](https://play.google.com/console) 접속 후 새 앱 생성 (`com.dryudryu.snshero`).
2. **인앱 상품 (In-App Products) SKU ID 설정**:
   - `snshero_points_1000` : 1,000 P ($1.00 USD)
   - `snshero_points_3000` : 3,000 P ($2.99 USD)
   - `snshero_points_10000` : 10,000 P ($10.00 USD)
   - `snshero_points_50000` : 50,000 P ($100.00 USD)
   - `ad_removal` : 영구 광고 제거 패키지 ($2.99 USD)

### 3. TWA Digital Asset Links 설정
`https://dayyoung.github.io/snshero/.well-known/assetlinks.json` 파일에 본 안드로이드 앱의 패키지명(`com.dryudryu.snshero`)과 SHA256 핑거프린트가 등록되어 있어 브라우저 주소창 없이 TWA 전용 전체 화면 및 보안 연동이 지원됩니다.

### 3. AAB(Android App Bundle) 서명 및 빌드
1. 상단 메뉴 `Build` -> `Generate Signed Bundle / APK...` 선택.
2. `Android App Bundle (AAB)` 선택 후 진행.
3. 키스토어(Keystore)를 생성 또는 지정하고 서명된 `.aab` 파일을 생성합니다.
4. Google Play Console 내부 테스트 또는 프로덕션 트랙에 업로드하여 검수를 진행합니다.

---

## 🛠️ 주요 소스 코드 위치
- **메인 액티비티**: `app/src/main/java/com/dryudryu/snshero/MainActivity.kt`
- **앱 매니페스트**: `app/src/main/AndroidManifest.xml`
- **의존성 설정**: `app/build.gradle.kts`
