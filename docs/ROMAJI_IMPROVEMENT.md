# Cải thiện Romaji Output

## Vấn đề

Gemini AI không luôn trả về romaji khi dịch tiếng Nhật. Có lúc có, có lúc không.

## Giải pháp

Đã cải thiện prompt với:

### 1. **Explicit Instructions**
```
CRITICAL RULES:
1. If the source language is Japanese (日本語), you MUST ALWAYS include romaji reading
```

### 2. **Clear Format**
```json
{
  "translation": "your translation here",
  "reading": "romaji here (REQUIRED for Japanese)"
}
```

### 3. **Example**
Cung cấp ví dụ cụ thể để AI hiểu rõ:
```
Input: 日本語能力試験
Output: {"translation":"Kỳ thi năng lực Nhật ngữ","reading":"Nihongo Nōryoku Shiken"}
```

### 4. **Tăng maxOutputTokens**
Từ 200 → 300 tokens để có đủ chỗ cho romaji dài

## Kết quả mong đợi

- ✅ **Tiếng Nhật**: Luôn có romaji
- ✅ **Tiếng Trung**: Luôn có pinyin
- ✅ **Tiếng Hàn**: Luôn có romanization
- ✅ **Ngôn ngữ khác**: reading = ""

## Test

Sau khi reload extension, thử dịch:

### Tiếng Nhật
```
日本語能力試験N3対策
→ Phải có: /Nihongo Nōryoku Shiken N3 Taisaku/
```

### Tiếng Trung
```
中国语言
→ Phải có: /Zhōngguó yǔyán/
```

### Tiếng Anh
```
Hello World
→ Không có reading (OK)
```

## Nếu vẫn không có romaji

Có thể do:
1. **Model khác nhau**: Thử đổi model trong Settings
2. **API rate limit**: Đợi 1 phút rồi thử lại
3. **Text quá dài**: Giảm maxChars trong Settings

## Backup: Force romaji

Nếu vẫn không được, có thể thêm fallback trong code để tự generate romaji bằng thư viện JavaScript (kuroshiro).
