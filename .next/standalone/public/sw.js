self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) return;

    let payload = {};
    
    // الحل السحري: نجرب نقراها JSON الأول، لو فشلت نقراها كنص عادي
    try {
        payload = event.data ? event.data.json() : {};
    } catch (e) {
        payload = {
            title: "إشعار تجريبي 🚀",
            body: event.data ? event.data.text() : "رسالة غير معروفة",
            icon: '/icons/icon-192x192.png',
            data: { url: '/' }
        };
    }

    const title = payload.title || "تنبيه جديد";
    const options = {
        body: payload.body || "يوجد تحديث جديد في النظام",
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: { url: (payload.data && payload.data.url) ? payload.data.url : '/' },
        requireInteraction: true, // يمنع الإشعار من الاختفاء التلقائي حتى يتفاعل معه المستخدم
        silent: false, // لضمان إصدار صوت (يعتمد على إعدادات الويندوز)
        vibrate: [200, 100, 200, 100, 200, 100, 200] // نمط اهتزاز قوي للأجهزة الداعمة
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(clients.openWindow(event.notification.data.url));
    }
});

// A fetch listener is required by Chrome to pass PWA installation criteria
self.addEventListener('fetch', function (event) {
    // Bypass API requests to let the browser handle them directly
    if (event.request.url.includes('/api/')) {
        return;
    }
    // Just pass the request through, no caching logic for now
    event.respondWith(
        fetch(event.request).catch(function () {
            return Response.error();
        })
    );
});
