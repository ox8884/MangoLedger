const firebaseConfig = {
  projectId: "ledger-83369",
  appId: "1:1038141695417:web:9e4124203ca6c19d8a0268",
  storageBucket: "ledger-83369.firebasestorage.app",
  apiKey: "AIzaSyD8xcd75s2NU63p7lg6QZqP3PYcbTnXDlE",
  authDomain: "ledger-83369.firebaseapp.com",
  messagingSenderId: "1038141695417",
  measurementId: "G-DZH5FY97GW"
};

// Initialize Firebase via Compat SDK
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let syncedTransactions = [];
let syncedSubscriptions = [];
let syncedDutchPays = [];

// App State and Business Logic for Rich Mango Ledger

// Default Category Definitions with Emojis and Colors
const EXPENSE_CATEGORIES = {
    food: { labels: { ko: '식비', en: 'Food' }, emoji: '🍔', color: '#f43f5e' },
    transport: { labels: { ko: '교통비', en: 'Transport' }, emoji: '🚗', color: '#3b82f6' },
    house: { labels: { ko: '주거/통신', en: 'Living/Bills' }, emoji: '🏠', color: '#eab308' },
    shopping: { labels: { ko: '쇼핑', en: 'Shopping' }, emoji: '🛍️', color: '#ec4899' },
    culture: { labels: { ko: '문화/여가', en: 'Entertainment' }, emoji: '🎬', color: '#a855f7' },
    medical: { labels: { ko: '의료/건강', en: 'Medical/Health' }, emoji: '🏥', color: '#10b981' },
    other: { labels: { ko: '기타 지출', en: 'Other' }, emoji: '📦', color: '#64748b' }
};

const INCOME_CATEGORIES = {
    salary: { labels: { ko: '급여', en: 'Salary' }, emoji: '💼', color: '#10b981' },
    bonus: { labels: { ko: '보너스', en: 'Bonus' }, emoji: '🎁', color: '#f59e0b' },
    investment: { labels: { ko: '투자/부수입', en: 'Investments' }, emoji: '📈', color: '#06b6d4' },
    other: { labels: { ko: '기타 수입', en: 'Other' }, emoji: '💰', color: '#64748b' }
};

// Emoji and Color Presets for Custom Categories
const PRESET_EMOJIS = ['🍔', '🚗', '🏠', '🛍️', '🎬', '🏥', '💼', '🎁', '📈', '💰', '☕', '🍺', '✈️', '🎮', '📚', '👕', '🥦', '🏋️', '💈', '🐶', '🐱', '🔑', '🔌', '🧼', '💝'];
const PRESET_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#10b981', '#059669', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#64748b'];

// Translation Map
const TRANSLATIONS = {
    ko: {
        'logo-sub': '리치망고 가계부',
        'total-income-title': '이번 달 총 수입',
        'total-expense-title': '이번 달 총 지출',
        'budget-composition-title': '가용 예산 구성',
        'base-budget-label': '기본 예산:',
        'carried-over-label': '이월금:',
        'remaining-budget-title': '남은 예산',
        'budget-progress-title': '예산 소진율',
        'mini-chart-title': '지출 구조 요약',
        'recent-tx-title': '최근 거래 내역',
        'upcoming-subs-title': '이번 달 남은 정기 결제',
        'set-base-budget-label': '이번 달 기본 예산 설정',
        'set-btn': '설정',
        'carry-settings-label': '이월 설정',
        'carry-balance-label': '이전 달 잔액 자동 이월',
        'carry-deficit-label': '초과 지출(적자)도 이월하여 차감',
        'add-tx-title': '내역 추가',
        'type-expense': '지출',
        'type-income': '수입',
        'form-date': '날짜',
        'form-category': '카테고리',
        'form-amount': '금액',
        'form-memo': '메모 / 내용',
        'submit-btn-text': '등록하기',
        'tx-list-title': '거래 내역',
        'filter-all': '전체 내역',
        'filter-expense': '지출만',
        'filter-income': '수입만',
        'list-empty-msg': '등록된 내역이 없습니다.',
        'chart-empty-msg': '지출 내역이 없습니다.',
        
        // Navigation Menus
        'menu-dashboard': '대시보드',
        'menu-transactions': '거래내역',
        'menu-budget': '예산',
        'menu-subscriptions': '구독',
        'menu-reports': '리포트',
        'menu-settings': '설정',

        // Category Budgets
        'category-budget-title': '카테고리별 예산 한도 설정',
        'category-budget-desc': '각 지출 카테고리에 할당할 한도를 입력하여 소비를 제어하세요.',
        'limit-not-set': '한도 설정 없음',
        'limit-remains': '{amt} 남음',
        'limit-over': '{amt} 초과',

        // Subscriptions
        'add-sub-title': '구독 서비스 추가',
        'sub-form-name': '서비스 이름',
        'sub-form-cycle': '결제 주기',
        'sub-form-date': '정기 결제일(일)',
        'sub-form-date-yearly': '정기 결제일(월)',
        'sub-cycle-monthly': '매월',
        'sub-cycle-yearly': '매년',
        'sub-register-btn': '구독 등록',
        'sub-update-btn': '구독 수정',
        'sub-list-title': '구독 관리 목록',
        'sub-monthly-total-label': '월 고정비 총합:',
        'sub-monthly-expense-label': '고정 지출:',
        'sub-monthly-income-label': '고정 수입:',
        'subs-empty-msg': '등록된 구독 서비스나 고정 수익이 없습니다.',
        'sub-billed-day': '매달 {day}일 결제',
        'sub-billed-day-yearly': '매년 {day}월 결제',
        'sub-deposit-day': '매달 {day}일 입금',
        'sub-deposit-day-yearly': '매년 {day}월 입금',
        'quick-tx-title': '빠른 거래 등록',

        // Reports
        'analytics-title': '통계 분석 리포트',
        'chart-tab-category': '카테고리 지출',
        'chart-tab-trend': '월별 예산 대비 지출',
        'data-management-title': '데이터 관리',
        'data-management-desc': '가계부 데이터를 외부 파일로 내보내거나 가져옵니다.',
        'export-csv': 'CSV 파일 내보내기',
        'export-json': 'JSON 백업 다운로드',
        'import-data': '데이터 파일 가져오기',

        // Settings
        'settings-currency-title': '표시 통화 단위',
        'settings-currency-desc': '가계부 전체에 반영될 금액 기호를 선택하세요.',
        'settings-lang-title': '언어 설정 (Language)',
        'settings-lang-desc': '사용할 다국어 설정을 지정하세요.',
        'settings-theme-title': '테마 모드',
        'settings-theme-desc': '화면의 명도를 조절하는 테마 스타일을 고릅니다.',
        'theme-light': '라이트 모드',
        'theme-dark': '다크 모드',
        'settings-app-title': '앱 다운로드 및 업데이트',
        'settings-app-desc': '안드로이드 앱(APK) 최신 버전을 다운로드하거나 최신 웹 자원 업데이트를 적용합니다.',
        'settings-reload-btn': '웹 업데이트 적용 (새로고침)',
        'settings-reset-title': '가계부 데이터 전체 삭제',
        'settings-reset-desc': '로컬에 저장된 모든 수입/지출 내역과 예산, 구독 설정을 지웁니다. 이 작업은 취소할 수 없습니다.',
        'reset-data-btn': '데이터 전체 초기화',

        // Custom Categories translations
        'settings-categories-title': '카테고리 관리',
        'settings-categories-desc': '나만의 가계부 카테고리를 만들고 이모티콘을 매핑해 보세요.',
        'cat-list-title': '등록된 카테고리',
        'cat-add-title': '새 카테고리 추가',
        'cat-form-name': '카테고리 이름',
        'cat-form-type': '구분',
        'cat-form-emoji': '이모티콘 선택',
        'cat-form-color': '색상 선택',
        'cat-add-btn': '카테고리 생성',

        // Placeholders
        'memo-placeholder': '예: 점심 식사, 급여',
        'search-placeholder': '메모 검색...',
        
        // Status
        'status-no-budget': '설정된 예산 없음',
        'status-within-budget': '예산 내 소비 중',
        'status-over-budget': '예산 초과',
        
        // Dynamic templates
        'count-tx': '건수: {n}건',
        'percent-used': '{pct}% 사용됨',
        'result-count': '검색 결과: {n}건',
        
        // Categories
        'cat-entertainment': '문화/여가',
        'cat-utilities': '생활/공공요금',
        'cat-education': '교육/학습',
        'cat-other': '기타',
        
        // Toast Alerts
        'toast-budget-saved': '{month}월 예산이 설정되었습니다.',
        'toast-budget-error': '올바른 예산 금액을 입력해 주세요.',
        'toast-validation-error': '입력 항목을 다시 확인해 주세요.',
        'toast-tx-added': '거래 내역이 성공적으로 등록되었습니다.',
        'toast-tx-deleted': '내역이 삭제되었습니다.',
        'toast-selected-deleted': '선택한 내역들이 삭제되었습니다.',
        'toast-carry-enabled': '자동 예산 이월이 활성화되었습니다.',
        'toast-carry-disabled': '자동 예산 이월이 비활성화되었습니다.',
        'toast-deficit-enabled': '초과 지출(적자) 이월이 활성화되었습니다.',
        'toast-deficit-disabled': '초과 지출 이월이 비활성화되었습니다.',
        'toast-sub-added': '구독 서비스가 등록되었습니다.',
        'toast-sub-deleted': '구독 서비스가 삭제되었습니다.',
        'toast-sub-status-changed': '구독 활성 상태가 변경되었습니다.',
        'toast-category-budget-saved': '{cat} 예산 한도가 저장되었습니다.',
        'toast-data-imported': '데이터를 성공적으로 가져왔습니다!',
        'toast-import-failed': '올바르지 않은 파일 형식이거나 파일 읽기 오류입니다.',
        'toast-data-reset': '모든 가계부 데이터가 초기화되었습니다.',
        'toast-cat-added': '새 카테고리가 추가되었습니다.',
        'toast-cat-deleted': '카테고리가 삭제되었습니다.',
        'toast-cat-duplicate': '이미 존재하는 카테고리 이름입니다.',
        'edit-tx-title': '내역 수정',
        'update-btn-text': '수정 완료',
        'cancel-btn-text': '취소',
        'toast-tx-updated': '거래 내역이 성공적으로 수정되었습니다.',
        // Dutch Pay
        'menu-dutchpay': '더치페이',
        'add-dutch-title': '새 더치페이 등록',
        'dutch-form-title': '모임명 / 내용',
        'dutch-form-amount': '총 결제 금액',
        'dutch-form-friends': '함께한 친구들',
        'dutch-form-autolog': '가계부 지출에 자동 등록',
        'dutch-register-btn': '등록 및 계산',
        'dutch-list-title': '더치페이 정산 현황',
        'dutch-empty-msg': '등록된 더치페이 정산 내역이 없습니다.',
        'dutch-total-label': '총 금액:',
        'dutch-share-label': '1인당 정산 금액:',
        'dutch-status-pending': '대기 중',
        'dutch-status-settled': '정산 완료',
        'dutch-fully-settled-label': '정산 완료 🎉',
        'toast-dutch-added': '더치페이 정산 판이 생성되었습니다.',
        'toast-dutch-settle-member': '{name}님의 분담금 정산이 완료되었습니다.',
        'toast-dutch-deleted': '더치페이 정산 내역이 삭제되었습니다.',
        'dutch-form-toggle-label': '더치페이(금액 분할) 적용',
        'receipt-scan-text': '영수증 또는 거래내역 스크린샷 첨부 (클릭 또는 이미지 드롭)',
        'receipt-status-init': '엔진 로드 중...',
        'receipt-status-recognizing': '텍스트 인식 중... ({progress}%)',
        'receipt-status-success': '분석 완료!',
        'receipt-status-fail': '텍스트 인식 실패',
        'toast-receipt-success': '영수증 분석 완료! 금액, 날짜, 메모가 자동 입력되었습니다.',
        'toast-receipt-error': '영수증 분석 중 오류가 발생했습니다.',
        'batch-modal-title': '일괄 내역 가져오기',
        'batch-modal-desc': '분석된 거래 내역 목록입니다. 가계부에 등록할 항목을 선택하고 세부 내용을 조정하세요.',
        'batch-select-all-label': '전체 선택',
        'batch-import-btn': '선택한 내역 등록하기',
        'login-card-title': 'Rich Mango Ledger 로그인',
        'login-card-desc': '스마트한 가계부 관리를 시작해보세요.',
        'login-tab': '로그인',
        'signup-tab': '회원가입',
        'email-label': '이메일 주소',
        'password-label': '비밀번호',
        'confirm-password-label': '비밀번호 확인',
        'login-btn': '로그인',
        'signup-btn': '회원가입',
        'google-login-btn': 'Google 계정으로 로그인',
        'logout-btn': '로그아웃',
        'profile-title': '로그인 정보',
        'toast-auth-success': '성공적으로 로그인되었습니다.',
        'toast-auth-signup-success': '회원가입이 완료되었습니다!',
        'toast-auth-logout': '로그아웃되었습니다.',
        'toast-auth-error': '오류: {error}',
        'toast-auth-pwd-mismatch': '비밀번호가 일치하지 않습니다.'
    },
    en: {
        'logo-sub': 'Rich Mango Ledger',
        'total-income-title': 'Total Income',
        'total-expense-title': 'Total Expenses',
        'budget-composition-title': 'Available Budget',
        'base-budget-label': 'Base Budget:',
        'carried-over-label': 'Carried Over:',
        'remaining-budget-title': 'Remaining Budget',
        'budget-progress-title': 'Budget Consumption',
        'mini-chart-title': 'Expense Structure Summary',
        'recent-tx-title': 'Recent Transactions',
        'upcoming-subs-title': 'Upcoming Payments This Month',
        'set-base-budget-label': 'Set Base Budget for This Month',
        'set-btn': 'Set',
        'carry-settings-label': 'Carry-over Settings',
        'carry-balance-label': 'Auto Carry-over Balance',
        'carry-deficit-label': 'Carry Over Deficits (Subtract from next month)',
        'add-tx-title': 'Add Transaction',
        'type-expense': 'Expense',
        'type-income': 'Income',
        'form-date': 'Date',
        'form-category': 'Category',
        'form-amount': 'Amount',
        'form-memo': 'Memo / Description',
        'submit-btn-text': 'Add Transaction',
        'tx-list-title': 'Transactions',
        'filter-all': 'All Transactions',
        'filter-expense': 'Expenses Only',
        'filter-income': 'Income Only',
        'list-empty-msg': 'No transactions recorded.',
        'chart-empty-msg': 'No expense data to display.',
        
        // Navigation Menus
        'menu-dashboard': 'Dashboard',
        'menu-transactions': 'Transactions',
        'menu-budget': 'Budget',
        'menu-subscriptions': 'Subscriptions',
        'menu-reports': 'Reports',
        'menu-settings': 'Settings',

        // Category Budgets
        'category-budget-title': 'Category Budgets Settings',
        'category-budget-desc': 'Input budget limits for each category to control your spending.',
        'limit-not-set': 'No limit set',
        'limit-remains': '{amt} left',
        'limit-over': '{amt} over',

        // Subscriptions
        'add-sub-title': 'Add Subscription',
        'sub-form-name': 'Service Name',
        'sub-form-cycle': 'Billing Cycle',
        'sub-form-date': 'Billing Day (of month)',
        'sub-form-date-yearly': 'Billing Month',
        'sub-cycle-monthly': 'Monthly',
        'sub-cycle-yearly': 'Yearly',
        'sub-register-btn': 'Add Subscription',
        'sub-update-btn': 'Update Subscription',
        'sub-list-title': 'Subscription List',
        'sub-monthly-total-label': 'Monthly Fixed Cost:',
        'sub-monthly-expense-label': 'Fixed Expenses:',
        'sub-monthly-income-label': 'Fixed Income:',
        'subs-empty-msg': 'No subscriptions or recurring incomes registered.',
        'sub-billed-day': 'Every {day}th of month',
        'sub-billed-day-yearly': 'Yearly in {day}',
        'sub-deposit-day': 'Every {day}th of month',
        'sub-deposit-day-yearly': 'Yearly in {day}',
        'quick-tx-title': 'Quick Transaction',

        // Reports
        'analytics-title': 'Analytics & Reports',
        'chart-tab-category': 'Category Expenses',
        'chart-tab-trend': 'Budget vs Expenses',
        'data-management-title': 'Data Management',
        'data-management-desc': 'Export or import ledger data from/to external files.',
        'export-csv': 'Export to CSV',
        'export-json': 'Backup JSON Data',
        'import-data': 'Import Ledger File',

        // Settings
        'settings-currency-title': 'Display Currency',
        'settings-currency-desc': 'Select your preferred currency unit symbol.',
        'settings-lang-title': 'Language Settings',
        'settings-lang-desc': 'Change the user interface language.',
        'settings-theme-title': 'Theme Mode',
        'settings-theme-desc': 'Select the brightness theme style.',
        'theme-light': 'Light Mode',
        'theme-dark': 'Dark Mode',
        'settings-app-title': 'App Download & Updates',
        'settings-app-desc': 'Download the latest Android App (APK) or force-apply the newest web updates.',
        'settings-reload-btn': 'Force Update App (Reload)',
        'settings-reset-title': 'Erase Ledger Data',
        'settings-reset-desc': 'Erase all transactions, budgets, and subscriptions. This action cannot be undone.',
        'reset-data-btn': 'Reset All Data',

        // Custom Categories translations
        'settings-categories-title': 'Category Management',
        'settings-categories-desc': 'Create your own ledger categories and map emojis.',
        'cat-list-title': 'Registered Categories',
        'cat-add-title': 'Add New Category',
        'cat-form-name': 'Category Name',
        'cat-form-type': 'Type',
        'cat-form-emoji': 'Select Emoji',
        'cat-form-color': 'Select Color',
        'cat-add-btn': 'Create Category',

        // Placeholders
        'memo-placeholder': 'e.g. Lunch, Salary',
        'search-placeholder': 'Search memo...',
        
        // Status
        'status-no-budget': 'No Budget Set',
        'status-within-budget': 'Within Budget',
        'status-over-budget': 'Over Budget',
        
        // Dynamic templates
        'count-tx': 'Count: {n}',
        'percent-used': '{pct}% Used',
        'result-count': 'Results: {n}',
        
        // Categories
        'cat-entertainment': 'Entertainment',
        'cat-utilities': 'Living/Bills',
        'cat-education': 'Education',
        'cat-other': 'Other',
        
        // Toast Alerts
        'toast-budget-saved': 'Budget set for {month}.',
        'toast-budget-error': 'Please enter a valid budget amount.',
        'toast-validation-error': 'Please check your inputs.',
        'toast-tx-added': 'Transaction recorded successfully.',
        'toast-tx-deleted': 'Transaction deleted.',
        'toast-selected-deleted': 'Selected transactions deleted.',
        'toast-carry-enabled': 'Auto carry-over enabled.',
        'toast-carry-disabled': 'Auto carry-over disabled.',
        'toast-deficit-enabled': 'Deficit carry-over enabled.',
        'toast-deficit-disabled': 'Deficit carry-over disabled.',
        'toast-sub-added': 'Subscription registered.',
        'toast-sub-deleted': 'Subscription deleted.',
        'toast-sub-status-changed': 'Subscription status updated.',
        'toast-category-budget-saved': 'Budget limit for {cat} saved.',
        'toast-data-imported': 'Data imported successfully!',
        'toast-import-failed': 'Invalid file format or error reading file.',
        'toast-data-reset': 'All data has been reset to defaults.',
        'toast-cat-added': 'New category added.',
        'toast-cat-deleted': 'Category deleted.',
        'toast-cat-duplicate': 'Category name already exists.',
        'edit-tx-title': 'Edit Transaction',
        'update-btn-text': 'Update',
        'cancel-btn-text': 'Cancel',
        'toast-tx-updated': 'Transaction updated successfully.',
        // Dutch Pay
        'menu-dutchpay': 'Split Bills',
        'add-dutch-title': 'New Split Bill',
        'dutch-form-title': 'Event Title',
        'dutch-form-amount': 'Total Amount',
        'dutch-form-friends': 'Friends Names',
        'dutch-form-autolog': 'Log Total as Expense',
        'dutch-register-btn': 'Split & Register',
        'dutch-list-title': 'Split Bills Status',
        'dutch-empty-msg': 'No split bills registered.',
        'dutch-total-label': 'Total:',
        'dutch-share-label': 'Share per person:',
        'dutch-status-pending': 'Pending',
        'dutch-status-settled': 'Settled',
        'dutch-fully-settled-label': 'Fully Settled 🎉',
        'toast-dutch-added': 'Split bill created.',
        'toast-dutch-settle-member': 'Settled share for {name}.',
        'toast-dutch-deleted': 'Split bill deleted.',
        'dutch-form-toggle-label': 'Apply Split Bill (Dutch Pay)',
        'receipt-scan-text': 'Attach receipt or transaction screenshot (Click or Drop)',
        'receipt-status-init': 'Loading OCR Engine...',
        'receipt-status-recognizing': 'Recognizing text... ({progress}%)',
        'receipt-status-success': 'Analysis complete!',
        'receipt-status-fail': 'Analysis failed',
        'toast-receipt-success': 'Receipt analyzed! Amount, date, and memo auto-filled.',
        'toast-receipt-error': 'Error occurred during receipt analysis.',
        'batch-modal-title': 'Batch Import Transactions',
        'batch-modal-desc': 'These are the parsed transactions. Check the ones you want to import and adjust details as needed.',
        'batch-select-all-label': 'Select All',
        'batch-import-btn': 'Import Selected Transactions',
        'login-card-title': 'Rich Mango Ledger Login',
        'login-card-desc': 'Start managing your finances smartly.',
        'login-tab': 'Log In',
        'signup-tab': 'Sign Up',
        'email-label': 'Email Address',
        'password-label': 'Password',
        'confirm-password-label': 'Confirm Password',
        'login-btn': 'Log In',
        'signup-btn': 'Sign Up',
        'google-login-btn': 'Sign in with Google',
        'logout-btn': 'Log Out',
        'profile-title': 'Account Info',
        'toast-auth-success': 'Logged in successfully.',
        'toast-auth-signup-success': 'Sign up complete!',
        'toast-auth-logout': 'Logged out successfully.',
        'toast-auth-error': 'Error: {error}',
        'toast-auth-pwd-mismatch': 'Passwords do not match.'
    }
};

// State Variables
let transactions = [];
let budgets = {}; 
let subscriptions = []; 
let categoryBudgets = {}; 
let customCategories = []; // Array of { id, type, labels: { ko, en }, emoji, color }
let dutchPays = []; // Array of Split events
let currentView = 'dashboard'; 

let settings = {
    carryOverEnabled: true,
    carryDeficitEnabled: false,
    theme: 'dark',
    lang: 'en',
    currency: 'USD'
};

const CURRENCY_SYMBOLS = {
    USD: { symbol: '$', locale: 'en-US' },
    KRW: { symbol: '₩', locale: 'ko-KR' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' },
    JPY: { symbol: '¥', locale: 'ja-JP' }
};

let currentYearMonth = ''; 
let activeChartType = 'category'; 
let editingTransactionId = null;
let editingSubId = null;

// Chart Instances
let dashboardCategoryChartInstance = null;
let categoryChartInstance = null;
let trendChartInstance = null;

// DOM Elements Reference
const monthPicker = document.getElementById('month-picker');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const langToggleBtn = document.getElementById('lang-toggle');

const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const totalAvailableBudgetEl = document.getElementById('total-available-budget');
const baseBudgetValEl = document.getElementById('base-budget-val');
const carriedOverValEl = document.getElementById('carried-over-val');
const remainingBudgetEl = document.getElementById('remaining-budget');
const remainingCardEl = document.getElementById('remaining-card');
const remainingIconEl = document.getElementById('remaining-icon');
const remainingStatusEl = document.getElementById('remaining-status');

const incomeCountEl = document.getElementById('income-count');
const expenseCountEl = document.getElementById('expense-count');

const budgetProgressBar = document.getElementById('budget-progress-bar');
const budgetPercentageText = document.getElementById('budget-percentage-text');
const inputBaseBudget = document.getElementById('input-base-budget');
const saveBudgetBtn = document.getElementById('save-budget-btn');

const toggleCarryOver = document.getElementById('toggle-carry-over');
const toggleCarryDeficit = document.getElementById('toggle-carry-deficit');

const transactionForm = document.getElementById('transaction-form');
const typeExpenseBtn = document.getElementById('type-expense-btn');
const typeIncomeBtn = document.getElementById('type-income-btn');
const txDateEl = document.getElementById('tx-date');
const txCategoryEl = document.getElementById('tx-category');
const txAmountEl = document.getElementById('tx-amount');
const txMemoEl = document.getElementById('tx-memo');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

const chartTabCategory = document.getElementById('chart-tab-category');
const chartTabTrend = document.getElementById('chart-tab-trend');
const categoryChartCanvas = document.getElementById('category-chart');
const trendChartCanvas = document.getElementById('trend-chart');
const chartEmptyMessage = document.getElementById('chart-empty-message');

const searchInput = document.getElementById('search-input');
const filterType = document.getElementById('filter-type');
const filteredCountEl = document.getElementById('filtered-count');
const transactionList = document.getElementById('transaction-list');
const listEmptyMessage = document.getElementById('list-empty-message');
const toastEl = document.getElementById('toast');
const toastMessageEl = document.getElementById('toast-message');

const txDutchPayEnabledEl = document.getElementById('tx-dutchpay-enabled');
const txDutchFriendsEl = document.getElementById('tx-dutch-friends');
const txDutchPayToggleWrapper = document.getElementById('tx-dutchpay-toggle-wrapper');
const txDutchPayFields = document.getElementById('tx-dutchpay-fields');
const dutchpayList = document.getElementById('dutchpay-list');
const dutchpayEmptyMessage = document.getElementById('dutchpay-empty-message');

const receiptFileInput = document.getElementById('receipt-file-input');
const receiptDropzone = document.getElementById('receipt-dropzone');
const receiptScanStatus = document.getElementById('receipt-scan-status');
const receiptPreviewImg = document.getElementById('receipt-preview-img');
const scanStatusText = document.getElementById('scan-status-text');
const scanProgressBarFg = document.getElementById('scan-progress-bar-fg');
const scanCancelBtn = document.getElementById('scan-cancel-btn');

// Get Dynamic Combined Categories
function getExpenseCategories() {
    const combined = { ...EXPENSE_CATEGORIES };
    customCategories.filter(cat => cat.type === 'expense').forEach(cat => {
        combined[cat.id] = {
            labels: cat.labels,
            emoji: cat.emoji,
            color: cat.color
        };
    });
    return combined;
}

function getIncomeCategories() {
    const combined = { ...INCOME_CATEGORIES };
    customCategories.filter(cat => cat.type === 'income').forEach(cat => {
        combined[cat.id] = {
            labels: cat.labels,
            emoji: cat.emoji,
            color: cat.color
        };
    });
    return combined;
}

// Core App Initialization
function init() {
    try {
        if (window.pdfjsLib) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        }
        loadData();
        initDate();
        applyTheme();
        updateCurrencyLabels();
        updateUILanguage();
        setupEventListeners();
        setupViewRouter();
        renderPresetPickers();
        render();
        setupQuickTransactionEvents();

        setupAuthListeners();
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = user;
                const loginScreen = document.getElementById('login-screen');
                const appContainer = document.getElementById('app-container-el');
                if (loginScreen) loginScreen.classList.add('hidden');
                if (appContainer) appContainer.classList.remove('hidden');
                const fab = document.getElementById('floating-add-btn');
                if (fab) fab.style.display = 'flex';
                updateUserProfileUI(user);
                await loadUserData(user.uid);
            } else {
                currentUser = null;
                const loginScreen = document.getElementById('login-screen');
                const appContainer = document.getElementById('app-container-el');
                if (loginScreen) loginScreen.classList.remove('hidden');
                if (appContainer) appContainer.classList.add('hidden');
                const fab = document.getElementById('floating-add-btn');
                if (fab) fab.style.display = 'none';
            }
        });
    } catch (e) {
        console.error("Initialization failed: ", e);
    }
}

// Load Data from LocalStorage
function loadData() {
    const savedTransactions = localStorage.getItem('lumina_transactions');
    const savedBudgets = localStorage.getItem('lumina_budgets');
    const savedSettings = localStorage.getItem('lumina_settings');
    const savedSubs = localStorage.getItem('lumina_subscriptions');
    const savedCatBudgets = localStorage.getItem('lumina_category_budgets');
    const savedCustomCats = localStorage.getItem('lumina_custom_categories');
    const savedDutchPays = localStorage.getItem('lumina_dutch_pays');

    try {
        if (savedTransactions) transactions = JSON.parse(savedTransactions);
    } catch (e) { console.error("Error parsing transactions", e); }
    
    try {
        if (savedBudgets) budgets = JSON.parse(savedBudgets);
    } catch (e) { console.error("Error parsing budgets", e); }
    
    try {
        if (savedSubs) subscriptions = JSON.parse(savedSubs);
    } catch (e) { console.error("Error parsing subscriptions", e); }

    try {
        if (savedCatBudgets) categoryBudgets = JSON.parse(savedCatBudgets);
    } catch (e) { console.error("Error parsing category budgets", e); }

    try {
        if (savedCustomCats) customCategories = JSON.parse(savedCustomCats);
    } catch (e) { console.error("Error parsing custom categories", e); }

    try {
        if (savedDutchPays) dutchPays = JSON.parse(savedDutchPays);
    } catch (e) { console.error("Error parsing dutch pays", e); }

    if (savedSettings) {
        try {
            const parsed = JSON.parse(savedSettings);
            if (parsed && typeof parsed === 'object') {
                settings = { ...settings, ...parsed };
            }
        } catch (e) {
            console.error("Error parsing settings", e);
        }
    }

    if (!settings.lang || (settings.lang !== 'en' && settings.lang !== 'ko')) {
        settings.lang = 'en';
    }
    if (!settings.currency) {
        settings.currency = 'USD';
    }

    if (toggleCarryOver) toggleCarryOver.checked = settings.carryOverEnabled;
    if (toggleCarryDeficit) toggleCarryDeficit.checked = settings.carryDeficitEnabled;
    
    if (!settings.carryOverEnabled) {
        if (toggleCarryDeficit) toggleCarryDeficit.disabled = true;
        const subToggle = document.querySelector('.sub-toggle');
        if (subToggle) subToggle.classList.add('text-muted');
    }
}

// Save Data to LocalStorage
function saveData() {
    localStorage.setItem('lumina_transactions', JSON.stringify(transactions));
    localStorage.setItem('lumina_budgets', JSON.stringify(budgets));
    localStorage.setItem('lumina_settings', JSON.stringify(settings));
    localStorage.setItem('lumina_subscriptions', JSON.stringify(subscriptions));
    localStorage.setItem('lumina_category_budgets', JSON.stringify(categoryBudgets));
    localStorage.setItem('lumina_custom_categories', JSON.stringify(customCategories));
    localStorage.setItem('lumina_dutch_pays', JSON.stringify(dutchPays));
    saveToFirestore();
}

// Initialize Current Date & Inputs
function initDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    currentYearMonth = `${year}-${month}`;
    if (monthPicker) monthPicker.value = currentYearMonth;

    const day = String(now.getDate()).padStart(2, '0');
    if (txDateEl) txDateEl.value = `${year}-${month}-${day}`;
}

// Theme Application
function applyTheme() {
    if (settings.theme === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    }
    
    const themeBtnLight = document.getElementById('theme-btn-light');
    const themeBtnDark = document.getElementById('theme-btn-dark');
    if (themeBtnLight && themeBtnDark) {
        if (settings.theme === 'light') {
            themeBtnLight.classList.add('active');
            themeBtnDark.classList.remove('active');
        } else {
            themeBtnDark.classList.add('active');
            themeBtnLight.classList.remove('active');
        }
    }
    
    updateChartsColors();
}

// Format Currency dynamically based on setting
function formatCurrency(amount) {
    const currency = settings.currency || 'USD';
    const conf = CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS['USD'];
    const digits = (currency === 'KRW' || currency === 'JPY') ? 0 : 2;
    
    return new Intl.NumberFormat(conf.locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    }).format(amount);
}

function updateCurrencyLabels() {
    const currency = settings.currency || 'USD';
    const symbol = CURRENCY_SYMBOLS[currency]?.symbol || '$';
    document.querySelectorAll('.currency-label, .unit').forEach(el => {
        el.textContent = symbol;
    });
}

// Translate Entire UI Elements
function updateUILanguage() {
    const lang = settings.lang;
    const langTranslations = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = langTranslations[key];
        if (translation) {
            if (el.hasAttribute('data-count')) {
                const count = el.getAttribute('data-count') || '0';
                el.textContent = translation.replace('{n}', count);
            } else if (el.hasAttribute('data-percent')) {
                const percent = el.getAttribute('data-percent') || '0';
                el.textContent = translation.replace('{pct}', percent);
            } else {
                el.textContent = translation;
            }
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translation = langTranslations[key];
        if (translation) {
            el.placeholder = translation;
        }
    });

    if (langToggleBtn) {
        const btnSpan = langToggleBtn.querySelector('span');
        if (btnSpan) {
            btnSpan.textContent = lang === 'en' ? '한국어' : 'English';
        }
    }

    if (txCategoryEl) {
        const currentType = typeExpenseBtn && typeExpenseBtn.classList.contains('active') ? 'expense' : 'income';
        populateCategories(currentType);
    }
    
    populateSubCategories();
}

// Show Toast Alert
function showToast(messageKey, params = {}) {
    const lang = settings.lang;
    let message = TRANSLATIONS[lang][messageKey] || messageKey;
    
    Object.entries(params).forEach(([key, val]) => {
        message = message.replace(`{${key}}`, val);
    });

    if (toastMessageEl) toastMessageEl.textContent = message;
    if (toastEl) toastEl.classList.remove('hidden');
    
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        if (toastEl) toastEl.classList.add('hidden');
    }, 3000);
}

// Populate Category Dropdowns dynamically
function populateCategories(type) {
    if (!txCategoryEl) return;
    const currentVal = txCategoryEl.value;
    txCategoryEl.innerHTML = '';
    const categories = type === 'expense' ? getExpenseCategories() : getIncomeCategories();
    const lang = settings.lang;
    
    Object.entries(categories).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${value.emoji} ${value.labels[lang]}`;
        txCategoryEl.appendChild(option);
    });

    if (currentVal && categories[currentVal]) {
        txCategoryEl.value = currentVal;
    }
}

function populateSubCategories() {
    const subCategorySelect = document.getElementById('sub-category');
    if (!subCategorySelect) return;
    subCategorySelect.innerHTML = '';
    const categories = getExpenseCategories();
    const lang = settings.lang;
    
    Object.entries(categories).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${value.emoji} ${value.labels[lang]}`;
        subCategorySelect.appendChild(option);
    });
}



// Months Helpers
function getMonthsBetween(startStr, endStr) {
    const [startYear, startMonth] = startStr.split('-').map(Number);
    const [endYear, endMonth] = endStr.split('-').map(Number);
    
    const months = [];
    let y = startYear;
    let m = startMonth;
    
    while (y < endYear || (y === endYear && m <= endMonth)) {
        months.push(`${y}-${String(m).padStart(2, '0')}`);
        m++;
        if (m > 12) {
            m = 1;
            y++;
        }
    }
    return months;
}

function calculateCarryOver(targetYM) {
    if (!settings.carryOverEnabled) return 0;
    
    let allKeys = Object.keys(budgets);
    transactions.forEach(tx => {
        const ym = tx.date.substring(0, 7);
        if (!allKeys.includes(ym)) allKeys.push(ym);
    });
    
    if (allKeys.length === 0) return 0;
    allKeys.sort();
    const minYM = allKeys[0];
    
    if (minYM >= targetYM) return 0;
    
    const previousMonth = getPreviousMonthStr(targetYM);
    const monthsSequence = getMonthsBetween(minYM, previousMonth);
    
    let carriedOver = 0;
    
    monthsSequence.forEach(ym => {
        const baseBudget = budgets[ym] || 0;
        const monthExpenses = transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(ym))
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalAvailable = baseBudget + carriedOver;
        const netRemaining = totalAvailable - monthExpenses;
        const roundedRemaining = Math.round(netRemaining * 100) / 100;
        
        if (roundedRemaining > 0) {
            carriedOver = roundedRemaining;
        } else if (roundedRemaining < 0 && settings.carryDeficitEnabled) {
            carriedOver = roundedRemaining; 
        } else {
            carriedOver = 0;
        }
    });
    
    return carriedOver;
}

function getPreviousMonthStr(ymStr) {
    let [y, m] = ymStr.split('-').map(Number);
    m--;
    if (m === 0) {
        m = 12;
        y--;
    }
    return `${y}-${String(m).padStart(2, '0')}`;
}

// Routing & View Switcher
function setupViewRouter() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view-section');
    const viewTitle = document.getElementById('current-view-title');
    const sharedMonthSelector = document.getElementById('shared-month-selector');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-view');
            switchView(targetView);
        });
    });

    function switchView(targetView) {
        currentView = targetView;
        
        navButtons.forEach(btn => {
            if (btn.getAttribute('data-view') === targetView) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        views.forEach(section => {
            if (section.id === `view-${targetView}`) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });

        const lang = settings.lang;
        const viewTitleKey = `menu-${targetView}`;
        if (viewTitle) {
            viewTitle.textContent = TRANSLATIONS[lang][viewTitleKey] || targetView;
            viewTitle.setAttribute('data-i18n', viewTitleKey);
        }

        if (['dashboard', 'transactions', 'budget', 'reports'].includes(targetView)) {
            sharedMonthSelector?.classList.remove('hidden');
        } else {
            sharedMonthSelector?.classList.add('hidden');
        }

        render();
    }
}

// Main Render Hub
function render() {
    const lang = settings.lang;
    const currentMonthTx = transactions.filter(t => t.date.startsWith(currentYearMonth));
    
    const totalIncome = Math.round(currentMonthTx
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
        
    const totalExpense = Math.round(currentMonthTx
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
        
    const incomeCount = currentMonthTx.filter(t => t.type === 'income').length;
    const expenseCount = currentMonthTx.filter(t => t.type === 'expense').length;

    const baseBudget = budgets[currentYearMonth] || 0;
    const carriedOver = calculateCarryOver(currentYearMonth);
    const totalAvailableBudget = Math.round((baseBudget + carriedOver) * 100) / 100;
    const remainingBudget = Math.round((totalAvailableBudget - totalExpense) * 100) / 100;

    // Stats
    if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(totalIncome);
    if (totalExpenseEl) totalExpenseEl.textContent = formatCurrency(totalExpense);
    if (incomeCountEl) incomeCountEl.setAttribute('data-count', incomeCount);
    if (expenseCountEl) expenseCountEl.setAttribute('data-count', expenseCount);

    if (baseBudgetValEl) baseBudgetValEl.textContent = formatCurrency(baseBudget);
    if (carriedOverValEl) carriedOverValEl.textContent = (carriedOver >= 0 ? '+' : '') + formatCurrency(carriedOver);
    if (totalAvailableBudgetEl) totalAvailableBudgetEl.textContent = formatCurrency(totalAvailableBudget);
    
    if (remainingBudgetEl) remainingBudgetEl.textContent = formatCurrency(remainingBudget);
    if (inputBaseBudget) inputBaseBudget.value = baseBudget || '';

    // Remaining Card Style
    if (remainingStatusEl) {
        remainingStatusEl.removeAttribute('data-i18n');
        if (totalAvailableBudget === 0) {
            remainingStatusEl.textContent = TRANSLATIONS[lang]['status-no-budget'];
            if (remainingBudgetEl) remainingBudgetEl.className = 'stat-value text-muted';
            if (remainingCardEl) remainingCardEl.className = 'stat-card remaining-card';
            if (remainingIconEl) {
                remainingIconEl.className = 'stat-icon text-muted';
                remainingIconEl.setAttribute('data-lucide', 'pie-chart');
            }
        } else if (remainingBudget > 0) {
            remainingStatusEl.textContent = TRANSLATIONS[lang]['status-within-budget'];
            if (remainingBudgetEl) remainingBudgetEl.className = 'stat-value text-income';
            if (remainingCardEl) remainingCardEl.className = 'stat-card remaining-card';
            if (remainingIconEl) {
                remainingIconEl.className = 'stat-icon text-income';
                remainingIconEl.setAttribute('data-lucide', 'smile');
            }
        } else {
            const overBudgetVal = formatCurrency(Math.abs(remainingBudget));
            remainingStatusEl.textContent = `${TRANSLATIONS[lang]['status-over-budget']} (${overBudgetVal})`;
            if (remainingBudgetEl) remainingBudgetEl.className = 'stat-value text-expense';
            if (remainingCardEl) remainingCardEl.className = 'stat-card remaining-card';
            if (remainingIconEl) {
                remainingIconEl.className = 'stat-icon text-expense';
                remainingIconEl.setAttribute('data-lucide', 'alert-circle');
            }
        }
    }

    // Budget Progress Bar
    let usePercentage = 0;
    if (totalAvailableBudget > 0) {
        usePercentage = Math.round((totalExpense / totalAvailableBudget) * 100);
    }
    if (budgetPercentageText) budgetPercentageText.setAttribute('data-percent', usePercentage);
    if (budgetProgressBar) {
        budgetProgressBar.style.width = `${Math.min(usePercentage, 100)}%`;
        if (usePercentage < 70) {
            budgetProgressBar.style.backgroundColor = 'var(--income-color)';
        } else if (usePercentage < 100) {
            budgetProgressBar.style.backgroundColor = '#eab308';
        } else {
            budgetProgressBar.style.backgroundColor = 'var(--expense-color)';
        }
    }

    updateUILanguage();

    // Always keep dashboard widgets (Recent Transactions & Mini Chart) in sync
    renderDashboardWidgets();

    // Render active view components
    if (currentView === 'transactions') {
        renderTransactionList(currentMonthTx);
        renderDutchPayView();
    } else if (currentView === 'budget') {
        renderCategoryBudgets();
    } else if (currentView === 'subscriptions') {
        renderSubscriptionsView();
    } else if (currentView === 'reports') {
        renderReportsView(currentMonthTx);
    } else if (currentView === 'settings') {
        renderSettingsView();
        renderCustomCategoriesList();
    }

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

// ----------------- TABS IMPLEMENTATIONS -----------------

// A. Dashboard Widgets
function renderDashboardWidgets() {
    const lang = settings.lang;
    const currentMonthTx = transactions.filter(t => t.date.startsWith(currentYearMonth));
    const expenseTx = currentMonthTx.filter(t => t.type === 'expense');

    // 1. Mini Chart
    const dashboardChartCanvas = document.getElementById('dashboard-category-chart');
    const dashboardChartEmpty = document.getElementById('dashboard-chart-empty');

    if (expenseTx.length === 0) {
        if (dashboardChartCanvas) dashboardChartCanvas.classList.add('hidden');
        if (dashboardChartEmpty) dashboardChartEmpty.classList.remove('hidden');
    } else {
        if (dashboardChartEmpty) dashboardChartEmpty.classList.add('hidden');
        if (dashboardChartCanvas) {
            dashboardChartCanvas.classList.remove('hidden');
            renderMiniChart(expenseTx, dashboardChartCanvas);
        }
    }

    // 2. Recent Transactions (Last 5)
    const recentTxList = document.getElementById('dashboard-recent-tx-list');
    const recentTxEmpty = document.getElementById('dashboard-list-empty');

    if (recentTxList) {
        const sortedTx = [...transactions].sort((a, b) => {
            if (b.date !== a.date) return b.date.localeCompare(a.date);
            return b.id.localeCompare(a.id);
        });

        const recent5 = sortedTx.slice(0, 5);

        if (recent5.length === 0) {
            recentTxList.innerHTML = '';
            recentTxEmpty?.classList.remove('hidden');
        } else {
            recentTxEmpty?.classList.add('hidden');
            recentTxList.innerHTML = recent5.map(tx => {
                const isExpense = tx.type === 'expense';
                const categoriesMap = isExpense ? getExpenseCategories() : getIncomeCategories();
                const catInfo = categoriesMap[tx.category] || categoriesMap['other'];
                const catColor = catInfo ? catInfo.color : 'var(--primary-color)';
                const catEmoji = catInfo ? catInfo.emoji : '❓';
                const displayAmount = (isExpense ? '-' : '+') + formatCurrency(tx.amount);
                const amountClass = isExpense ? 'text-expense' : 'text-income';
                
                return `
                    <li class="sub-alert-item" style="border-left: 3px solid ${catColor}">
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span style="font-size: 1.1rem;">${catEmoji}</span>
                            <div style="display: flex; flex-direction: column;">
                                <span class="sub-alert-name" style="font-weight: 600;">${escapeHTML(tx.memo)}</span>
                                <span class="sub-alert-day">${tx.date} • ${catInfo ? catInfo.labels[lang] : 'Other'}</span>
                            </div>
                        </div>
                        <span class="tx-amount ${amountClass}" style="font-weight: 700;">${displayAmount}</span>
                    </li>
                `;
            }).join('');
        }
    }

    // 3. Subscriptions Alerts
    const subsList = document.getElementById('dashboard-subs-list');
    const subsEmpty = document.getElementById('dashboard-subs-empty');

    if (subsList) {
        const activeSubs = subscriptions.filter(s => s.active);

        if (activeSubs.length === 0) {
            subsList.innerHTML = '';
            subsEmpty?.classList.remove('hidden');
        } else {
            subsEmpty?.classList.add('hidden');
            subsList.innerHTML = activeSubs.map(sub => {
                const isExpense = (sub.type || 'expense') === 'expense';
                const categoriesMap = isExpense ? getExpenseCategories() : getIncomeCategories();
                const catInfo = categoriesMap[sub.category] || categoriesMap['other'];
                const catColor = catInfo ? catInfo.color : '#6366f1';
                const catEmoji = catInfo ? catInfo.emoji : (isExpense ? '📦' : '💰');
                const cycleText = sub.billingCycle === 'monthly' ? TRANSLATIONS[lang]['sub-cycle-monthly'] : TRANSLATIONS[lang]['sub-cycle-yearly'];
                const monthsEn = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                const dayText = sub.billingCycle === 'monthly'
                    ? (lang === 'ko' ? `${sub.billingDay}일` : `Day ${sub.billingDay}`)
                    : (lang === 'ko' ? `${sub.billingDay}월` : (monthsEn[sub.billingDay] || `Month ${sub.billingDay}`));
                
                const amountClass = isExpense ? 'text-expense' : 'text-income';
                const amountPrefix = isExpense ? '-' : '+';
                
                return `
                    <li class="sub-alert-item" style="border-left: 3px solid ${catColor}">
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span style="font-size: 1.1rem;">${catEmoji}</span>
                            <div style="display: flex; flex-direction: column;">
                                <span class="sub-alert-name" style="font-weight: 600;">${escapeHTML(sub.name)}</span>
                                <span class="sub-alert-day">${cycleText} • ${dayText}</span>
                            </div>
                        </div>
                        <span class="${amountClass}" style="font-weight: 700;">${amountPrefix}${formatCurrency(sub.amount)}</span>
                    </li>
                `;
            }).join('');
        }
    }
}

// B. Render Mini Chart (Donut)
function renderMiniChart(expenseTx, canvasEl) {
    const expenseCats = getExpenseCategories();
    const aggregates = {};
    Object.keys(expenseCats).forEach(k => aggregates[k] = 0);

    expenseTx.forEach(t => {
        if (aggregates[t.category] !== undefined) {
            aggregates[t.category] += t.amount;
        }
    });

    const labels = [];
    const data = [];
    const colors = [];
    const lang = settings.lang;

    Object.entries(aggregates).forEach(([key, val]) => {
        if (val > 0 && expenseCats[key]) {
            labels.push(`${expenseCats[key].emoji} ${expenseCats[key].labels[lang]}`);
            data.push(val);
            colors.push(expenseCats[key].color);
        }
    });

    if (dashboardCategoryChartInstance) {
        dashboardCategoryChartInstance.destroy();
    }

    if (typeof Chart === 'undefined') return;

    dashboardCategoryChartInstance = new Chart(canvasEl, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: settings.theme === 'dark' ? 2 : 1,
                borderColor: settings.theme === 'dark' ? '#1e293b' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: settings.theme === 'dark' ? '#cbd5e1' : '#334155',
                        boxWidth: 10,
                        font: { family: 'Noto Sans KR', size: 9 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ` ${ctx.label}: ${formatCurrency(ctx.raw)}`;
                        }
                    }
                }
            }
        }
    });
}

// C. Transactions List
function renderTransactionList(monthTransactions) {
    if (!transactionList) return;
    
    const searchVal = searchInput.value.toLowerCase().trim();
    const filterVal = filterType.value;
    const lang = settings.lang;

    let filtered = monthTransactions.filter(t => {
        const matchesSearch = t.memo.toLowerCase().includes(searchVal);
        const matchesType = filterVal === 'all' || t.type === filterVal;
        return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.id.localeCompare(a.id);
    });

    if (filteredCountEl) {
        filteredCountEl.setAttribute('data-count', filtered.length);
        filteredCountEl.textContent = TRANSLATIONS[lang]['result-count'].replace('{n}', filtered.length);
    }

    if (filtered.length === 0) {
        transactionList.innerHTML = '';
        listEmptyMessage?.classList.remove('hidden');
    } else {
        listEmptyMessage?.classList.add('hidden');
        transactionList.innerHTML = filtered.map(tx => {
            const isExpense = tx.type === 'expense';
            const categoriesMap = isExpense ? getExpenseCategories() : getIncomeCategories();
            const catInfo = categoriesMap[tx.category] || categoriesMap['other'];
            const catColor = catInfo ? catInfo.color : '#64748b';
            const catEmoji = catInfo ? catInfo.emoji : '❓';
            const displayAmount = (isExpense ? '-' : '+') + formatCurrency(tx.amount);
            const amountClass = isExpense ? 'text-expense' : 'text-income';
            
            return `
                <li class="tx-item" data-id="${tx.id}">
                    <div class="tx-left">
                        <input type="checkbox" class="tx-row-checkbox" data-id="${tx.id}" style="width: 17px; height: 17px; margin-right: 4px; cursor: pointer; flex-shrink: 0; accent-color: var(--primary-color);">
                        <div class="tx-icon-box" style="background: rgba(${hexToRgb(catColor)}, 0.12); color: ${catColor}; font-size: 1.25rem; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 10px;">
                            <span>${catEmoji}</span>
                        </div>
                        <div class="tx-info">
                            <span class="tx-memo">${escapeHTML(tx.memo)}</span>
                            <div class="tx-meta">
                                <span class="tx-date">${tx.date}</span>
                                <span class="tx-category-badge">${catInfo ? catInfo.labels[lang] : 'Other'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="tx-right" style="display: flex; align-items: center; gap: 8px;">
                        <span class="tx-amount ${amountClass}">${displayAmount}</span>
                        <div style="display: flex; gap: 4px;">
                            <button class="tx-edit-btn" aria-label="Edit">
                                <i data-lucide="edit-2"></i>
                            </button>
                            <button class="tx-delete-btn" aria-label="Delete">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                </li>
            `;
        }).join('');
    }
    
    updateDeleteSelectedUI();
}

function updateDeleteSelectedUI() {
    const selectAllCheckbox = document.getElementById('tx-select-all');
    const selectAllLabel = document.getElementById('tx-select-all-label');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    const deleteSelectedText = document.getElementById('delete-selected-btn-text');
    
    if (!deleteSelectedBtn) return;
    
    const checkboxes = document.querySelectorAll('.tx-row-checkbox');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    
    if (checkboxes.length > 0) {
        if (selectAllLabel) selectAllLabel.style.display = 'inline-flex';
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = (checkedCount === checkboxes.length && checkboxes.length > 0);
        }
    } else {
        if (selectAllLabel) selectAllLabel.style.display = 'none';
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
    }
    
    if (checkedCount > 0) {
        deleteSelectedBtn.style.display = 'inline-flex';
        if (deleteSelectedText) {
            deleteSelectedText.textContent = settings.lang === 'ko' 
                ? `선택 삭제 (${checkedCount})` 
                : `Delete Selected (${checkedCount})`;
        }
    } else {
        deleteSelectedBtn.style.display = 'none';
    }
}

// D. Category Budgets
function renderCategoryBudgets() {
    const lang = settings.lang;
    const catBudgetsList = document.getElementById('category-budgets-list');
    if (!catBudgetsList) return;
    
    const expenseCats = getExpenseCategories();
    const monthlyLimitObj = categoryBudgets[currentYearMonth] || {};
    const currentMonthTx = transactions.filter(t => t.date.startsWith(currentYearMonth) && t.type === 'expense');
    
    const spendMap = {};
    Object.keys(expenseCats).forEach(k => spendMap[k] = 0);
    currentMonthTx.forEach(t => {
        if (spendMap[t.category] !== undefined) spendMap[t.category] += t.amount;
    });

    catBudgetsList.innerHTML = Object.entries(expenseCats).map(([catKey, catVal]) => {
        const currentLimit = monthlyLimitObj[catKey] || 0;
        const currentSpend = spendMap[catKey] || 0;
        
        let statusText = '';
        let progressPercent = 0;
        
        if (currentLimit > 0) {
            progressPercent = Math.min(Math.round((currentSpend / currentLimit) * 100), 100);
            const diff = currentLimit - currentSpend;
            if (diff >= 0) {
                statusText = TRANSLATIONS[lang]['limit-remains'].replace('{amt}', formatCurrency(diff));
            } else {
                statusText = TRANSLATIONS[lang]['limit-over'].replace('{amt}', formatCurrency(Math.abs(diff)));
            }
        } else {
            statusText = TRANSLATIONS[lang]['limit-not-set'];
        }

        const isOver = currentLimit > 0 && currentSpend > currentLimit;
        const barColor = isOver ? '#ef4444' : catVal.color;
        const limitDisplayVal = currentLimit || '';
        
        return `
            <div class="category-budget-item">
                <div class="category-budget-header">
                    <div class="category-budget-info">
                        <div class="cat-budget-icon" style="background: rgba(${hexToRgb(catVal.color)}, 0.08); color: ${catVal.color}; display:flex; align-items:center; justify-content:center; font-size:1.2rem; width: 38px; height: 38px; border-radius: 8px;">
                            <span>${catVal.emoji}</span>
                        </div>
                        <div class="cat-budget-details">
                            <span class="cat-budget-name">${catVal.labels[lang]}</span>
                            <span class="cat-budget-usage-text">${formatCurrency(currentSpend)} spent / ${currentLimit > 0 ? formatCurrency(currentLimit) : TRANSLATIONS[lang]['limit-not-set']}</span>
                        </div>
                    </div>
                    <div class="category-budget-input-area">
                        <div class="cat-budget-input-wrapper">
                            <span class="unit">$</span>
                            <input type="number" class="cat-limit-input" data-category="${catKey}" placeholder="0.00" value="${limitDisplayVal}" min="0" step="0.01">
                        </div>
                        <button class="cat-budget-save-btn save-cat-budget-btn" data-category="${catKey}">${TRANSLATIONS[lang]['set-btn']}</button>
                    </div>
                </div>
                
                ${currentLimit > 0 ? `
                    <div class="category-budget-progress-row">
                        <div class="cat-progress-container">
                            <div class="cat-progress-bar" style="width: ${progressPercent}%; background-color: ${barColor}"></div>
                        </div>
                        <span class="cat-progress-percentage ${isOver ? 'text-expense' : 'text-income'}">${progressPercent}%</span>
                    </div>
                    <div class="category-budget-status-row" style="font-size: 0.8rem; font-weight:600; text-align: right; margin-top: -6px; color: ${isOver ? 'var(--expense-color)' : 'var(--text-muted)'}">
                        ${statusText}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    catBudgetsList.querySelectorAll('.save-cat-budget-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cat = e.target.getAttribute('data-category');
            const input = catBudgetsList.querySelector(`input[data-category="${cat}"]`);
            const val = parseFloat(input.value);
            
            if (!categoryBudgets[currentYearMonth]) {
                categoryBudgets[currentYearMonth] = {};
            }
            
            if (isNaN(val) || val <= 0) {
                delete categoryBudgets[currentYearMonth][cat];
            } else {
                categoryBudgets[currentYearMonth][cat] = Math.round(val * 100) / 100;
            }
            
            saveData();
            render();
            
            const catName = expenseCats[cat].labels[lang];
            showToast('toast-category-budget-saved', { cat: catName });
        });
    });
}

// Helper for dynamic subscription/income categories
function renderSubscriptionCategoryOptions() {
    const typeSelect = document.getElementById('sub-type');
    const type = typeSelect ? typeSelect.value : 'expense';
    const catSelect = document.getElementById('sub-category');
    if (!catSelect) return;
    
    const cats = type === 'expense' ? getExpenseCategories() : getIncomeCategories();
    const lang = settings.lang;
    
    let html = '';
    for (const key of Object.keys(cats)) {
        html += `<option value="${key}">${cats[key].emoji} ${cats[key].labels[lang]}</option>`;
    }
    catSelect.innerHTML = html;
}

function updateSubscriptionFormLabels() {
    const type = document.getElementById('sub-type')?.value || 'expense';
    const cycle = document.getElementById('sub-cycle')?.value || 'monthly';
    const lang = settings.lang;
    
    const subNameLabel = document.querySelector('label[for="sub-name"]');
    const subAmountLabel = document.querySelector('label[for="sub-amount"]');
    const subDateLabel = document.querySelector('label[for="sub-date"]');
    const formTitle = document.querySelector('#view-subscriptions .form-panel .section-title');
    const submitBtn = document.getElementById('sub-submit-btn');
    
    if (type === 'expense') {
        if (subNameLabel) subNameLabel.textContent = lang === 'ko' ? '서비스 이름' : 'Service Name';
        if (subAmountLabel) subAmountLabel.textContent = lang === 'ko' ? '결제 금액' : 'Payment Amount';
        if (subDateLabel) {
            subDateLabel.textContent = cycle === 'yearly'
                ? (lang === 'ko' ? '정기 결제일(월)' : 'Billing Month')
                : (lang === 'ko' ? '정기 결제일(일)' : 'Billing Day (of month)');
        }
        if (formTitle) {
            formTitle.textContent = editingSubId 
                ? (lang === 'ko' ? '구독 서비스 수정' : 'Edit Subscription')
                : (lang === 'ko' ? '구독 서비스 추가' : 'Add Subscription');
        }
        if (submitBtn) {
            submitBtn.querySelector('span').textContent = editingSubId 
                ? (lang === 'ko' ? '구독 수정' : 'Update Subscription')
                : (lang === 'ko' ? '구독 등록' : 'Register Subscription');
        }
    } else {
        if (subNameLabel) subNameLabel.textContent = lang === 'ko' ? '고정 수입 이름' : 'Income Name';
        if (subAmountLabel) subAmountLabel.textContent = lang === 'ko' ? '수입 금액' : 'Income Amount';
        if (subDateLabel) {
            subDateLabel.textContent = cycle === 'yearly'
                ? (lang === 'ko' ? '정기 입금일(월)' : 'Income Month')
                : (lang === 'ko' ? '정기 입금일(일)' : 'Income Day (of month)');
        }
        if (formTitle) {
            formTitle.textContent = editingSubId 
                ? (lang === 'ko' ? '고정 수입 수정' : 'Edit Fixed Income')
                : (lang === 'ko' ? '고정 수익 추가' : 'Add Fixed Income');
        }
        if (submitBtn) {
            submitBtn.querySelector('span').textContent = editingSubId 
                ? (lang === 'ko' ? '수입 수정' : 'Update Income')
                : (lang === 'ko' ? '수입 등록' : 'Register Income');
        }
    }
}

// E. Subscriptions View
function renderSubscriptionsView() {
    const lang = settings.lang;
    renderSubscriptionCategoryOptions();
    updateSubscriptionFormLabels();
    const listEl = document.getElementById('subscription-list');
    const emptyEl = document.getElementById('subs-empty-message');
    
    if (!listEl) return;
    
    let expenseTotal = 0;
    let incomeTotal = 0;
    subscriptions.forEach(sub => {
        if (sub.active) {
            const isExpense = (sub.type || 'expense') === 'expense';
            const amount = sub.amount;
            const monthlyEquivalent = sub.billingCycle === 'monthly' ? amount : amount / 12;
            
            if (isExpense) {
                expenseTotal += monthlyEquivalent;
            } else {
                incomeTotal += monthlyEquivalent;
            }
        }
    });
    
    const expenseEl = document.getElementById('sub-monthly-expense-val');
    const incomeEl = document.getElementById('sub-monthly-income-val');
    
    if (expenseEl) expenseEl.textContent = formatCurrency(expenseTotal);
    if (incomeEl) incomeEl.textContent = formatCurrency(incomeTotal);
    
    if (subscriptions.length === 0) {
        listEl.innerHTML = '';
        emptyEl?.classList.remove('hidden');
    } else {
        emptyEl?.classList.add('hidden');
        
        // Separate subscriptions into expenses and incomes
        const expenses = [];
        const incomes = [];
        subscriptions.forEach(sub => {
            if ((sub.type || 'expense') === 'expense') {
                expenses.push(sub);
            } else {
                incomes.push(sub);
            }
        });

        function renderGroupedList(subsList, isExpense) {
            const cats = isExpense ? getExpenseCategories() : getIncomeCategories();
            
            // Group by category
            const grouped = {};
            subsList.forEach(sub => {
                const cat = sub.category || 'other';
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(sub);
            });
            
            let listHtml = '';
            for (const catKey of Object.keys(grouped)) {
                const catInfo = cats[catKey] || cats['other'] || { labels: { ko: isExpense ? '기타 지출' : '기타 수입', en: 'Other' }, emoji: isExpense ? '📦' : '💰', color: '#64748b' };
                const catColor = catInfo.color;
                const catEmoji = catInfo.emoji;
                const catName = catInfo.labels[lang];
                const subs = grouped[catKey];
                
                // Calculate category monthly subtotal
                let catMonthly = 0;
                subs.forEach(s => {
                    if (s.active) {
                        catMonthly += s.billingCycle === 'monthly' ? s.amount : s.amount / 12;
                    }
                });
                
                // Render Category Header
                listHtml += `
                    <li class="sub-category-header" style="display:flex; align-items:center; gap:10px; padding:10px 14px; margin-top:16px; border-radius:10px; background: rgba(${hexToRgb(catColor)}, 0.08); border-left: 4px solid ${catColor};">
                        <span style="font-size:1.15rem;">${catEmoji}</span>
                        <span style="font-weight:600; color:var(--text-primary); flex:1;">${catName}</span>
                        <span style="font-size:0.82rem; color:${catColor}; font-weight:600;">${formatCurrency(catMonthly)}/mo</span>
                    </li>
                `;
                
                // Render subscription items in this category
                subs.forEach(sub => {
                    const isMonthly = sub.billingCycle === 'monthly';
                    const costDisplay = formatCurrency(sub.amount);
                    const cycleText = isMonthly ? TRANSLATIONS[lang]['sub-cycle-monthly'] : TRANSLATIONS[lang]['sub-cycle-yearly'];
                    const monthsEn = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    const dayVal = (!isMonthly && lang === 'en') ? (monthsEn[sub.billingDay] || sub.billingDay) : sub.billingDay;
                    const dateText = isMonthly 
                        ? (isExpense 
                            ? TRANSLATIONS[lang]['sub-billed-day'].replace('{day}', dayVal)
                            : TRANSLATIONS[lang]['sub-deposit-day'].replace('{day}', dayVal))
                        : (isExpense
                            ? TRANSLATIONS[lang]['sub-billed-day-yearly'].replace('{day}', dayVal)
                            : TRANSLATIONS[lang]['sub-deposit-day-yearly'].replace('{day}', dayVal));
                    
                    // Check if this subscription is already recorded for this month
                    const isRecorded = transactions.some(tx => 
                        tx.date.startsWith(currentYearMonth) && tx.subscriptionId === sub.id
                    );
                    
                    const addBtnIcon = isRecorded ? 'check-circle' : 'plus-circle';
                    const addBtnColor = isRecorded ? 'var(--text-muted)' : (isExpense ? 'var(--expense-color)' : 'var(--income-color)');
                    const addBtnTitle = isRecorded 
                        ? (lang === 'ko' ? '이번 달 추가 완료' : 'Already added to this month')
                        : (isExpense 
                            ? (lang === 'ko' ? '이번 달 지출 내역에 추가' : 'Add to this month\'s expenses')
                            : (lang === 'ko' ? '이번 달 수입 내역에 추가' : 'Add to this month\'s income'));
                    const addBtnDisabledAttr = isRecorded ? 'disabled' : '';
                    const addBtnOpacity = isRecorded ? '0.5' : '1';
                    const addBtnCursor = isRecorded ? 'not-allowed' : 'pointer';
                    
                    const amountClass = isExpense ? 'text-expense' : 'text-income';
                    
                    listHtml += `
                        <li class="subscription-item" data-id="${sub.id}">
                            <div class="subscription-info-left">
                                <div class="sub-avatar" style="background: rgba(${hexToRgb(catColor)}, 0.12); color: ${catColor}; display:flex; align-items:center; justify-content:center; font-size:1.25rem; width: 44px; height: 44px; border-radius: 10px;">
                                    <span>${catEmoji}</span>
                                </div>
                                <div class="sub-meta">
                                    <span class="sub-title-text">${escapeHTML(sub.name)}</span>
                                    <div class="sub-badge-row">
                                        <span class="sub-cycle-badge">${cycleText}</span>
                                        <span class="sub-date-badge">${dateText}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="subscription-info-right">
                                <span class="sub-cost-display ${amountClass}">${costDisplay}</span>
                                <div class="sub-actions">
                                    <button class="tx-delete-btn sub-add-ledger-btn" aria-label="Add to Ledger" 
                                            style="color: ${addBtnColor}; cursor: ${addBtnCursor}; opacity: ${addBtnOpacity};" 
                                            title="${addBtnTitle}" ${addBtnDisabledAttr}>
                                        <i data-lucide="${addBtnIcon}" style="pointer-events: none;"></i>
                                    </button>
                                    <div class="toggle-container">
                                        <label class="toggle-switch">
                                            <input type="checkbox" class="sub-status-toggle" ${sub.active ? 'checked' : ''}>
                                            <span class="slider"></span>
                                        </label>
                                    </div>
                                    <button class="tx-delete-btn sub-edit-btn" aria-label="Edit" style="color: var(--text-secondary);">
                                        <i data-lucide="pencil"></i>
                                    </button>
                                    <button class="tx-delete-btn sub-delete-btn" aria-label="Delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </div>
                        </li>
                    `;
                });
            }
            return listHtml;
        }
        
        let html = '';
        if (expenses.length > 0) {
            html += `
                <li class="sub-section-header" style="list-style: none; font-size: 0.95rem; font-weight: 700; color: var(--text-secondary); margin-top: 10px; margin-bottom: 4px; padding-left: 4px;">
                    ${lang === 'ko' ? '📉 고정 지출' : '📉 Fixed Expenses'}
                </li>
            `;
            html += renderGroupedList(expenses, true);
        }
        if (incomes.length > 0) {
            html += `
                <li class="sub-section-header" style="list-style: none; font-size: 0.95rem; font-weight: 700; color: var(--text-secondary); margin-top: 24px; margin-bottom: 4px; padding-left: 4px;">
                    ${lang === 'ko' ? '📈 고정 수입' : '📈 Fixed Income'}
                </li>
            `;
            html += renderGroupedList(incomes, false);
        }
        listEl.innerHTML = html;
    }
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

// E.5. Dutch Pay View
function renderDutchPayView() {
    const lang = settings.lang;
    if (!dutchpayList) return;

    if (dutchPays.length === 0) {
        dutchpayList.innerHTML = '';
        dutchpayEmptyMessage?.classList.remove('hidden');
    } else {
        dutchpayEmptyMessage?.classList.add('hidden');
        const expenseCats = getExpenseCategories();

        dutchpayList.innerHTML = dutchPays.map(dp => {
            const isFullySettled = dp.members.every(m => m.settled);
            const catInfo = expenseCats[dp.category] || expenseCats['other'];
            const catColor = catInfo ? catInfo.color : '#64748b';
            const catEmoji = catInfo ? catInfo.emoji : '❓';

            const formattedTotal = formatCurrency(dp.totalAmount);
            const formattedShare = formatCurrency(dp.shareAmount);

            // Generate members badges list
            const membersHtml = dp.members.map((m, index) => {
                if (m.isUser) {
                    return `
                        <li class="dutch-member-badge user-badge">
                            <i data-lucide="user" style="width:12px; height:12px;"></i>
                            <span>${escapeHTML(m.name)} (Payer)</span>
                        </li>
                    `;
                } else {
                    const statusClass = m.settled ? 'settled' : 'pending';
                    const iconName = m.settled ? 'check-circle-2' : 'clock';
                    const statusText = m.settled ? TRANSLATIONS[lang]['dutch-status-settled'] : TRANSLATIONS[lang]['dutch-status-pending'];
                    
                    return `
                        <li class="dutch-member-badge ${statusClass}" data-event-id="${dp.id}" data-member-index="${index}" title="${m.settled ? '' : 'Click to settle'}">
                            <i data-lucide="${iconName}" style="width:12px; height:12px;"></i>
                            <span>${escapeHTML(m.name)}: ${statusText}</span>
                        </li>
                    `;
                }
            }).join('');

            return `
                <li class="dutch-card ${isFullySettled ? 'fully-settled' : ''}" data-id="${dp.id}">
                    <div class="dutch-card-header">
                        <div class="dutch-card-title-group">
                            <span class="dutch-card-title">${escapeHTML(dp.title)}</span>
                            <span class="dutch-card-meta">${dp.date} • ${catEmoji} ${catInfo ? catInfo.labels[lang] : 'Other'}</span>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            ${isFullySettled ? `
                                <span class="dutch-member-badge settled" style="border-radius: 6px; font-size: 0.75rem;">
                                    ${TRANSLATIONS[lang]['dutch-fully-settled-label']}
                                </span>
                            ` : ''}
                            <button class="dutch-delete-btn" aria-label="Delete">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="dutch-card-amounts">
                        <div class="amount-item">
                            <span class="amount-label">${TRANSLATIONS[lang]['dutch-total-label']}</span>
                            <span class="amount-val text-expense">${formattedTotal}</span>
                        </div>
                        <div class="amount-item" style="text-align: right;">
                            <span class="amount-label">${TRANSLATIONS[lang]['dutch-share-label']}</span>
                            <span class="amount-val text-income">${formattedShare}</span>
                        </div>
                    </div>
                    
                    <div>
                        <div class="dutch-members-title" style="margin-bottom: 8px;">
                            ${lang === 'ko' ? '정산 참여자' : 'Participants'}
                        </div>
                        <ul class="dutch-members-list">
                            ${membersHtml}
                        </ul>
                    </div>
                </li>
            `;
        }).join('');
    }
}

// F. Reports View
function renderReportsView(monthTx) {
    const expenseTx = monthTx.filter(t => t.type === 'expense');

    if (expenseTx.length === 0 && activeChartType === 'category') {
        if (categoryChartCanvas) categoryChartCanvas.classList.add('hidden');
        if (trendChartCanvas) trendChartCanvas.classList.add('hidden');
        if (chartEmptyMessage) chartEmptyMessage.classList.remove('hidden');
        return;
    }

    if (chartEmptyMessage) chartEmptyMessage.classList.add('hidden');

    if (activeChartType === 'category') {
        if (categoryChartCanvas) categoryChartCanvas.classList.remove('hidden');
        if (trendChartCanvas) trendChartCanvas.classList.add('hidden');
        renderCategoryChart(expenseTx);
    } else {
        if (categoryChartCanvas) categoryChartCanvas.classList.add('hidden');
        if (trendChartCanvas) trendChartCanvas.classList.remove('hidden');
        renderTrendChart();
    }
}

// Render Doughnut Chart
function renderCategoryChart(expenseTransactions) {
    const lang = settings.lang;
    const expenseCats = getExpenseCategories();
    const aggregates = {};
    Object.keys(expenseCats).forEach(k => aggregates[k] = 0);

    expenseTransactions.forEach(t => {
        if (aggregates[t.category] !== undefined) {
            aggregates[t.category] += t.amount;
        }
    });

    const labels = [];
    const data = [];
    const colors = [];

    Object.entries(aggregates).forEach(([key, val]) => {
        if (val > 0 && expenseCats[key]) {
            labels.push(`${expenseCats[key].emoji} ${expenseCats[key].labels[lang]}`);
            data.push(val);
            colors.push(expenseCats[key].color);
        }
    });

    if (data.length === 0) {
        if (categoryChartCanvas) categoryChartCanvas.classList.add('hidden');
        if (chartEmptyMessage) chartEmptyMessage.classList.remove('hidden');
        return;
    }

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    if (typeof Chart === 'undefined') return;

    categoryChartInstance = new Chart(categoryChartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: settings.theme === 'dark' ? 2 : 1,
                borderColor: settings.theme === 'dark' ? '#1e293b' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: settings.theme === 'dark' ? '#cbd5e1' : '#334155',
                        font: { family: 'Noto Sans KR', size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ` ${ctx.label}: ${formatCurrency(ctx.raw)}`;
                        }
                    }
                }
            }
        }
    });
}

// Render Trend Chart
function renderTrendChart() {
    const lang = settings.lang;
    
    const months = [];
    let [y, m] = currentYearMonth.split('-').map(Number);
    for (let i = 5; i >= 0; i--) {
        let tempY = y;
        let tempM = m - i;
        if (tempM <= 0) {
            tempM += 12;
            tempY -= 1;
        }
        months.push(`${tempY}-${String(tempM).padStart(2, '0')}`);
    }

    const budgetsData = [];
    const expensesData = [];

    months.forEach(ym => {
        const base = budgets[ym] || 0;
        const carry = calculateCarryOver(ym);
        budgetsData.push(base + carry);

        const exp = transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(ym))
            .reduce((sum, t) => sum + t.amount, 0);
        expensesData.push(exp);
    });

    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    if (typeof Chart === 'undefined') return;

    const datasetLabelBudget = lang === 'ko' ? '예산(이월 포함)' : 'Budget (incl. Carryover)';
    const datasetLabelExpense = lang === 'ko' ? '지출' : 'Expenses';
    const isDark = settings.theme === 'dark';

    trendChartInstance = new Chart(trendChartCanvas, {
        type: 'bar',
        data: {
            labels: months.map(ym => {
                const monthNum = ym.substring(5);
                return lang === 'ko' ? `${Number(monthNum)}월` : `${monthNum}/${ym.substring(2, 4)}`;
            }),
            datasets: [
                {
                    label: datasetLabelBudget,
                    data: budgetsData,
                    backgroundColor: 'rgba(99, 102, 241, 0.85)',
                    borderRadius: 4
                },
                {
                    label: datasetLabelExpense,
                    data: expensesData,
                    backgroundColor: 'rgba(239, 68, 68, 0.85)',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: isDark ? '#cbd5e1' : '#334155',
                        font: { family: 'Noto Sans KR' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Outfit' } }
                },
                y: {
                    grid: { color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)' },
                    ticks: {
                        color: isDark ? '#94a3b8' : '#64748b',
                        font: { family: 'Outfit' },
                        callback: function(val) {
                            return '$' + val;
                        }
                    }
                }
            }
        }
    });
}

function updateChartsColors() {
    if (dashboardCategoryChartInstance || categoryChartInstance || trendChartInstance) {
        if (currentView === 'dashboard') {
            const currentMonthTx = transactions.filter(t => t.date.startsWith(currentYearMonth));
            const expenseTx = currentMonthTx.filter(t => t.type === 'expense');
            const dashboardChartCanvas = document.getElementById('dashboard-category-chart');
            if (expenseTx.length > 0 && dashboardChartCanvas) renderMiniChart(expenseTx, dashboardChartCanvas);
        } else if (currentView === 'reports') {
            const currentMonthTx = transactions.filter(t => t.date.startsWith(currentYearMonth));
            renderReportsView(currentMonthTx);
        }
    }
}

// G. Settings View Sync
function renderSettingsView() {
    const currencySelect = document.getElementById('settings-currency');
    if (currencySelect) currencySelect.value = settings.currency || 'USD';

    const langRadios = document.querySelectorAll('input[name="lang-radio"]');
    langRadios.forEach(radio => {
        if (radio.value === settings.lang) {
            radio.checked = true;
        }
    });
}

// H. Custom Categories Management List Rendering
function renderCustomCategoriesList() {
    const listEl = document.getElementById('custom-category-list');
    if (!listEl) return;
    
    const lang = settings.lang;
    let html = '';
    
    // System Expense Categories
    Object.entries(EXPENSE_CATEGORIES).forEach(([key, val]) => {
        html += `
            <li class="custom-cat-item">
                <div class="custom-cat-badge">
                    <span class="emoji-circle" style="background: rgba(${hexToRgb(val.color)}, 0.1); color: ${val.color}">${val.emoji}</span>
                    <span>${val.labels[lang]} (${TRANSLATIONS[lang]['type-expense']})</span>
                </div>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight:600;">System</span>
            </li>
        `;
    });
    
    // System Income Categories
    Object.entries(INCOME_CATEGORIES).forEach(([key, val]) => {
        html += `
            <li class="custom-cat-item">
                <div class="custom-cat-badge">
                    <span class="emoji-circle" style="background: rgba(${hexToRgb(val.color)}, 0.1); color: ${val.color}">${val.emoji}</span>
                    <span>${val.labels[lang]} (${TRANSLATIONS[lang]['type-income']})</span>
                </div>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight:600;">System</span>
            </li>
        `;
    });
    
    // User Custom Categories
    customCategories.forEach(cat => {
        const typeText = cat.type === 'expense' ? TRANSLATIONS[lang]['type-expense'] : TRANSLATIONS[lang]['type-income'];
        html += `
            <li class="custom-cat-item" data-id="${cat.id}">
                <div class="custom-cat-badge">
                    <span class="emoji-circle" style="background: rgba(${hexToRgb(cat.color)}, 0.1); color: ${cat.color}">${cat.emoji}</span>
                    <span>${escapeHTML(cat.labels[lang])} (${typeText})</span>
                </div>
                <button class="cat-delete-btn" aria-label="Delete Category">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
            </li>
        `;
    });
    
    listEl.innerHTML = html;
    
    // Bind Delete Handlers
    listEl.querySelectorAll('.cat-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemEl = btn.closest('.custom-cat-item');
            if (itemEl) {
                const id = itemEl.getAttribute('data-id');
                deleteCustomCategory(id);
            }
        });
    });
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

// Delete Custom Category with Data Remapping Safeguard
function deleteCustomCategory(id) {
    const lang = settings.lang;
    const confirmMsg = lang === 'ko'
        ? '이 카테고리를 삭제하시겠습니까? 이 카테고리를 사용하는 기존 거래 및 구독 내역은 "기타(Other)" 카테고리로 변경됩니다.'
        : 'Are you sure you want to delete this category? Transactions using it will be remapped to "Other".';
        
    if (confirm(confirmMsg)) {
        customCategories = customCategories.filter(c => c.id !== id);
        
        // Remap transactions
        transactions.forEach(t => {
            if (t.category === id) t.category = 'other';
        });
        
        // Remap subscriptions
        subscriptions.forEach(s => {
            if (s.category === id) s.category = 'other';
        });
        
        // Remap category budgets
        Object.keys(categoryBudgets).forEach(ym => {
            if (categoryBudgets[ym] && categoryBudgets[ym][id]) {
                categoryBudgets[ym]['other'] = (categoryBudgets[ym]['other'] || 0) + categoryBudgets[ym][id];
                delete categoryBudgets[ym][id];
            }
        });
        
        saveData();
        render();
        showToast('toast-cat-deleted');
    }
}

// Emoji and Color Presets Selector Render
function renderPresetPickers() {
    const emojiPicker = document.getElementById('new-cat-emoji-picker');
    const colorPicker = document.getElementById('new-cat-color-picker');
    
    if (emojiPicker) {
        emojiPicker.innerHTML = PRESET_EMOJIS.map(emoji => `
            <button type="button" class="emoji-pick-btn" data-emoji="${emoji}">${emoji}</button>
        `).join('');
        
        const buttons = emojiPicker.querySelectorAll('.emoji-pick-btn');
        buttons.forEach(btn => {
            const selectedVal = document.getElementById('new-cat-emoji-val').value;
            if (btn.getAttribute('data-emoji') === selectedVal) {
                btn.classList.add('selected');
            }
            
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('new-cat-emoji-val').value = btn.getAttribute('data-emoji');
            });
        });
    }
    
    if (colorPicker) {
        colorPicker.innerHTML = PRESET_COLORS.map(color => `
            <button type="button" class="color-pick-circle" data-color="${color}" style="background-color: ${color}"></button>
        `).join('');
        
        const circles = colorPicker.querySelectorAll('.color-pick-circle');
        circles.forEach(circle => {
            const selectedVal = document.getElementById('new-cat-color-val').value;
            if (circle.getAttribute('data-color') === selectedVal) {
                circle.classList.add('selected');
            }
            
            circle.addEventListener('click', () => {
                circles.forEach(c => c.classList.remove('selected'));
                circle.classList.add('selected');
                document.getElementById('new-cat-color-val').value = circle.getAttribute('data-color');
            });
        });
    }
}

// CSV Export logic
function exportToCSV() {
    if (transactions.length === 0) {
        showToast('toast-validation-error');
        return;
    }
    
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Memo'];
    const csvRows = [headers.join(',')];
    
    transactions.forEach(t => {
        const row = [
            t.date,
            t.type,
            t.category,
            t.amount,
            `"${t.memo.replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
    });
    
    const csvContent = "\uFEFF" + csvRows.join('\n'); 
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rich_mango_ledger_export_${currentYearMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// JSON Backup download
function exportToJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        transactions,
        budgets,
        subscriptions,
        categoryBudgets,
        customCategories,
        dutchPays,
        settings
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `rich_mango_ledger_backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
}

// File Import handler
function importData(file) {
    const reader = new FileReader();
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.pdf')) {
        reader.onload = async function(e) {
            try {
                const arrayBuffer = e.target.result;
                const pdfTransactions = await parsePDFStatement(arrayBuffer);
                if (pdfTransactions && pdfTransactions.length > 0) {
                    showBatchImportModal(pdfTransactions);
                } else {
                    throw new Error("No transactions found in PDF statement");
                }
            } catch(err) {
                console.error(err);
                showToast('toast-import-failed');
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                if (fileName.endsWith('.json')) {
                    const imported = JSON.parse(text);
                    if (imported.transactions && Array.isArray(imported.transactions)) transactions = imported.transactions;
                    if (imported.budgets && typeof imported.budgets === 'object') budgets = imported.budgets;
                    if (imported.subscriptions && Array.isArray(imported.subscriptions)) subscriptions = imported.subscriptions;
                    if (imported.categoryBudgets && typeof imported.categoryBudgets === 'object') categoryBudgets = imported.categoryBudgets;
                    if (imported.customCategories && Array.isArray(imported.customCategories)) customCategories = imported.customCategories;
                    if (imported.dutchPays && Array.isArray(imported.dutchPays)) {
                        dutchPays = imported.dutchPays;
                    } else {
                        dutchPays = [];
                    }
                    if (imported.settings && typeof imported.settings === 'object') settings = { ...settings, ...imported.settings };
                    
                    saveData();
                    applyTheme();
                    updateCurrencyLabels();
                    updateUILanguage();
                    renderPresetPickers();
                    render();
                    showToast('toast-data-imported');
                } else if (fileName.endsWith('.csv')) {
                    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
                    if (lines.length <= 1) throw new Error("Empty CSV");
                    
                    // Helper to split CSV line keeping quoted fields intact
                    function parseCSVLine(line) {
                        const parts = [];
                        let currentPart = '';
                        let inQuotes = false;
                        for (let j = 0; j < line.length; j++) {
                            const char = line[j];
                            if (char === '"') {
                                inQuotes = !inQuotes;
                            } else if (char === ',' && !inQuotes) {
                                parts.push(currentPart.trim().replace(/^"|"$/g, ''));
                                currentPart = '';
                            } else {
                                currentPart += char;
                            }
                        }
                        parts.push(currentPart.trim().replace(/^"|"$/g, ''));
                        return parts;
                    }

                    const headers = parseCSVLine(lines[0]);
                    const isLuminaBackup = headers.includes('Date') && headers.includes('Type') && headers.includes('Category') && headers.includes('Amount');
                    
                    if (isLuminaBackup) {
                        const dateIdx = headers.indexOf('Date');
                        const typeIdx = headers.indexOf('Type');
                        const categoryIdx = headers.indexOf('Category');
                        const amountIdx = headers.indexOf('Amount');
                        const memoIdx = headers.indexOf('Memo');
                        
                        const parsedTransactions = [];
                        for (let i = 1; i < lines.length; i++) {
                            const parts = parseCSVLine(lines[i]);
                            if (parts.length < 4) continue;
                            
                            const date = parts[dateIdx];
                            const type = parts[typeIdx].toLowerCase();
                            const category = parts[categoryIdx].toLowerCase();
                            const amount = parseFloat(parts[amountIdx]);
                            const memo = memoIdx !== -1 ? parts[memoIdx] : '';
                            
                            if (date && (type === 'income' || type === 'expense') && !isNaN(amount)) {
                                parsedTransactions.push({
                                    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + i,
                                    date,
                                    type,
                                    category,
                                    amount: Math.round(amount * 100) / 100,
                                    memo: memo || (type === 'expense' ? 'Expense' : 'Income')
                                });
                            }
                        }
                        
                        if (parsedTransactions.length > 0) {
                            transactions = [...transactions, ...parsedTransactions];
                            saveData();
                            render();
                            showToast('toast-data-imported');
                        } else {
                            throw new Error("No valid transactions found in backup");
                        }
                    } else {
                        // Try parsing as generic bank statement CSV
                        const bankTransactions = parseBankCSV(text);
                        if (bankTransactions && bankTransactions.length > 0) {
                            showBatchImportModal(bankTransactions);
                        } else {
                            throw new Error("Invalid CSV Format or missing headers");
                        }
                    }
                }
            } catch(err) {
                console.error(err);
                showToast('toast-import-failed');
            }
        };
        reader.readAsText(file);
    }
}

// Generic Bank CSV Parser
function parseBankCSV(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length <= 1) return [];
    
    function parseCSVLine(line) {
        const parts = [];
        let currentPart = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                parts.push(currentPart.trim().replace(/^"|"$/g, ''));
                currentPart = '';
            } else {
                currentPart += char;
            }
        }
        parts.push(currentPart.trim().replace(/^"|"$/g, ''));
        return parts;
    }
    
    const headers = parseCSVLine(lines[0]);
    console.log("Bank CSV Headers detected:", headers);
    
    function findHeaderIndex(candidates) {
        for (let i = 0; i < headers.length; i++) {
            const h = headers[i].toLowerCase();
            if (candidates.some(c => h.includes(c) || c.includes(h))) {
                return i;
            }
        }
        return -1;
    }
    
    const dateIdx = findHeaderIndex(['post date', 'transaction date', 'trans date', 'date', '날짜', '거래일', '일자']);
    const memoIdx = findHeaderIndex(['description', 'payee', 'merchant', 'details', 'name', '적요', '내용', '거래내역', '메모']);
    const amountIdx = findHeaderIndex(['amount', 'value', '거래금액', '금액']);
    const debitIdx = findHeaderIndex(['debit', 'charge', 'withdrawal', '출금']);
    const creditIdx = findHeaderIndex(['credit', 'payment', 'deposit', '입금']);
    
    if (dateIdx === -1 || (amountIdx === -1 && debitIdx === -1 && creditIdx === -1)) {
        console.warn("Could not find date and amount columns in CSV");
        return [];
    }
    
    const candidates = [];
    const todayStr = new Date().toISOString().substring(0, 10);
    
    for (let i = 1; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        if (parts.length < Math.max(dateIdx, memoIdx, amountIdx, debitIdx, creditIdx) + 1) continue;
        
        let dateVal = parts[dateIdx];
        let formattedDate = cleanCSVDate(dateVal);
        if (!formattedDate) formattedDate = todayStr;
        
        let memoVal = memoIdx !== -1 ? parts[memoIdx] : 'Bank Transaction';
        let amountVal = 0;
        let typeVal = 'expense';
        
        if (amountIdx !== -1) {
            let rawAmtStr = parts[amountIdx].replace(/[^0-9.-]/g, '');
            let rawAmt = parseFloat(rawAmtStr);
            if (!isNaN(rawAmt)) {
                if (rawAmt < 0) {
                    amountVal = Math.abs(rawAmt);
                    typeVal = 'expense';
                } else {
                    amountVal = rawAmt;
                    typeVal = 'income';
                }
            }
        } else {
            const debitStr = debitIdx !== -1 ? parts[debitIdx].replace(/[^0-9.-]/g, '') : '';
            const creditStr = creditIdx !== -1 ? parts[creditIdx].replace(/[^0-9.-]/g, '') : '';
            const debitVal = parseFloat(debitStr);
            const creditVal = parseFloat(creditStr);
            
            if (!isNaN(debitVal) && debitVal > 0) {
                amountVal = debitVal;
                typeVal = 'expense';
            } else if (!isNaN(creditVal) && creditVal > 0) {
                amountVal = creditVal;
                typeVal = 'income';
            } else {
                continue;
            }
        }
        
        let categoryVal = autoMatchCategory(memoVal, typeVal);
        
        if (amountVal > 0) {
            candidates.push({
                date: formattedDate,
                type: typeVal,
                category: categoryVal,
                amount: Math.round(amountVal * 100) / 100,
                memo: memoVal
            });
        }
    }
    
    return candidates;
}

// Clean date from CSV
function cleanCSVDate(dateStr) {
    if (!dateStr) return '';
    dateStr = dateStr.trim().replace(/^"|"$/g, '');
    
    const matchSlash = dateStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (matchSlash) {
        let first = matchSlash[1];
        let second = matchSlash[2];
        let year = matchSlash[3];
        if (year.length === 2) year = '20' + year;
        
        let month = first.padStart(2, '0');
        let day = second.padStart(2, '0');
        
        if (parseInt(first) > 12) {
            month = second.padStart(2, '0');
            day = first.padStart(2, '0');
        }
        return `${year}-${month}-${day}`;
    }
    
    const matchYMD = dateStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (matchYMD) {
        return `${matchYMD[1]}-${matchYMD[2].padStart(2, '0')}-${matchYMD[3].padStart(2, '0')}`;
    }
    
    return '';
}

// Auto-match categories based on memo strings
function autoMatchCategory(memo, type) {
    if (!memo) return 'other';
    const cleanMemo = memo.toLowerCase();
    
    if (type === 'income') {
        if (cleanMemo.includes('salary') || cleanMemo.includes('paycheck') || cleanMemo.includes('급여') || cleanMemo.includes('월급')) return 'salary';
        if (cleanMemo.includes('bonus') || cleanMemo.includes('보너스') || cleanMemo.includes('상여')) return 'bonus';
        if (cleanMemo.includes('dividend') || cleanMemo.includes('investment') || cleanMemo.includes('주식') || cleanMemo.includes('투자')) return 'investment';
        return 'other';
    } else {
        if (cleanMemo.includes('starbucks') || cleanMemo.includes('mcdonald') || cleanMemo.includes('coffee') || cleanMemo.includes('restaurant') || cleanMemo.includes('식당') || cleanMemo.includes('카페') || cleanMemo.includes('마트') || cleanMemo.includes('food') || cleanMemo.includes('grocery') || cleanMemo.includes('요리')) return 'food';
        if (cleanMemo.includes('uber') || cleanMemo.includes('lyft') || cleanMemo.includes('subway') || cleanMemo.includes('taxi') || cleanMemo.includes('gas') || cleanMemo.includes('주유') || cleanMemo.includes('택시') || cleanMemo.includes('버스') || cleanMemo.includes('지하철')) return 'transport';
        if (cleanMemo.includes('amazon') || cleanMemo.includes('target') || cleanMemo.includes('walmart') || cleanMemo.includes('shopping') || cleanMemo.includes('쿠팡') || cleanMemo.includes('쇼핑')) return 'shopping';
        if (cleanMemo.includes('netflix') || cleanMemo.includes('youtube') || cleanMemo.includes('spotify') || cleanMemo.includes('movie') || cleanMemo.includes('cgt') || cleanMemo.includes('영화') || cleanMemo.includes('게임')) return 'culture';
        if (cleanMemo.includes('hospital') || cleanMemo.includes('pharmacy') || cleanMemo.includes('doctor') || cleanMemo.includes('의료') || cleanMemo.includes('병원') || cleanMemo.includes('약국')) return 'medical';
        if (cleanMemo.includes('rent') || cleanMemo.includes('utility') || cleanMemo.includes('electric') || cleanMemo.includes('telecom') || cleanMemo.includes('통신') || cleanMemo.includes('수도') || cleanMemo.includes('전기') || cleanMemo.includes('월세')) return 'house';
        return 'other';
    }
}


// Transaction Edit Helpers
function startEditTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    editingTransactionId = id;

    // 1. Populate form values
    if (txDateEl) txDateEl.value = tx.date;
    if (txAmountEl) txAmountEl.value = tx.amount;
    if (txMemoEl) txMemoEl.value = tx.memo || '';

    // 2. Set type button state
    if (tx.type === 'expense') {
        typeExpenseBtn?.classList.add('active');
        typeIncomeBtn?.classList.remove('active');
    } else {
        typeIncomeBtn?.classList.add('active');
        typeExpenseBtn?.classList.remove('active');
    }

    // 3. Populate categories dropdown for that type
    populateCategories(tx.type);

    // 4. Select the category
    if (txCategoryEl) txCategoryEl.value = tx.category;

    // 5. Update UI to edit mode
    updateFormEditModeUI(true);

    // 6. Scroll form into view (helpful for mobile layout)
    document.querySelector('.form-panel')?.scrollIntoView({ behavior: 'smooth' });
}

function updateFormEditModeUI(active) {
    const lang = settings.lang;
    const formTitleEl = document.querySelector('.form-panel .section-title');
    const submitBtnSpan = document.querySelector('#submit-btn-el span');
    const submitBtnIcon = document.querySelector('#submit-btn-el i');

    if (active) {
        if (formTitleEl) {
            formTitleEl.textContent = TRANSLATIONS[lang]['edit-tx-title'];
            formTitleEl.setAttribute('data-i18n', 'edit-tx-title');
        }
        if (submitBtnSpan) {
            submitBtnSpan.textContent = TRANSLATIONS[lang]['update-btn-text'];
            submitBtnSpan.setAttribute('data-i18n', 'update-btn-text');
        }
        if (submitBtnIcon) {
            submitBtnIcon.setAttribute('data-lucide', 'check-circle');
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        }
        if (cancelEditBtn) {
            cancelEditBtn.style.display = 'block';
            cancelEditBtn.classList.remove('hidden');
        }
        // Hide Dutch Pay option when editing
        if (txDutchPayToggleWrapper) txDutchPayToggleWrapper.classList.add('hidden');
        if (txDutchPayFields) txDutchPayFields.classList.add('hidden');
        if (txDutchPayEnabledEl) txDutchPayEnabledEl.checked = false;
        if (txDutchFriendsEl) txDutchFriendsEl.value = '';
    } else {
        editingTransactionId = null;
        if (formTitleEl) {
            formTitleEl.textContent = TRANSLATIONS[lang]['add-tx-title'];
            formTitleEl.setAttribute('data-i18n', 'add-tx-title');
        }
        if (submitBtnSpan) {
            submitBtnSpan.textContent = TRANSLATIONS[lang]['submit-btn-text'];
            submitBtnSpan.setAttribute('data-i18n', 'submit-btn-text');
        }
        if (submitBtnIcon) {
            submitBtnIcon.setAttribute('data-lucide', 'plus-circle');
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        }
        if (cancelEditBtn) {
            cancelEditBtn.style.display = 'none';
            cancelEditBtn.classList.add('hidden');
        }
        if (transactionForm) {
            transactionForm.reset();
            initDate();
            typeExpenseBtn?.classList.add('active');
            typeIncomeBtn?.classList.remove('active');
            populateCategories('expense');
        }
        // Reset and show Dutch Pay option for expense by default
        if (txDutchPayToggleWrapper) txDutchPayToggleWrapper.classList.remove('hidden');
        if (txDutchPayFields) txDutchPayFields.classList.add('hidden');
        if (txDutchPayEnabledEl) txDutchPayEnabledEl.checked = false;
        if (txDutchFriendsEl) txDutchFriendsEl.value = '';
    }
}

// Global Event Listeners Setup
function setupEventListeners() {
    if (monthPicker) {
        monthPicker.addEventListener('change', (e) => {
            currentYearMonth = e.target.value;
            render();
        });
    }

    prevMonthBtn?.addEventListener('click', () => {
        let [y, m] = currentYearMonth.split('-').map(Number);
        m--;
        if (m === 0) {
            m = 12;
            y--;
        }
        currentYearMonth = `${y}-${String(m).padStart(2, '0')}`;
        if (monthPicker) monthPicker.value = currentYearMonth;
        render();
    });

    nextMonthBtn?.addEventListener('click', () => {
        let [y, m] = currentYearMonth.split('-').map(Number);
        m++;
        if (m === 13) {
            m = 1;
            y++;
        }
        currentYearMonth = `${y}-${String(m).padStart(2, '0')}`;
        if (monthPicker) monthPicker.value = currentYearMonth;
        render();
    });

    themeToggleBtn?.addEventListener('click', () => {
        settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
        saveData();
        applyTheme();
    });

    langToggleBtn?.addEventListener('click', () => {
        settings.lang = settings.lang === 'en' ? 'ko' : 'en';
        saveData();
        updateUILanguage();
        
        const langRadios = document.querySelectorAll('input[name="lang-radio"]');
        langRadios.forEach(radio => {
            if (radio.value === settings.lang) radio.checked = true;
        });

        render();
    });

    saveBudgetBtn?.addEventListener('click', () => {
        const val = parseFloat(inputBaseBudget.value);
        if (isNaN(val) || val < 0) {
            showToast('toast-budget-error');
            return;
        }
        budgets[currentYearMonth] = Math.round(val * 100) / 100;
        saveData();
        render();
        const displayMonth = currentYearMonth.substring(5);
        showToast('toast-budget-saved', { month: Number(displayMonth) });
    });

    toggleCarryOver?.addEventListener('change', (e) => {
        settings.carryOverEnabled = e.target.checked;
        if (!settings.carryOverEnabled) {
            if (toggleCarryDeficit) {
                toggleCarryDeficit.checked = false;
                toggleCarryDeficit.disabled = true;
            }
            settings.carryDeficitEnabled = false;
            document.querySelector('.sub-toggle')?.classList.add('text-muted');
        } else {
            if (toggleCarryDeficit) toggleCarryDeficit.disabled = false;
            document.querySelector('.sub-toggle')?.classList.remove('text-muted');
        }
        saveData();
        render();
        showToast(settings.carryOverEnabled ? 'toast-carry-enabled' : 'toast-carry-disabled');
    });

    toggleCarryDeficit?.addEventListener('change', (e) => {
        settings.carryDeficitEnabled = e.target.checked;
        saveData();
        render();
        showToast(settings.carryDeficitEnabled ? 'toast-deficit-enabled' : 'toast-deficit-disabled');
    });

    typeExpenseBtn?.addEventListener('click', () => {
        typeExpenseBtn.classList.add('active');
        typeIncomeBtn?.classList.remove('active');
        populateCategories('expense');
        // Show Dutch Pay toggle for expense
        if (txDutchPayToggleWrapper) txDutchPayToggleWrapper.classList.remove('hidden');
    });

    typeIncomeBtn?.addEventListener('click', () => {
        typeIncomeBtn.classList.add('active');
        typeExpenseBtn?.classList.remove('active');
        populateCategories('income');
        // Hide Dutch Pay toggle for income
        if (txDutchPayToggleWrapper) txDutchPayToggleWrapper.classList.add('hidden');
        if (txDutchPayFields) txDutchPayFields.classList.add('hidden');
        if (txDutchPayEnabledEl) txDutchPayEnabledEl.checked = false;
    });

    txDutchPayEnabledEl?.addEventListener('change', (e) => {
        if (e.target.checked) {
            txDutchPayFields?.classList.remove('hidden');
            if (txDutchFriendsEl) txDutchFriendsEl.required = true;
        } else {
            txDutchPayFields?.classList.add('hidden');
            if (txDutchFriendsEl) {
                txDutchFriendsEl.required = false;
                txDutchFriendsEl.value = '';
            }
        }
    });

    transactionForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        const type = typeExpenseBtn && typeExpenseBtn.classList.contains('active') ? 'expense' : 'income';
        const date = txDateEl.value;
        const category = txCategoryEl.value;
        const amount = parseFloat(txAmountEl.value);
        const memo = txMemoEl.value.trim();

        if (!date || !category || isNaN(amount) || amount <= 0) {
            showToast('toast-validation-error');
            return;
        }

        if (editingTransactionId) {
            const txIdx = transactions.findIndex(t => t.id === editingTransactionId);
            if (txIdx !== -1) {
                transactions[txIdx] = {
                    ...transactions[txIdx],
                    date,
                    type,
                    category,
                    amount: Math.round(amount * 100) / 100,
                    memo: memo || (type === 'expense' ? 'Expense' : 'Income')
                };
                saveData();
                updateFormEditModeUI(false);
                render();
                showToast('toast-tx-updated');
            }
        } else {
            const newTx = {
                id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                date,
                type,
                category,
                amount: Math.round(amount * 100) / 100,
                memo: memo || (type === 'expense' ? (settings.lang === 'ko' ? '지출' : 'Expense') : (settings.lang === 'ko' ? '수입' : 'Income'))
            };

            transactions.push(newTx);

            // Dutch Pay processing
            let isDutch = false;
            if (type === 'expense' && txDutchPayEnabledEl && txDutchPayEnabledEl.checked) {
                const friendsRaw = txDutchFriendsEl ? txDutchFriendsEl.value.trim() : '';
                const friendsList = friendsRaw
                    ? friendsRaw.split(',').map(f => f.trim()).filter(f => f !== '')
                    : [];
                
                if (friendsList.length > 0) {
                    isDutch = true;
                    const totalMembers = friendsList.length + 1;
                    const shareVal = Math.round((newTx.amount / totalMembers) * 100) / 100;
                    const lang = settings.lang;
                    
                    const newDutchPay = {
                        id: 'dutch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        title: newTx.memo,
                        date: newTx.date,
                        totalAmount: newTx.amount,
                        shareAmount: shareVal,
                        category: newTx.category,
                        autoLog: true,
                        expenseTxId: newTx.id,
                        members: [
                            { name: lang === 'ko' ? '나' : 'Me', isUser: true, settled: true },
                            ...friendsList.map(name => ({ name, isUser: false, settled: false }))
                        ]
                    };
                    dutchPays.push(newDutchPay);
                }
            }

            saveData();

            if (txAmountEl) txAmountEl.value = '';
            if (txMemoEl) txMemoEl.value = '';
            if (txDutchPayEnabledEl) txDutchPayEnabledEl.checked = false;
            if (txDutchFriendsEl) {
                txDutchFriendsEl.value = '';
                txDutchFriendsEl.required = false;
            }
            if (txDutchPayFields) txDutchPayFields.classList.add('hidden');

            render();
            if (isDutch) {
                showToast('toast-dutch-added');
            } else {
                showToast('toast-tx-added');
            }
        }
    });

    cancelEditBtn?.addEventListener('click', () => {
        updateFormEditModeUI(false);
    });

    searchInput?.addEventListener('input', () => {
        const currentMonthTx = transactions.filter(t => t.date.startsWith(currentYearMonth));
        renderTransactionList(currentMonthTx);
    });

    filterType?.addEventListener('change', () => {
        const currentMonthTx = transactions.filter(t => t.date.startsWith(currentYearMonth));
        renderTransactionList(currentMonthTx);
    });

    transactionList?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.tx-edit-btn');
        if (editBtn) {
            const itemEl = editBtn.closest('.tx-item');
            if (!itemEl) return;
            const id = itemEl.getAttribute('data-id');
            startEditTransaction(id);
            return;
        }

        const deleteBtn = e.target.closest('.tx-delete-btn');
        if (!deleteBtn) return;

        const itemEl = deleteBtn.closest('.tx-item');
        if (!itemEl) return;

        const id = itemEl.getAttribute('data-id');

        if (editingTransactionId === id) {
            updateFormEditModeUI(false);
        }

        itemEl.style.transition = 'opacity 0.2s, transform 0.2s';
        itemEl.style.opacity = '0';
        itemEl.style.transform = 'scale(0.9)';

        setTimeout(() => {
            transactions = transactions.filter(t => t.id !== id);
            saveData();
            render();
            showToast('toast-tx-deleted');
        }, 200);
    });

    const reportsCategoryBtn = document.getElementById('chart-tab-category');
    const reportsTrendBtn = document.getElementById('chart-tab-trend');

    reportsCategoryBtn?.addEventListener('click', () => {
        reportsCategoryBtn.classList.add('active');
        reportsTrendBtn?.classList.remove('active');
        activeChartType = 'category';
        const currentMonthTx = transactions.filter(t => t.date.startsWith(currentYearMonth));
        renderReportsView(currentMonthTx);
    });

    reportsTrendBtn?.addEventListener('click', () => {
        reportsTrendBtn.classList.add('active');
        reportsCategoryBtn?.classList.remove('active');
        activeChartType = 'trend';
        const currentMonthTx = transactions.filter(t => t.date.startsWith(currentYearMonth));
        renderReportsView(currentMonthTx);
    });

    document.getElementById('export-csv-btn')?.addEventListener('click', exportToCSV);
    document.getElementById('export-json-btn')?.addEventListener('click', exportToJSON);
    
    const fileInput = document.getElementById('import-file-input');
    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importData(file);
            e.target.value = ''; 
        }
    });

    const subscriptionForm = document.getElementById('subscription-form');
    const subTypeSelect = document.getElementById('sub-type');
    const subCycleSelect = document.getElementById('sub-cycle');
    const subDateLabel = document.querySelector('label[for="sub-date"]');
    const subDateInput = document.getElementById('sub-date');
    editingSubId = null;

    // Dynamic categories and label change when type changes
    subTypeSelect?.addEventListener('change', () => {
        renderSubscriptionCategoryOptions();
        updateSubscriptionFormLabels();
    });

    // Dynamic label change when billing cycle changes
    subCycleSelect?.addEventListener('change', () => {
        const cycle = subCycleSelect.value;
        if (subDateInput) {
            if (cycle === 'yearly') {
                subDateInput.placeholder = '1 ~ 12';
                subDateInput.max = '12';
            } else {
                subDateInput.placeholder = '1 ~ 31';
                subDateInput.max = '31';
            }
        }
        updateSubscriptionFormLabels();
    });

    subscriptionForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const type = subTypeSelect?.value || 'expense';
        const name = document.getElementById('sub-name').value.trim();
        const amount = parseFloat(document.getElementById('sub-amount').value);
        const category = document.getElementById('sub-category').value;
        const billingCycle = document.getElementById('sub-cycle').value;
        const billingDay = parseInt(document.getElementById('sub-date').value);
        const maxDay = billingCycle === 'yearly' ? 12 : 31;
        
        if (!name || isNaN(amount) || amount <= 0 || isNaN(billingDay) || billingDay < 1 || billingDay > maxDay) {
            showToast('toast-validation-error');
            return;
        }

        if (editingSubId) {
            // Update existing subscription
            const sub = subscriptions.find(s => s.id === editingSubId);
            if (sub) {
                sub.name = name;
                sub.amount = Math.round(amount * 100) / 100;
                sub.category = category;
                sub.billingCycle = billingCycle;
                sub.billingDay = billingDay;
                sub.type = type;
            }
            editingSubId = null;
            const submitBtn = document.getElementById('sub-submit-btn');
            if (submitBtn) {
                submitBtn.querySelector('span').textContent = TRANSLATIONS[settings.lang]['sub-register-btn'];
            }
        } else {
            // Add new subscription
            const newSub = {
                id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name,
                amount: Math.round(amount * 100) / 100,
                category,
                billingCycle,
                billingDay,
                type,
                active: true
            };
            subscriptions.push(newSub);
        }
        
        saveData();
        subscriptionForm.reset();
        
        // Reset type select to default
        if (subTypeSelect) {
            subTypeSelect.value = 'expense';
        }
        renderSubscriptionCategoryOptions();
        updateSubscriptionFormLabels();
        
        // Reset label back to default
        if (subDateLabel) subDateLabel.textContent = TRANSLATIONS[settings.lang]['sub-form-date'];
        if (subDateInput) { subDateInput.placeholder = '1 ~ 31'; subDateInput.max = '31'; }
        
        render();
        showToast('toast-sub-added');
    });

    const subscriptionList = document.getElementById('subscription-list');
    subscriptionList?.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.sub-delete-btn');
        if (deleteBtn) {
            const itemEl = deleteBtn.closest('.subscription-item');
            if (itemEl) {
                const id = itemEl.getAttribute('data-id');
                itemEl.style.transition = 'all 0.2s ease';
                itemEl.style.opacity = '0';
                itemEl.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    subscriptions = subscriptions.filter(s => s.id !== id);
                    saveData();
                    render();
                    showToast('toast-sub-deleted');
                }, 200);
            }
            return;
        }

        const editBtn = e.target.closest('.sub-edit-btn');
        if (editBtn) {
            const itemEl = editBtn.closest('.subscription-item');
            if (itemEl) {
                const id = itemEl.getAttribute('data-id');
                const sub = subscriptions.find(s => s.id === id);
                if (sub) {
                    editingSubId = sub.id;
                    document.getElementById('sub-name').value = sub.name;
                    document.getElementById('sub-amount').value = sub.amount;
                    
                    // Set type select first and trigger change event to rebuild category options
                    if (subTypeSelect) {
                        subTypeSelect.value = sub.type || 'expense';
                        subTypeSelect.dispatchEvent(new Event('change'));
                    }
                    
                    // Set category value now that the options exist
                    document.getElementById('sub-category').value = sub.category;
                    
                    document.getElementById('sub-cycle').value = sub.billingCycle;
                    // Trigger label update
                    subCycleSelect?.dispatchEvent(new Event('change'));
                    document.getElementById('sub-date').value = sub.billingDay;
                    const submitBtn = document.getElementById('sub-submit-btn');
                    if (submitBtn) {
                        submitBtn.querySelector('span').textContent = TRANSLATIONS[settings.lang]['sub-update-btn'];
                    }
                    // Scroll to form
                    document.getElementById('subscription-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            return;
        }

        const addLedgerBtn = e.target.closest('.sub-add-ledger-btn');
        if (addLedgerBtn) {
            if (addLedgerBtn.disabled || addLedgerBtn.hasAttribute('disabled')) {
                return;
            }
            const itemEl = addLedgerBtn.closest('.subscription-item');
            if (itemEl) {
                const id = itemEl.getAttribute('data-id');
                const sub = subscriptions.find(s => s.id === id);
                if (sub) {
                    const [y, m] = currentYearMonth.split('-').map(Number);
                    const daysInMonth = new Date(y, m, 0).getDate();
                    let dayNum = 1;
                    if (sub.billingCycle === 'monthly') {
                        dayNum = Math.min(sub.billingDay, daysInMonth);
                    }
                    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    
                    const subType = sub.type || 'expense';
                    const newTx = {
                        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        date: dateStr,
                        type: subType === 'expense' ? 'expense' : 'income',
                        category: sub.category,
                        amount: sub.amount,
                        memo: sub.name,
                        subscriptionId: sub.id
                    };
                    
                    transactions.push(newTx);
                    saveData();
                    render();
                    showToast('toast-tx-added');
                }
            }
            return;
        }

        const statusToggle = e.target.closest('.sub-status-toggle');
        if (statusToggle) {
            const itemEl = statusToggle.closest('.subscription-item');
            if (itemEl) {
                const id = itemEl.getAttribute('data-id');
                const sub = subscriptions.find(s => s.id === id);
                if (sub) {
                    sub.active = statusToggle.checked;
                    saveData();
                    render();
                    showToast('toast-sub-status-changed');
                }
            }
        }
    });



    dutchpayList?.addEventListener('click', (e) => {
        // Delete button
        const deleteBtn = e.target.closest('.dutch-delete-btn');
        if (deleteBtn) {
            const cardEl = deleteBtn.closest('.dutch-card');
            if (cardEl) {
                const id = cardEl.getAttribute('data-id');
                const dpIndex = dutchPays.findIndex(dp => dp.id === id);
                if (dpIndex !== -1) {
                    const dp = dutchPays[dpIndex];
                    
                    // Remap/Delete transactions linked to this dutchpay
                    if (dp.expenseTxId) {
                        transactions = transactions.filter(t => t.id !== dp.expenseTxId);
                    }
                    dp.members.forEach(m => {
                        if (m.incomeTxId) {
                            transactions = transactions.filter(t => t.id !== m.incomeTxId);
                        }
                    });
                    
                    // Remove from list
                    dutchPays.splice(dpIndex, 1);
                    saveData();
                    render();
                    showToast('toast-dutch-deleted');
                }
            }
            return;
        }
        
        // Member pending badge click to settle
        const pendingBadge = e.target.closest('.dutch-member-badge.pending');
        if (pendingBadge) {
            const dpId = pendingBadge.getAttribute('data-event-id');
            const memberIndex = parseInt(pendingBadge.getAttribute('data-member-index'));
            
            const dp = dutchPays.find(item => item.id === dpId);
            if (dp && dp.members[memberIndex]) {
                const member = dp.members[memberIndex];
                member.settled = true;
                
                // If autolog is enabled, create income transaction
                if (dp.autoLog) {
                    const incomeTxId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    member.incomeTxId = incomeTxId;
                    
                    const today = new Date();
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    
                    const lang = settings.lang;
                    const newTx = {
                        id: incomeTxId,
                        date: todayStr,
                        type: 'income',
                        category: 'other',
                        amount: dp.shareAmount,
                        memo: lang === 'ko'
                            ? `[더치페이] ${member.name} (${dp.title})`
                            : `[Split] ${member.name} (${dp.title})`
                    };
                    transactions.push(newTx);
                }
                
                saveData();
                render();
                showToast('toast-dutch-settle-member', { name: member.name });
            }
        }
    });

    const settingsCurrency = document.getElementById('settings-currency');
    settingsCurrency?.addEventListener('change', (e) => {
        settings.currency = e.target.value;
        saveData();
        updateCurrencyLabels();
        render();
    });

    const langRadios = document.querySelectorAll('input[name="lang-radio"]');
    langRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            settings.lang = e.target.value;
            saveData();
            updateUILanguage();
            render();
        });
    });

    const settingsThemeLight = document.getElementById('theme-btn-light');
    settingsThemeLight?.addEventListener('click', () => {
        settings.theme = 'light';
        saveData();
        applyTheme();
    });

    const settingsThemeDark = document.getElementById('theme-btn-dark');
    settingsThemeDark?.addEventListener('click', () => {
        settings.theme = 'dark';
        saveData();
        applyTheme();
    });

    // Custom Category addition form handler
    const customCatForm = document.getElementById('custom-category-form');
    customCatForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('new-cat-name');
        const name = nameInput.value.trim();
        const type = document.getElementById('new-cat-type').value;
        const emoji = document.getElementById('new-cat-emoji-val').value;
        const color = document.getElementById('new-cat-color-val').value;
        
        if (!name) return;
        
        const expenseCats = getExpenseCategories();
        const incomeCats = getIncomeCategories();
        const allNames = [
            ...Object.values(expenseCats).map(c => c.labels.ko.toLowerCase()),
            ...Object.values(expenseCats).map(c => c.labels.en.toLowerCase()),
            ...Object.values(incomeCats).map(c => c.labels.ko.toLowerCase()),
            ...Object.values(incomeCats).map(c => c.labels.en.toLowerCase())
        ];
        
        if (allNames.includes(name.toLowerCase())) {
            showToast('toast-cat-duplicate');
            return;
        }
        
        const newId = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const newCat = {
            id: newId,
            type,
            labels: { ko: name, en: name }, 
            emoji,
            color
        };
        
        customCategories.push(newCat);
        saveData();
        nameInput.value = '';
        
        render();
        showToast('toast-cat-added');
    });

    document.getElementById('force-reload-btn')?.addEventListener('click', () => {
        window.location.reload(true);
    });

    document.getElementById('reset-all-data-btn')?.addEventListener('click', () => {
        const lang = settings.lang;
        const confirmMsg = lang === 'ko' 
            ? '모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.' 
            : 'Are you sure you want to delete all data? This action cannot be undone.';
        
        if (confirm(confirmMsg)) {
            localStorage.clear();
            transactions = [];
            budgets = {};
            subscriptions = [];
            categoryBudgets = {};
            customCategories = [];
            dutchPays = [];
            settings = {
                carryOverEnabled: true,
                carryDeficitEnabled: false,
                theme: 'dark',
                lang: 'en',
                currency: 'USD'
            };
            saveData();
            applyTheme();
            render();
            showToast('toast-data-reset');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    });

    // Receipt Scanner Event Listeners
    receiptDropzone?.addEventListener('click', () => {
        receiptFileInput?.click();
    });

    receiptFileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleReceiptFile(file);
        }
    });

    receiptDropzone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        receiptDropzone.classList.add('dragover');
    });

    receiptDropzone?.addEventListener('dragleave', () => {
        receiptDropzone.classList.remove('dragover');
    });

    receiptDropzone?.addEventListener('drop', (e) => {
        e.preventDefault();
        receiptDropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleReceiptFile(file);
        }
    });

    scanCancelBtn?.addEventListener('click', () => {
        resetReceiptScanner();
    });

    // Select All Checkbox event listener
    const selectAllCheckbox = document.getElementById('tx-select-all');
    selectAllCheckbox?.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.tx-row-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
        });
        updateDeleteSelectedUI();
    });

    // Transaction List Checkbox change delegation
    transactionList?.addEventListener('change', (e) => {
        if (e.target.classList.contains('tx-row-checkbox')) {
            updateDeleteSelectedUI();
        }
    });

    // Delete Selected Button event listener
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    deleteSelectedBtn?.addEventListener('click', () => {
        const checkedCheckboxes = document.querySelectorAll('.tx-row-checkbox:checked');
        const idsToDelete = Array.from(checkedCheckboxes).map(cb => cb.getAttribute('data-id'));
        
        if (idsToDelete.length === 0) return;

        const lang = settings.lang;
        const confirmMsg = lang === 'ko'
            ? `선택한 ${idsToDelete.length}개의 내역을 정말 삭제하시겠습니까?`
            : `Are you sure you want to delete the ${idsToDelete.length} selected transactions?`;

        if (confirm(confirmMsg)) {
            // Apply scale-down / fade-out animations to the items being deleted
            idsToDelete.forEach(id => {
                const itemEl = transactionList.querySelector(`.tx-item[data-id="${id}"]`);
                if (itemEl) {
                    itemEl.style.transition = 'opacity 0.2s, transform 0.2s';
                    itemEl.style.opacity = '0';
                    itemEl.style.transform = 'scale(0.9)';
                }
            });

            setTimeout(() => {
                transactions = transactions.filter(t => !idsToDelete.includes(t.id));
                
                if (idsToDelete.includes(editingTransactionId)) {
                    updateFormEditModeUI(false);
                }

                saveData();
                render();
                showToast('toast-selected-deleted');
                if (selectAllCheckbox) selectAllCheckbox.checked = false;
            }, 200);
        }
    });

    registerBatchImportEvents();
}

// Quick Transaction Floating Button & Modal Events
function setupQuickTransactionEvents() {
    const fab = document.getElementById('floating-add-btn');
    const modal = document.getElementById('quick-tx-modal');
    const closeBtn = document.getElementById('quick-tx-close-btn');
    const cancelBtn = document.getElementById('quick-tx-cancel-btn');
    const form = document.getElementById('quick-tx-form');
    const typeSelect = document.getElementById('quick-tx-type');
    const catSelect = document.getElementById('quick-tx-category');

    function populateCategories() {
        const type = typeSelect ? typeSelect.value : 'expense';
        const cats = type === 'expense' ? getExpenseCategories() : getIncomeCategories();
        const lang = settings.lang;
        
        let html = '';
        for (const key of Object.keys(cats)) {
            html += `<option value="${key}">${cats[key].emoji} ${cats[key].labels[lang]}</option>`;
        }
        if (catSelect) catSelect.innerHTML = html;
    }

    typeSelect?.addEventListener('change', populateCategories);

    fab?.addEventListener('click', () => {
        // Set date input to today
        const todayStr = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('quick-tx-date');
        if (dateInput) dateInput.value = todayStr;

        // Reset inputs
        if (form) form.reset();
        if (typeSelect) typeSelect.value = 'expense';
        populateCategories();

        // Show modal
        modal?.classList.remove('hidden');
    });

    function hideModal() {
        modal?.classList.add('hidden');
    }

    closeBtn?.addEventListener('click', hideModal);
    cancelBtn?.addEventListener('click', hideModal);

    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        const date = document.getElementById('quick-tx-date').value;
        const type = typeSelect.value;
        const category = catSelect.value;
        const amount = parseFloat(document.getElementById('quick-tx-amount').value);
        const memo = document.getElementById('quick-tx-memo').value.trim();

        if (!date || !type || !category || isNaN(amount) || amount <= 0 || !memo) {
            showToast('toast-validation-error');
            return;
        }

        const newTx = {
            id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            date,
            type,
            category,
            amount: Math.round(amount * 100) / 100,
            memo
        };

        transactions.push(newTx);
        saveData();
        render();
        hideModal();
        showToast('toast-tx-added');
    });
}

// Receipt OCR Handlers
let ocrWorker = null;

function handleReceiptFile(file) {
    if (!receiptPreviewImg || !receiptScanStatus || !receiptDropzone) return;
    
    receiptDropzone.classList.add('hidden');
    receiptScanStatus.classList.remove('hidden');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        receiptPreviewImg.src = e.target.result;
        startReceiptOCR(e.target.result);
    };
    reader.readAsDataURL(file);
}

function resetReceiptScanner() {
    if (receiptFileInput) receiptFileInput.value = '';
    if (receiptPreviewImg) receiptPreviewImg.src = '';
    if (receiptScanStatus) receiptScanStatus.classList.add('hidden');
    if (receiptDropzone) receiptDropzone.classList.remove('hidden');
    if (scanProgressBarFg) scanProgressBarFg.style.width = '0%';
    if (scanStatusText) scanStatusText.textContent = '';
    
    if (ocrWorker) {
        try {
            ocrWorker.terminate();
        } catch(e) {
            console.error(e);
        }
        ocrWorker = null;
    }
}

async function startReceiptOCR(imageSrc) {
    const lang = settings.lang;
    scanStatusText.textContent = lang === 'ko' ? '엔진 로드 중...' : 'Loading OCR Engine...';
    scanProgressBarFg.style.width = '10%';
    
    try {
        const result = await Tesseract.recognize(
            imageSrc,
            'kor+eng',
            {
                logger: m => {
                    if (m && m.status === 'recognizing text') {
                        const pct = Math.round(m.progress * 100);
                        const statusMsg = lang === 'ko' 
                            ? `텍스트 인식 중... (${pct}%)` 
                            : `Recognizing text... (${pct}%)`;
                        scanStatusText.textContent = statusMsg;
                        scanProgressBarFg.style.width = `${10 + pct * 0.9}%`;
                    }
                }
            }
        );
        
        const text = result.data.text;
        console.log("OCR Recognized Text:\n", text);
        
        scanStatusText.textContent = lang === 'ko' ? '분석 완료!' : 'Analysis complete!';
        scanProgressBarFg.style.width = '100%';
        
        const candidates = parseMultiTransactionOCR(text);
        if (candidates.length >= 2) {
            showBatchImportModal(candidates);
        } else {
            parseReceiptText(text);
            showToast('toast-receipt-success');
        }
        
        setTimeout(() => {
            resetReceiptScanner();
        }, 1500);
    } catch (err) {
        console.error("OCR Analysis failed:", err);
        scanStatusText.textContent = lang === 'ko' ? '분석 실패' : 'Analysis failed';
        showToast('toast-receipt-error');
        setTimeout(() => {
            resetReceiptScanner();
        }, 2000);
    }
}

function parseReceiptText(text) {
    if (!text) return;
    
    const lang = settings.lang;
    let parsedDate = '';
    let parsedAmount = 0;
    let parsedMemo = '';
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // 1. DATE PARSING
    const dateRegex1 = /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/;
    const dateRegex2 = /\b(\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/;
    
    for (const line of lines) {
        let match = line.match(dateRegex1);
        if (match) {
            const y = match[1];
            const m = match[2].padStart(2, '0');
            const d = match[3].padStart(2, '0');
            if (parseInt(m) >= 1 && parseInt(m) <= 12 && parseInt(d) >= 1 && parseInt(d) <= 31) {
                parsedDate = `${y}-${m}-${d}`;
                break;
            }
        }
        match = line.match(dateRegex2);
        if (match) {
            const y = '20' + match[1];
            const m = match[2].padStart(2, '0');
            const d = match[3].padStart(2, '0');
            if (parseInt(m) >= 1 && parseInt(m) <= 12 && parseInt(d) >= 1 && parseInt(d) <= 31) {
                parsedDate = `${y}-${m}-${d}`;
                break;
            }
        }
    }
    
    if (!parsedDate) {
        const today = new Date();
        parsedDate = today.toISOString().substring(0, 10);
    }
    
    // 2. AMOUNT PARSING
    const totalKeywords = [
        '합계', '결제금액', '승인금액', '결제 금액', '승인 금액', '총금액', '총 금액', '총액', 
        '받을금액', '합 계', '결 제 금 액', '승 인 금 액',
        'total', 'total amount', 'amount due', 'net total', 'grand total', 'subtotal', 'charge', 'cash'
    ];
    
    let amountFound = false;
    for (const line of lines) {
        // Skip disclaimer, URL, and phone lines entirely
        if (isDisclaimerOrPhoneLine(line)) {
            continue;
        }
        const lowerLine = line.toLowerCase();
        const hasKeyword = totalKeywords.some(keyword => lowerLine.includes(keyword));
        if (hasKeyword) {
            const numberRegex = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g;
            let match;
            const validNums = [];
            while ((match = numberRegex.exec(line)) !== null) {
                const numStr = match[0];
                const cleanNum = numStr.replace(/,/g, '');
                const val = parseFloat(cleanNum);
                if (isNaN(val) || val <= 0) continue;
                
                // Validate matched amount and filter phone/zip/disclaimer
                if (!isValidAmountMatch(match, line)) continue;
                if (isPhoneOrZipOrDisclaimerNumber(val, numStr, line, text)) continue;
                
                validNums.push(val);
            }
            if (validNums.length > 0) {
                parsedAmount = Math.max(...validNums);
                amountFound = true;
                break;
            }
        }
    }
    
    if (!amountFound) {
        let maxVal = 0;
        const numberRegex = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g;
        let match;
        while ((match = numberRegex.exec(text)) !== null) {
            const numStr = match[0];
            const matchIndex = match.index;
            const cleanNum = numStr.replace(/,/g, '');
            const val = parseFloat(cleanNum);
            
            if (isNaN(val)) continue;
            if (val >= 2020 && val <= 2030) continue;
            if (parsedDate.includes(String(Math.floor(val)))) continue;
            if (val > 100000000) continue;
            
            // Get the line containing this match
            const lineStart = text.lastIndexOf('\n', matchIndex) + 1;
            let lineEnd = text.indexOf('\n', matchIndex);
            if (lineEnd === -1) lineEnd = text.length;
            const contextLine = text.substring(lineStart, lineEnd).trim();
            
            // Filter out phone numbers, zip codes, and disclaimer numbers
            if (isDisclaimerOrPhoneLine(contextLine)) continue;
            if (!isValidAmountMatch(match, contextLine)) continue;
            if (isPhoneOrZipOrDisclaimerNumber(val, numStr, contextLine, text)) continue;
            
            if (val > maxVal) {
                maxVal = val;
            }
        }
        parsedAmount = maxVal;
    }
    
    // 3. MEMO / STORE NAME PARSING
    const noiseWords = [
        '영수증', '매출영수증', '신용카드', '전표', '매출표', 'receipt', 'customer', 'duplicate', 'tax invoice',
        '일련번호', '가맹점', '대표자', '사업자', '주소', 'tel', '전화', '주식회사', '합계', '금액'
    ];
    
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        
        const isNoise = noiseWords.some(noise => lowerLine.includes(noise));
        const hasAddress = /동|길|로|구|시|번지|address/i.test(lowerLine);
        const hasPhone = /\d{2,4}-\d{3,4}-\d{4}/.test(lowerLine);
        const hasDate = /\d{2,4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(lowerLine);
        const isNumberOnly = /^[0-9,.\-\s]+$/.test(line);
        
        if (!isNoise && !hasAddress && !hasPhone && !hasDate && !isNumberOnly && line.length > 2) {
            parsedMemo = line;
            break;
        }
    }
    
    if (!parsedMemo) {
        parsedMemo = lang === 'ko' ? '영수증 지출' : 'Receipt Expense';
    } else {
        parsedMemo = parsedMemo.replace(/^[^\w가-힣]+|[^\w가-힣]+$/g, '').trim();
        if (parsedMemo.length > 25) {
            parsedMemo = parsedMemo.substring(0, 25) + '...';
        }
    }
    
    // 4. POPULATE FORM
    if (txDateEl) {
        txDateEl.value = parsedDate;
        txDateEl.classList.add('field-highlight');
    }
    
    if (txAmountEl && parsedAmount > 0) {
        txAmountEl.value = parsedAmount;
        txAmountEl.classList.add('field-highlight');
    }
    
    if (txMemoEl) {
        txMemoEl.value = parsedMemo;
        txMemoEl.classList.add('field-highlight');
    }
    
    setTimeout(() => {
        txDateEl?.classList.remove('field-highlight');
        txAmountEl?.classList.remove('field-highlight');
        txMemoEl?.classList.remove('field-highlight');
    }, 1500);
}

// Helpers
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '100, 100, 100';
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Helper to check if a line is likely just disclaimer, contact, or phone info
function isDisclaimerOrPhoneLine(line) {
    if (!line) return false;
    const lower = line.toLowerCase();
    
    // 1. Phone number patterns:
    // Matches 1-800-120-8488, 010-1234-5678, 02-123-4567, 120-8488, 1800-120-8488
    const phoneRegexes = [
        /\b\d{2,4}-\d{3,4}-\d{4}\b/,
        /\b1[-.\s]?[89]00[-.\s]?\d{3}[-.\s]?\d{4}\b/i,
        /\b1-8\d{2}-\d{3}-\d{4}\b/i,
        /\b\d{3,4}-\d{4}\b/
    ];
    for (const regex of phoneRegexes) {
        if (regex.test(line)) return true;
    }
    
    // 2. URLs & Email addresses
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(line)) return true;
    if (/https?:\/\/\S+|www\.\S+/i.test(line)) return true;
    
    // 3. Address prefix with ZIP code, e.g. "우편번호: 120-848" or "우편번호 120848"
    const zipLabelRegex = /\b(?:zip|postal|우편)(?:번호)?\b[:\s]*\d+/i;
    if (zipLabelRegex.test(line)) return true;
    
    // 4. Contact/Disclaimer keywords accompanied by numbers
    const disclaimerKeywords = [
        'tel', 'phone', 'contact', 'call', 'fax', 'email', 'e-mail',
        '전화', '문의', '고객센터', '팩스', '이메일', '사업자', '등록번호', '대표자', '대표',
        'copyright', 'all rights reserved', 'disclaimer', '약관', '회원'
    ];
    if (/\d/.test(line)) {
        if (disclaimerKeywords.some(kw => lower.includes(kw))) {
            return true;
        }
    }
    
    return false;
}

// Helper to validate the matched amount boundaries and exclude separators in dates, phone numbers, or business numbers
function isValidAmountMatch(amtMatch, line) {
    if (!amtMatch) return false;
    const matchedStr = amtMatch[0];
    const matchIndex = amtMatch.index;
    
    // 1. If the match starts with a sign like '-' or '+', make sure it is not preceded by a digit or word character.
    // e.g. in "1-800-120-8488", if we matched "-120", the character before '-' is '0'.
    if (matchedStr.startsWith('-') || matchedStr.startsWith('+')) {
        if (matchIndex > 0) {
            const charBefore = line[matchIndex - 1];
            if (/[\w\d]/.test(charBefore)) {
                return false;
            }
        }
    }
    
    // 2. Check if the matched string is part of a larger hyphenated or dot-separated sequence of digits (like phone/date/ZIP).
    // If the character before the match is '-' or '.', and before that is another digit, it's a separator.
    const charBefore = matchIndex > 0 ? line[matchIndex - 1] : '';
    const charAfter = matchIndex + matchedStr.length < line.length ? line[matchIndex + matchedStr.length] : '';
    
    if (charBefore === '-' || charBefore === '.') {
        if (matchIndex > 1 && /\d/.test(line[matchIndex - 2])) {
            return false;
        }
    }
    
    // If the character after the match is '-' or '.', and after that is another digit, it's a separator.
    if (charAfter === '-' || charAfter === '.') {
        if (matchIndex + matchedStr.length + 1 < line.length && /\d/.test(line[matchIndex + matchedStr.length + 1])) {
            if (charAfter === '-' || (charAfter === '.' && !matchedStr.includes('.'))) {
                return false;
            }
        }
    }
    
    return true;
}

// Helper to determine if a parsed numeric value looks like a phone number, ZIP code, or business ID
function isPhoneOrZipOrDisclaimerNumber(val, matchedStr, line, fullText) {
    const lowerLine = line ? line.toLowerCase() : '';
    const valStr = String(Math.round(val));
    
    // If it has a currency symbol, it's definitely an amount
    if (/[$₩€£]/.test(matchedStr) || /[$₩€£]/.test(line)) {
        return false;
    }
    
    // If it has commas (e.g. 3,500,000), it's highly likely a formatted amount, not a phone number
    if (matchedStr.includes(',')) {
        return false;
    }
    
    // 1. Phone number patterns with separators
    const phoneRegexes = [
        /\b\d{2,4}-\d{3,4}-\d{4}\b/,
        /\b1[-.\s]?[89]00[-.\s]?\d{3}[-.\s]?\d{4}\b/i,
        /\b1-8\d{2}-\d{3}-\d{4}\b/i,
        /\b\d{3,4}-\d{4}\b/
    ];
    for (const regex of phoneRegexes) {
        if (regex.test(line)) {
            const phoneMatch = line.match(regex);
            if (phoneMatch && phoneMatch[0].replace(/[^0-9]/g, '').includes(matchedStr.replace(/[^0-9]/g, ''))) {
                return true;
            }
        }
    }
    
    // 2. Specific phone number digit patterns (without separators)
    if (/^(?:1800|1888|1877|1866|1855|1844|010|080|070|050|02)\d{5,9}$/.test(valStr)) {
        return true;
    }
    
    // 3. ZIP Code validation (5 or 6 digits)
    if (valStr.length === 5 || valStr.length === 6) {
        const addressKeywords = ['zip', 'postal', '우편', '주소', 'address', 'addr', ' road', ' street', '동', '구', '시', '로', '길'];
        if (addressKeywords.some(kw => lowerLine.includes(kw))) {
            return true;
        }
    }
    
    return false;
}

// Multi-row OCR text parser
function parseMultiTransactionOCR(linesOrText, isStatement = false) {
    let lines = [];
    if (Array.isArray(linesOrText)) {
        lines = linesOrText.map(line => line.trim()).filter(line => line.length > 0);
    } else {
        if (!linesOrText) return [];
        lines = linesOrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }
    const candidates = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    
    const datePatterns = [
        /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/, // 2026-05-24
        /\b(\d{1,2})[-/.](\d{1,2})\b/,                // 05/24 or 5/24
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{1,2})\b/i, // May 24
        /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i     // 24 May
    ];
    
    // Matches $12.34 or 15,000 or -45.00
    // Modified to use lookbehinds (?<!\w) to prevent matching signs that are separators in dates or phone numbers
    const amountPattern = /(?:(?<!\w)[-+$₩€£]*)?\b\d{1,3}(?:,\d{3})*(?:\.\d{2})\b|(?<!\w)(?:[-+$₩€£]+)\s*\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b|\b\d{1,3}(?:,\d{3})+\b/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (isStatement) {
            const lowerLine = line.toLowerCase();
            const boilerplateKeywords = [
                'limit', 'available', 'warning', 'due date', 'closing date', 'summary', 
                'payment due', 'new balance', 'previous balance', 'minimum payment', 
                'rewards', 'customer service', 'interest charged', 'fees charged', 
                'cash advance', 'account notifications', 'page '
            ];
            if (boilerplateKeywords.some(kw => lowerLine.includes(kw))) {
                continue;
            }
        }
        
        // Skip disclaimer, URL, and phone lines entirely before parsing amounts
        if (isDisclaimerOrPhoneLine(line)) {
            continue;
        }
        
        const amtMatch = line.match(amountPattern);
        if (!amtMatch) continue;
        
        const rawAmountStr = amtMatch[0];
        
        // Validate the matched amount context and boundaries
        if (!isValidAmountMatch(amtMatch, line)) {
            continue;
        }
        
        let amount = parseFloat(rawAmountStr.replace(/[^0-9.-]/g, ''));
        if (isNaN(amount) || amount === 0) continue;
        
        // Additional check for phone/ZIP/disclaimer formats
        if (isPhoneOrZipOrDisclaimerNumber(amount, rawAmountStr, line, linesOrText)) {
            continue;
        }
        
        let type = 'expense';
        if (rawAmountStr.includes('+')) {
            type = 'income';
        }
        amount = Math.abs(amount);
        
        let foundDate = '';
        let dateLineIndex = -1;
        
        if (isStatement) {
            for (const pattern of datePatterns) {
                const dateMatch = line.match(pattern);
                if (dateMatch) {
                    const cleaned = cleanOCRDate(dateMatch[0], currentYear);
                    if (cleaned) {
                        foundDate = dateMatch[0];
                        dateLineIndex = i;
                        break;
                    }
                }
            }
            if (!foundDate) {
                continue;
            }
        } else {
            for (let offset = -2; offset <= 2; offset++) {
                const checkIndex = i + offset;
                if (checkIndex < 0 || checkIndex >= lines.length) continue;
                
                const checkLine = lines[checkIndex];
                
                for (const pattern of datePatterns) {
                    const dateMatch = checkLine.match(pattern);
                    if (dateMatch) {
                        foundDate = dateMatch[0];
                        dateLineIndex = checkIndex;
                        break;
                    }
                }
                if (foundDate) break;
            }
        }
        
        let formattedDate = '';
        if (foundDate) {
            formattedDate = cleanOCRDate(foundDate, currentYear);
        } else {
            formattedDate = today.toISOString().substring(0, 10);
        }
        
        let memo = '';
        const linesToSearch = [];
        if (isStatement) {
            linesToSearch.push(line);
        } else {
            if (dateLineIndex !== -1) {
                linesToSearch.push(lines[dateLineIndex]);
            }
            linesToSearch.push(line);
            if (i - 1 >= 0 && i - 1 !== dateLineIndex) linesToSearch.unshift(lines[i - 1]);
            if (i + 1 < lines.length && i + 1 !== dateLineIndex) linesToSearch.push(lines[i + 1]);
        }
        
        const noiseWords = [
            'balance', 'available', 'pending', 'card', 'ending', 'amount', 'date', 'description',
            '합계', '잔액', '이체', '결제', '출금', '입금', '승인', '일시', '가맹점', 'total'
        ];
        
        for (let searchLine of linesToSearch) {
            let cleanLine = searchLine
                .replace(amountPattern, '')
                .replace(/[-+$₩€£]/g, '')
                .replace(/\b\d{1,2}[-/.]\d{1,2}\b/g, '')
                .replace(/\b20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/g, '')
                .replace(/[(),]/g, ' ')
                .trim();
                
            cleanLine = cleanLine.replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/gi, '');
            cleanLine = cleanLine.replace(/\b\d{4}\b/g, '');
            cleanLine = cleanLine.trim();
            
            const lowerLine = cleanLine.toLowerCase();
            const isNoise = noiseWords.some(noise => lowerLine.includes(noise));
            const hasPhone = /\d{2,4}-\d{3,4}-\d{4}/.test(cleanLine);
            const isTooShort = cleanLine.length < 2;
            const isNumberOnly = /^[0-9,.\-\s]+$/.test(cleanLine);
            
            if (!isNoise && !hasPhone && !isTooShort && !isNumberOnly) {
                memo = cleanLine;
                break;
            }
        }
        
        if (!memo) {
            memo = type === 'expense' ? 'Card Purchase' : 'Bank Deposit';
        } else {
            memo = memo.replace(/^[^\w가-힣]+|[^\w가-힣]+$/g, '').trim();
            if (memo.length > 25) {
                memo = memo.substring(0, 25) + '...';
            }
        }
        
        const category = autoMatchCategory(memo, type);
        
        const isDuplicate = candidates.some(c => c.amount === amount && c.memo === memo && c.date === formattedDate);
        if (!isDuplicate) {
            candidates.push({
                date: formattedDate,
                type,
                category,
                amount,
                memo
            });
        }
    }
    
    return candidates;
}

function cleanOCRDate(dateStr, defaultYear) {
    dateStr = dateStr.toLowerCase().trim();
    
    const matchYMD = dateStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (matchYMD) {
        return `${matchYMD[1]}-${matchYMD[2].padStart(2, '0')}-${matchYMD[3].padStart(2, '0')}`;
    }
    
    const matchMD = dateStr.match(/^(\d{1,2})[-/.](\d{1,2})$/);
    if (matchMD) {
        const m = matchMD[1].padStart(2, '0');
        const d = matchMD[2].padStart(2, '0');
        if (parseInt(m) >= 1 && parseInt(m) <= 12 && parseInt(d) >= 1 && parseInt(d) <= 31) {
            return `${defaultYear}-${m}-${d}`;
        }
    }
    
    const months = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    
    const matchMonthDay = dateStr.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{1,2})\b/);
    if (matchMonthDay) {
        const mName = matchMonthDay[1];
        const dayStr = matchMonthDay[2].padStart(2, '0');
        const monthStr = months[mName];
        if (monthStr) {
            return `${defaultYear}-${monthStr}-${dayStr}`;
        }
    }
    
    const matchDayMonth = dateStr.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/);
    if (matchDayMonth) {
        const dayStr = matchDayMonth[1].padStart(2, '0');
        const mName = matchDayMonth[2];
        const monthStr = months[mName];
        if (monthStr) {
            return `${defaultYear}-${monthStr}-${dayStr}`;
        }
    }
    
    return '';
}

// Batch Import Controller
let batchImportTransactionsList = [];

function showBatchImportModal(candidates) {
    if (!candidates || candidates.length === 0) return;
    
    batchImportTransactionsList = candidates;
    
    const modal = document.getElementById('batch-import-modal');
    const tbody = document.getElementById('batch-tx-tbody');
    const countEl = document.getElementById('batch-detected-count');
    const selectAllCheckbox = document.getElementById('batch-select-all');
    
    if (!modal || !tbody) return;
    
    tbody.innerHTML = '';
    countEl.textContent = `${settings.lang === 'ko' ? '감지된 거래' : 'Detected Transactions'}: ${candidates.length}${settings.lang === 'ko' ? '건' : ' txs'}`;
    selectAllCheckbox.checked = true;
    
    candidates.forEach((tx, idx) => {
        const tr = document.createElement('tr');
        const isExpense = tx.type === 'expense';
        const activeCategories = isExpense ? getExpenseCategories() : getIncomeCategories();
        
        let catOptionsHTML = '';
        for (const [key, cat] of Object.entries(activeCategories)) {
            const label = cat.labels[settings.lang] || cat.labels['en'];
            const selected = tx.category === key ? 'selected' : '';
            catOptionsHTML += `<option value="${key}" ${selected}>${cat.emoji} ${label}</option>`;
        }
        
        tr.innerHTML = `
            <td class="col-check" data-label=""><input type="checkbox" class="batch-row-checkbox" data-idx="${idx}" checked></td>
            <td class="col-date" data-label="${settings.lang === 'ko' ? '날짜' : 'Date'}">
                <input type="date" class="batch-row-date" data-idx="${idx}" value="${tx.date}">
            </td>
            <td class="col-type" data-label="${settings.lang === 'ko' ? '구분' : 'Type'}">
                <select class="batch-row-type" data-idx="${idx}">
                    <option value="expense" ${isExpense ? 'selected' : ''}>${settings.lang === 'ko' ? '지출' : 'Expense'}</option>
                    <option value="income" ${!isExpense ? 'selected' : ''}>${settings.lang === 'ko' ? '수입' : 'Income'}</option>
                </select>
            </td>
            <td class="col-category" data-label="${settings.lang === 'ko' ? '카테고리' : 'Category'}">
                <select class="batch-row-category" data-idx="${idx}">
                    ${catOptionsHTML}
                </select>
            </td>
            <td class="col-memo" data-label="${settings.lang === 'ko' ? '메모' : 'Memo'}">
                <input type="text" class="batch-row-memo" data-idx="${idx}" value="${escapeHTML(tx.memo)}">
            </td>
            <td class="col-amount" data-label="${settings.lang === 'ko' ? '금액' : 'Amount'}">
                <div class="amount-input-wrapper">
                    <span class="currency-label">${settings.currency === 'KRW' ? '₩' : '$'}</span>
                    <input type="number" class="batch-row-amount" data-idx="${idx}" value="${tx.amount}" step="0.01" min="0.01" style="padding-left: 20px;">
                </div>
            </td>
        `;
        
        const typeSelect = tr.querySelector('.batch-row-type');
        const catSelect = tr.querySelector('.batch-row-category');
        
        typeSelect.addEventListener('change', (e) => {
            const newType = e.target.value;
            tx.type = newType;
            
            const newCats = newType === 'expense' ? getExpenseCategories() : getIncomeCategories();
            let newOptionsHTML = '';
            for (const [key, cat] of Object.entries(newCats)) {
                const label = cat.labels[settings.lang] || cat.labels['en'];
                newOptionsHTML += `<option value="${key}">${cat.emoji} ${label}</option>`;
            }
            catSelect.innerHTML = newOptionsHTML;
            tx.category = catSelect.value;
        });
        
        tr.querySelector('.batch-row-date').addEventListener('change', (e) => { tx.date = e.target.value; });
        tr.querySelector('.batch-row-memo').addEventListener('input', (e) => { tx.memo = e.target.value.trim(); });
        tr.querySelector('.batch-row-amount').addEventListener('input', (e) => { tx.amount = parseFloat(e.target.value) || 0; });
        catSelect.addEventListener('change', (e) => { tx.category = e.target.value; });
        
        tbody.appendChild(tr);
    });
    
    selectAllCheckbox.onchange = (e) => {
        const checked = e.target.checked;
        const rowCheckboxes = tbody.querySelectorAll('.batch-row-checkbox');
        rowCheckboxes.forEach(cb => {
            cb.checked = checked;
        });
    };
    
    modal.classList.remove('hidden');
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function closeBatchImportModal() {
    const modal = document.getElementById('batch-import-modal');
    if (modal) modal.classList.add('hidden');
    batchImportTransactionsList = [];
}

function registerBatchImportEvents() {
    const closeBtn = document.getElementById('batch-modal-close-btn');
    const cancelBtn = document.getElementById('batch-cancel-btn');
    const submitBtn = document.getElementById('batch-submit-btn');
    
    closeBtn?.addEventListener('click', closeBatchImportModal);
    cancelBtn?.addEventListener('click', closeBatchImportModal);
    
    submitBtn?.addEventListener('click', () => {
        const tbody = document.getElementById('batch-tx-tbody');
        if (!tbody) return;
        
        const rowCheckboxes = tbody.querySelectorAll('.batch-row-checkbox');
        const transactionsToAdd = [];
        
        rowCheckboxes.forEach(cb => {
            if (cb.checked) {
                const idx = parseInt(cb.getAttribute('data-idx'));
                const txData = batchImportTransactionsList[idx];
                if (txData && txData.amount > 0 && txData.date) {
                    transactionsToAdd.push({
                        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + idx,
                        date: txData.date,
                        type: txData.type,
                        category: txData.category,
                        amount: Math.round(txData.amount * 100) / 100,
                        memo: txData.memo || (txData.type === 'expense' ? 'Expense' : 'Income')
                    });
                }
            }
        });
        
        if (transactionsToAdd.length > 0) {
            transactions = [...transactions, ...transactionsToAdd];
            saveData();
            render();
            showToast('toast-data-imported');
        }
        
        closeBatchImportModal();
    });
}

// PDF Statement layout text extractor
async function parsePDFStatement(arrayBuffer, isStatement = true) {
    if (!window.pdfjsLib) {
        console.error("PDF.js library not loaded");
        return [];
    }
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let candidates = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items;
        if (items.length === 0) continue;
        
        // Group items by rounded translateY coordinate
        const yGroups = {};
        items.forEach(item => {
            if (!item.str || item.str.trim() === '') return;
            const y = Math.round(item.transform[5]);
            const x = item.transform[4];
            
            // Find matched Y within 4 pixels difference
            let matchedY = null;
            for (const groupedY of Object.keys(yGroups)) {
                if (Math.abs(parseInt(groupedY) - y) < 4) {
                    matchedY = groupedY;
                    break;
                }
            }
            
            if (matchedY !== null) {
                yGroups[matchedY].push({ str: item.str, x: x });
            } else {
                yGroups[y] = [{ str: item.str, x: x }];
            }
        });
        
        // Sort Y descending (top of page is highest Y in PDF coordinates)
        const sortedYs = Object.keys(yGroups).sort((a, b) => parseInt(b) - parseInt(a));
        
        // Build lines
        const lines = sortedYs.map(y => {
            const rowItems = yGroups[y];
            // Sort items in this row left-to-right (ascending X coordinate)
            rowItems.sort((a, b) => a.x - b.x);
            return rowItems.map(item => item.str).join(' ');
        });
        
        console.log(`Parsed PDF Page ${pageNum} Lines:`, lines);
        
        const pageCandidates = parseMultiTransactionOCR(lines, isStatement);
        candidates = [...candidates, ...pageCandidates];
    }
    
    return candidates;
}

init();

// Firebase Sync and Authentication Helpers
async function loadUserData(uid) {
    try {
        const settingsDoc = await db.doc(`users/${uid}/settings/doc`).get();
        if (settingsDoc.exists) {
            settings = { ...settings, ...settingsDoc.data() };
        }
        
        const budgetsDoc = await db.doc(`users/${uid}/budgets/doc`).get();
        if (budgetsDoc.exists) {
            budgets = budgetsDoc.data();
        }
        
        const categoryBudgetsDoc = await db.doc(`users/${uid}/categoryBudgets/doc`).get();
        if (categoryBudgetsDoc.exists) {
            categoryBudgets = categoryBudgetsDoc.data();
        }
        
        const customCategoriesDoc = await db.doc(`users/${uid}/customCategories/doc`).get();
        if (customCategoriesDoc.exists) {
            customCategories = customCategoriesDoc.data().list || [];
        }
        
        const txsSnap = await db.collection(`users/${uid}/transactions`).get();
        transactions = txsSnap.docs.map(d => d.data());
        syncedTransactions = JSON.parse(JSON.stringify(transactions));
        
        const subsSnap = await db.collection(`users/${uid}/subscriptions`).get();
        subscriptions = subsSnap.docs.map(d => d.data());
        syncedSubscriptions = JSON.parse(JSON.stringify(subscriptions));
        
        const dpSnap = await db.collection(`users/${uid}/dutchPays`).get();
        dutchPays = dpSnap.docs.map(d => d.data());
        syncedDutchPays = JSON.parse(JSON.stringify(dutchPays));
        
        const isFirestoreEmpty = transactions.length === 0 && subscriptions.length === 0 && Object.keys(budgets).length === 0;
        if (isFirestoreEmpty) {
            const localTx = localStorage.getItem('lumina_transactions');
            if (localTx && JSON.parse(localTx).length > 0) {
                await saveToFirestore(true);
            }
        } else {
            localStorage.setItem('lumina_transactions', JSON.stringify(transactions));
            localStorage.setItem('lumina_budgets', JSON.stringify(budgets));
            localStorage.setItem('lumina_settings', JSON.stringify(settings));
            localStorage.setItem('lumina_subscriptions', JSON.stringify(subscriptions));
            localStorage.setItem('lumina_category_budgets', JSON.stringify(categoryBudgets));
            localStorage.setItem('lumina_custom_categories', JSON.stringify(customCategories));
            localStorage.setItem('lumina_dutch_pays', JSON.stringify(dutchPays));
        }

        applyTheme();
        updateCurrencyLabels();
        updateUILanguage();
        render();
        
    } catch (error) {
        console.error("Error loading user data from Firestore:", error);
    }
}

async function saveToFirestore(force = false) {
    if (!currentUser) return;
    const uid = currentUser.uid;
    
    try {
        await db.doc(`users/${uid}/settings/doc`).set(settings);
        await db.doc(`users/${uid}/budgets/doc`).set(budgets);
        await db.doc(`users/${uid}/categoryBudgets/doc`).set(categoryBudgets);
        await db.doc(`users/${uid}/customCategories/doc`).set({ list: customCategories });
        
        if (force) {
            for (const tx of transactions) {
                await db.doc(`users/${uid}/transactions/${tx.id}`).set(tx);
            }
            for (const sub of subscriptions) {
                await db.doc(`users/${uid}/subscriptions/${sub.id}`).set(sub);
            }
            for (const dp of dutchPays) {
                await db.doc(`users/${uid}/dutchPays/${dp.id}`).set(dp);
            }
        } else {
            await syncCollection(`users/${uid}/transactions`, transactions, syncedTransactions);
            await syncCollection(`users/${uid}/subscriptions`, subscriptions, syncedSubscriptions);
            await syncCollection(`users/${uid}/dutchPays`, dutchPays, syncedDutchPays);
        }
        
        syncedTransactions = JSON.parse(JSON.stringify(transactions));
        syncedSubscriptions = JSON.parse(JSON.stringify(subscriptions));
        syncedDutchPays = JSON.parse(JSON.stringify(dutchPays));
        
    } catch (error) {
        console.error("Error saving user data to Firestore:", error);
    }
}

async function syncCollection(colPath, currentList, syncedList) {
    const currentMap = new Map(currentList.map(item => [item.id, item]));
    const syncedMap = new Map(syncedList.map(item => [item.id, item]));

    for (const [id, item] of currentMap.entries()) {
        const syncedItem = syncedMap.get(id);
        if (!syncedItem || JSON.stringify(syncedItem) !== JSON.stringify(item)) {
            await db.doc(`${colPath}/${id}`).set(item);
        }
    }

    for (const id of syncedMap.keys()) {
        if (!currentMap.has(id)) {
            await db.doc(`${colPath}/${id}`).delete();
        }
    }
}

function updateUserProfileUI(user) {
    const emailDisplay = document.getElementById('user-email-display');
    const providerName = document.getElementById('user-provider-name');
    const avatarEl = document.getElementById('user-avatar-el');
    
    if (emailDisplay) emailDisplay.textContent = user.email || 'No Email';
    
    const providerId = user.providerData[0]?.providerId;
    if (providerName) {
        if (providerId === 'google.com') {
            providerName.textContent = 'Google Account';
        } else {
            providerName.textContent = 'Email Account';
        }
    }
    
    if (avatarEl) {
        if (user.photoURL && providerId === 'google.com') {
            avatarEl.innerHTML = `<img src="${user.photoURL}" alt="User Avatar">`;
        } else {
            const initial = (user.email || 'U').charAt(0).toUpperCase();
            avatarEl.innerHTML = `<span id="user-avatar-initial">${initial}</span>`;
        }
    }
}

let isSignUpMode = false;

function setupAuthListeners() {
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const confirmPasswordGroup = document.getElementById('confirm-password-group');
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginConfirmPassword = document.getElementById('login-confirm-password');
    const loginBtnText = document.getElementById('login-btn-text');
    const loginBtnIcon = document.getElementById('login-btn-icon');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const googleDivider = document.getElementById('login-divider-el');
    const logoutBtn = document.getElementById('logout-btn-el');
    
    // Google login button will remain visible
    if (loginTab && signupTab) {
        loginTab.addEventListener('click', () => {
            isSignUpMode = false;
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            if (confirmPasswordGroup) confirmPasswordGroup.classList.add('hidden');
            if (loginConfirmPassword) loginConfirmPassword.required = false;
            if (loginBtnText) {
                loginBtnText.setAttribute('data-i18n', 'login-btn');
                loginBtnText.textContent = settings.lang === 'ko' ? '로그인' : 'Log In';
            }
            if (loginBtnIcon) {
                loginBtnIcon.setAttribute('data-lucide', 'log-in');
                if (window.lucide) lucide.createIcons();
            }
        });

        signupTab.addEventListener('click', () => {
            isSignUpMode = true;
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            if (confirmPasswordGroup) confirmPasswordGroup.classList.remove('hidden');
            if (loginConfirmPassword) loginConfirmPassword.required = true;
            if (loginBtnText) {
                loginBtnText.setAttribute('data-i18n', 'signup-btn');
                loginBtnText.textContent = settings.lang === 'ko' ? '회원가입' : 'Sign Up';
            }
            if (loginBtnIcon) {
                loginBtnIcon.setAttribute('data-lucide', 'user-plus');
                if (window.lucide) lucide.createIcons();
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginEmail.value.trim();
            const password = loginPassword.value;
            
            if (isSignUpMode) {
                const confirmPassword = loginConfirmPassword.value;
                if (password !== confirmPassword) {
                    showToast('toast-auth-pwd-mismatch');
                    return;
                }
                
                try {
                    await auth.createUserWithEmailAndPassword(email, password);
                    showToast('toast-auth-signup-success');
                } catch (err) {
                    console.error("Sign up error:", err);
                    showToast('toast-auth-error', { error: err.message });
                }
            } else {
                try {
                    await auth.signInWithEmailAndPassword(email, password);
                    showToast('toast-auth-success');
                } catch (err) {
                    console.error("Login error:", err);
                    showToast('toast-auth-error', { error: err.message });
                }
            }
        });
    }

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                await auth.signInWithPopup(provider);
                showToast('toast-auth-success');
            } catch (err) {
                console.error("Google Sign-in error:", err);
                showToast('toast-auth-error', { error: err.message });
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await auth.signOut();
                showToast('toast-auth-logout');
            } catch (err) {
                console.error("Logout error:", err);
                showToast('toast-auth-error', { error: err.message });
            }
        });
    }
}
