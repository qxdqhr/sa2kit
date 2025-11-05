# Utils API 文档

通用工具函数集合，包含字符串、数组、文件、验证等常用功能。

## 安装

```bash
npm install @react-utils-kit/core
```

## 导入

```typescript
import {
  stringUtils,
  arrayUtils,
  fileUtils,
  validators,
  formatTime,
  errorUtils,
  debugUtils
} from '@react-utils-kit/core/utils';
```

## String Utils

### stringUtils.truncate(text, length, suffix?)

截断文本到指定长度。

```typescript
stringUtils.truncate('Long text here', 10);
// 'Long te...'

stringUtils.truncate('Long text here', 10, '---');
// 'Long t---'
```

### stringUtils.capitalize(text)

首字母大写。

```typescript
stringUtils.capitalize('hello world');
// 'Hello world'
```

### stringUtils.camelToSnake(text)

驼峰转下划线。

```typescript
stringUtils.camelToSnake('helloWorld');
// 'hello_world'
```

### stringUtils.snakeToCamel(text)

下划线转驼峰。

```typescript
stringUtils.snakeToCamel('hello_world');
// 'helloWorld'
```

### stringUtils.generateRandom(length)

生成随机字符串。

```typescript
stringUtils.generateRandom(10);
// 'aBc123XyZ9'
```

## Array Utils

### arrayUtils.unique(array)

数组去重。

```typescript
arrayUtils.unique([1, 2, 2, 3, 3, 4]);
// [1, 2, 3, 4]
```

### arrayUtils.groupBy(array, key)

按键分组。

```typescript
const items = [
  { category: 'fruit', name: 'apple' },
  { category: 'fruit', name: 'banana' },
  { category: 'vegetable', name: 'carrot' },
];

arrayUtils.groupBy(items, 'category');
// {
//   fruit: [{ category: 'fruit', name: 'apple' }, ...],
//   vegetable: [{ category: 'vegetable', name: 'carrot' }]
// }
```

### arrayUtils.paginate(array, page, limit)

数组分页。

```typescript
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
arrayUtils.paginate(items, 1, 3);
// {
//   data: [1, 2, 3],
//   total: 10,
//   page: 1,
//   pages: 4,
//   hasNext: true,
//   hasPrev: false
// }
```

### arrayUtils.shuffle(array)

随机打乱数组。

```typescript
arrayUtils.shuffle([1, 2, 3, 4, 5]);
// [3, 1, 5, 2, 4] (随机顺序)
```

## File Utils

### fileUtils.formatFileSize(bytes)

格式化文件大小。

```typescript
fileUtils.formatFileSize(1024);      // '1 KB'
fileUtils.formatFileSize(1536000);   // '1.46 MB'
fileUtils.formatFileSize(1073741824);// '1 GB'
```

### fileUtils.getFileExtension(filename)

获取文件扩展名。

```typescript
fileUtils.getFileExtension('document.pdf');
// 'pdf'
```

### fileUtils.generateUniqueFileName(originalName)

生成唯一文件名。

```typescript
fileUtils.generateUniqueFileName('photo.jpg');
// 'photo_1699123456789_abc123.jpg'
```

### fileUtils.isValidFilename(filename)

验证文件名是否有效。

```typescript
fileUtils.isValidFilename('document.pdf');  // true
fileUtils.isValidFilename('file<name>.txt'); // false
```

## Validators

### validators.isValidEmail(email)

验证邮箱格式。

```typescript
validators.isValidEmail('user@example.com'); // true
validators.isValidEmail('invalid');          // false
```

### validators.isValidPassword(password)

验证密码强度。

```typescript
validators.isValidPassword('Abc123');
// { isValid: true, errors: [] }

validators.isValidPassword('weak');
// {
//   isValid: false,
//   errors: ['Password must contain at least one number']
// }
```

### validators.isValidUsername(username)

验证用户名格式（3-20位字母数字下划线）。

```typescript
validators.isValidUsername('user123');  // true
validators.isValidUsername('ab');       // false (太短)
```

### validators.isValidFileSize(size, maxSize)

验证文件大小。

```typescript
validators.isValidFileSize(1024, 2048); // true
validators.isValidFileSize(3000, 2048); // false
```

### validators.isValidFileType(type, supportedTypes)

验证文件类型。

```typescript
validators.isValidFileType('image/png', ['image/png', 'image/jpg']);
// true
```

### validators.isValidUrl(url)

验证 URL 格式。

```typescript
validators.isValidUrl('https://example.com'); // true
validators.isValidUrl('not a url');           // false
```

## Time Utils

### formatTime.toMinutesSeconds(seconds)

秒数转 MM:SS 格式。

```typescript
formatTime.toMinutesSeconds(125);
// '2:05'
```

### formatTime.toHoursMinutesSeconds(seconds)

秒数转 HH:MM:SS 格式。

```typescript
formatTime.toHoursMinutesSeconds(3725);
// '1:02:05'
```

### formatTime.formatDate(date, locale?)

格式化日期为相对时间。

```typescript
formatTime.formatDate(new Date());
// '今天' or 'Today'

formatTime.formatDate(yesterdayDate);
// '昨天' or 'Yesterday'
```

## Error Utils

### errorUtils.createError(code, message, details?)

创建标准化错误对象。

```typescript
const error = errorUtils.createError(
  'AUTH_FAILED',
  'Authentication failed',
  { userId: 123 }
);
```

### errorUtils.extractErrorMessage(error)

安全提取错误信息。

```typescript
errorUtils.extractErrorMessage(new Error('Failed'));  // 'Failed'
errorUtils.extractErrorMessage('Error string');       // 'Error string'
errorUtils.extractErrorMessage(null);                 // 'Unknown error'
```

### errorUtils.retry(fn, maxAttempts?, delay?)

错误重试机制。

```typescript
const result = await errorUtils.retry(
  async () => await fetchData(),
  3,     // 最多重试3次
  1000   // 初始延迟1秒
);
```

## Debug Utils

### debugUtils.safeStringify(obj)

安全的 JSON 序列化。

```typescript
const circular = { a: 1 };
circular.self = circular;

debugUtils.safeStringify(circular);
// '[Circular Reference or Invalid JSON: ...]'
```

### debugUtils.createTimer(label?)

性能计时器。

```typescript
const timer = debugUtils.createTimer('API Call');
// ... 执行操作 ...
const duration = timer.end();
// 输出: 'API Call: 234.56ms'
```

### debugUtils.getMemoryUsage()

获取内存使用情况（仅 Node.js）。

```typescript
const memory = debugUtils.getMemoryUsage();
// {
//   rss: '45.2 MB',
//   heapTotal: '15.3 MB',
//   heapUsed: '10.1 MB',
//   external: '1.2 MB'
// }
```

## 完整示例

```typescript
import {
  stringUtils,
  arrayUtils,
  validators,
  errorUtils
} from '@react-utils-kit/core/utils';

// 处理用户输入
const username = stringUtils.truncate(userInput, 20);
if (!validators.isValidUsername(username)) {
  throw errorUtils.createError('INVALID_USERNAME', 'Invalid username format');
}

// 处理数据列表
const uniqueItems = arrayUtils.unique(items);
const grouped = arrayUtils.groupBy(uniqueItems, 'category');

// 错误重试
const data = await errorUtils.retry(
  () => fetchUserData(username),
  3,
  1000
);
```

