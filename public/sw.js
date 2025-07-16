/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */

// 天气日记本 Service Worker - 优化网络请求和缓存策略
const CACHE_NAME = 'weather-diary-v2.2.0';
const RUNTIME_CACHE = 'weather-diary-runtime';

// 需要预缓存的核心资源
const CORE_FILES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// 天气API和翻译服务的缓存配置
const API_CACHE_CONFIG = {
  // 和风天气API - 缓存30分钟
  'devapi.qweather.com': {
    cacheName: 'qweather-api',
    maxAge: 30 * 60 * 1000, // 30分钟
    strategy: 'cacheFirst'
  },
  // wttr.in API - 缓存20分钟
  'wttr.in': {
    cacheName: 'wttr-api', 
    maxAge: 20 * 60 * 1000, // 20分钟
    strategy: 'networkFirst'
  },
  // 翻译服务 - 缓存24小时
  'api.mymemory.translated.net': {
    cacheName: 'translation-api',
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    strategy: 'cacheFirst'
  },
  'libretranslate.de': {
    cacheName: 'translation-api',
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    strategy: 'cacheFirst'
  }
};

// 安装事件 - 预缓存核心资源
self.addEventListener('install', event => {
  console.log('[SW] 安装中...', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 预缓存核心文件');
        return cache.addAll(CORE_FILES);
      })
      .then(() => {
        console.log('[SW] 安装完成，跳过等待');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] 安装失败:', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[SW] 激活中...', CACHE_NAME);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE &&
              !Object.values(API_CACHE_CONFIG).some(config => config.cacheName === cacheName)) {
            console.log('[SW] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] 激活完成，接管页面');
      return self.clients.claim();
    })
  );
});

// 请求拦截 - 智能缓存策略
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过浏览器扩展请求
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }
  
  // API请求处理
  const apiConfig = getApiConfig(url.hostname);
  if (apiConfig) {
    event.respondWith(handleApiRequest(request, apiConfig));
    return;
  }
  
  // 静态资源处理
  if (url.origin === self.location.origin) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // 外部资源处理 (字体、CDN等)
  if (isExternalResource(url)) {
    event.respondWith(handleExternalRequest(request));
    return;
  }
});

// 获取API缓存配置
function getApiConfig(hostname) {
  return API_CACHE_CONFIG[hostname] || null;
}

// 处理API请求
async function handleApiRequest(request, config) {
  const { cacheName, maxAge, strategy } = config;
  
  try {
    if (strategy === 'cacheFirst') {
      // 缓存优先策略
      const cachedResponse = await getCachedResponse(request, cacheName, maxAge);
      if (cachedResponse) {
        console.log('[SW] API缓存命中:', request.url);
        return cachedResponse;
      }
    }
    
    // 网络请求
    console.log('[SW] API网络请求:', request.url);
    const networkResponse = await fetchWithTimeout(request, getTimeoutForApi(request.url));
    
    // 缓存成功的响应
    if (networkResponse && networkResponse.ok) {
      await cacheResponse(request, networkResponse.clone(), cacheName);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('[SW] API请求失败:', request.url, error);
    
    // 尝试返回缓存的响应
    const cachedResponse = await getCachedResponse(request, cacheName);
    if (cachedResponse) {
      console.log('[SW] 返回缓存的API响应:', request.url);
      return cachedResponse;
    }
    
    // 返回错误响应
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        message: '网络不可用，请检查网络连接',
        cached: false
      }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 处理静态资源请求
async function handleStaticRequest(request) {
  try {
    // 先尝试缓存
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 网络请求
    const networkResponse = await fetch(request);
    
    // 缓存静态资源
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('[SW] 静态资源请求失败:', request.url, error);
    
    // 返回缓存的资源或错误页面
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Resource not available offline', { status: 503 });
  }
}

// 处理外部资源请求
async function handleExternalRequest(request) {
  try {
    // 缓存优先策略 (字体、CDN资源)
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 网络请求
    const networkResponse = await fetch(request);
    
    // 缓存外部资源
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('[SW] 外部资源请求失败:', request.url, error);
    
    // 返回缓存的资源
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('External resource not available', { status: 503 });
  }
}

// 带超时的fetch请求
function fetchWithTimeout(request, timeout = 10000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

// 获取API超时时间
function getTimeoutForApi(url) {
  if (url.includes('qweather.com')) return 8000;   // 和风天气 8秒
  if (url.includes('wttr.in')) return 15000;       // wttr.in 15秒
  if (url.includes('translate')) return 5000;      // 翻译服务 5秒
  return 10000; // 默认 10秒
}

// 获取缓存的响应
async function getCachedResponse(request, cacheName, maxAge = Infinity) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (!cachedResponse) {
    return null;
  }
  
  // 检查缓存是否过期
  const cachedTime = cachedResponse.headers.get('sw-cached-time');
  if (cachedTime && maxAge < Infinity) {
    const age = Date.now() - parseInt(cachedTime);
    if (age > maxAge) {
      console.log('[SW] 缓存已过期:', request.url);
      await cache.delete(request);
      return null;
    }
  }
  
  return cachedResponse;
}

// 缓存响应
async function cacheResponse(request, response, cacheName) {
  const cache = await caches.open(cacheName);
  
  // 添加缓存时间戳
  const responseWithTimestamp = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'sw-cached-time': Date.now().toString()
    }
  });
  
  await cache.put(request, responseWithTimestamp);
}

// 判断是否为外部资源
function isExternalResource(url) {
  const externalDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net',
    'unpkg.com'
  ];
  
  return externalDomains.some(domain => url.hostname.includes(domain));
}

// 消息处理 - 手动更新缓存
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] 收到跳过等待消息');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] 收到清除缓存消息');
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// 清除所有缓存
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('[SW] 所有缓存已清除');
}

// 错误处理
self.addEventListener('error', event => {
  console.error('[SW] Service Worker 错误:', event.error);
});

// 未处理的Promise拒绝
self.addEventListener('unhandledrejection', event => {
  console.error('[SW] 未处理的Promise拒绝:', event.reason);
});

console.log('[SW] Service Worker 已加载:', CACHE_NAME); 