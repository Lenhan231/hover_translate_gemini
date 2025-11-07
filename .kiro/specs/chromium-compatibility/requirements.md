# Requirements Document

## Introduction

Extension hiện tại sử dụng Manifest V2 và được tối ưu cho Firefox. Tuy nhiên, Brave và các trình duyệt Chromium-based đang deprecate Manifest V2 và yêu cầu migrate sang Manifest V3. Feature này sẽ đảm bảo extension hoạt động tốt trên cả Firefox (Manifest V2) và Chromium browsers (Manifest V3) bằng cách:

1. Tạo build riêng cho Chromium với Manifest V3
2. Xử lý các API khác biệt giữa Firefox và Chrome
3. Đảm bảo tất cả tính năng hoạt động đúng trên cả hai nền tảng

## Requirements

### Requirement 1: Manifest V3 Support for Chromium

**User Story:** Là người dùng Brave/Chrome, tôi muốn cài đặt và sử dụng extension mà không gặp lỗi hoặc cảnh báo về Manifest V2 deprecated, để extension hoạt động ổn định lâu dài.

#### Acceptance Criteria

1. WHEN extension được build cho Chromium THEN hệ thống SHALL tạo manifest.json với manifest_version: 3
2. WHEN extension sử dụng background script THEN hệ thống SHALL chuyển từ background.scripts sang service worker (background.service_worker)
3. WHEN extension cần permissions THEN hệ thống SHALL sử dụng host_permissions thay vì permissions cho URL patterns
4. WHEN extension load trên Brave/Chrome THEN hệ thống SHALL không hiển thị warning về deprecated manifest
5. IF extension cần persistent background THEN hệ thống SHALL refactor code để hoạt động với non-persistent service worker

### Requirement 2: Cross-Browser API Compatibility

**User Story:** Là developer, tôi muốn code hoạt động trên cả Firefox và Chromium mà không cần maintain hai codebase riêng biệt, để dễ dàng maintain và update.

#### Acceptance Criteria

1. WHEN extension gọi storage API THEN hệ thống SHALL tự động detect và sử dụng đúng API (browser.storage hoặc chrome.storage)
2. WHEN extension gọi runtime API THEN hệ thống SHALL handle cả Promise-based (Firefox) và callback-based (Chrome) patterns
3. WHEN extension sử dụng contextMenus THEN hệ thống SHALL hoạt động đúng trên cả hai browsers
4. WHEN extension gọi tabs API THEN hệ thống SHALL handle differences giữa browser.tabs và chrome.tabs
5. IF có lỗi API THEN hệ thống SHALL log rõ ràng để debug

### Requirement 3: Build System for Multi-Browser Support

**User Story:** Là developer, tôi muốn có build script tự động tạo package cho cả Firefox và Chromium, để dễ dàng release cho nhiều platforms.

#### Acceptance Criteria

1. WHEN chạy build script THEN hệ thống SHALL tạo hai folders: dist/firefox và dist/chromium
2. WHEN build cho Firefox THEN hệ thống SHALL copy manifest v2 và tất cả files cần thiết
3. WHEN build cho Chromium THEN hệ thống SHALL copy manifest v3 và convert background scripts sang service worker
4. WHEN build hoàn tất THEN hệ thống SHALL tạo zip files sẵn sàng để upload lên stores
5. IF có file không cần thiết THEN hệ thống SHALL exclude khỏi dist packages

### Requirement 4: Service Worker Compatibility

**User Story:** Là người dùng Chromium, tôi muốn extension hoạt động mượt mà với service worker architecture, để không bị mất state hoặc lỗi khi service worker sleep.

#### Acceptance Criteria

1. WHEN service worker khởi động THEN hệ thống SHALL restore cần thiết state từ storage
2. WHEN service worker bị terminate THEN hệ thống SHALL save state quan trọng trước khi terminate
3. WHEN content script gửi message THEN service worker SHALL respond đúng ngay cả khi vừa wake up
4. WHEN sử dụng cache THEN hệ thống SHALL persist cache data để survive service worker restarts
5. IF service worker timeout THEN hệ thống SHALL handle gracefully và retry nếu cần

### Requirement 5: Testing and Validation

**User Story:** Là QA tester, tôi muốn verify tất cả features hoạt động đúng trên cả Firefox và Chromium, để đảm bảo quality trước khi release.

#### Acceptance Criteria

1. WHEN test translation feature THEN hệ thống SHALL dịch text đúng trên cả hai browsers
2. WHEN test Alt+Select shortcut THEN overlay SHALL hiển thị đúng vị trí trên cả hai browsers
3. WHEN test Save Word feature THEN từ SHALL được lưu vào storage đúng trên cả hai browsers
4. WHEN test context menu THEN menu item SHALL hoạt động đúng trên cả hai browsers
5. WHEN test options page THEN settings SHALL save và load đúng trên cả hai browsers
6. IF có lỗi THEN error messages SHALL hiển thị rõ ràng và helpful

### Requirement 6: Backward Compatibility

**User Story:** Là người dùng hiện tại, tôi muốn update extension mà không mất data hoặc settings, để tiếp tục sử dụng mượt mà.

#### Acceptance Criteria

1. WHEN update từ V2 sang V3 THEN hệ thống SHALL migrate storage data tự động
2. WHEN update extension THEN saved words SHALL được preserve
3. WHEN update extension THEN API keys và settings SHALL được preserve
4. IF có breaking changes THEN hệ thống SHALL thông báo cho user
5. WHEN first run sau update THEN hệ thống SHALL verify data integrity
