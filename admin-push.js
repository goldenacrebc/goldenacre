(function() {
    const supabaseUrl = 'https://xprnfaadcqlxeamoywjs.supabase.co';
    const supabaseKey = 'sb_publishable_FLKn6BtisIoFBvS7lFjVFg_fRuprjea';
    const pushClient = window.supabase.createClient(supabaseUrl, supabaseKey);

    const originalToggleCard = window.toggleCard;
    window.toggleCard = function(cardId) {
        originalToggleCard(cardId);
        if (cardId === 'push-notify-card') loadPushSubscriberCount();
    };

    async function loadPushSubscriberCount() {
        const el = document.getElementById('push-subscriber-count');
        if (!el) return;
        try {
            const { data: count, error } = await pushClient.rpc('get_push_subscription_count');
            if (error) throw error;
            el.textContent = `📱 ${count || 0} device${count !== 1 ? 's' : ''} subscribed to push alerts.`;
        } catch (err) {
            el.textContent = 'Could not load subscriber count.';
        }
    }

    const formPushNotify = document.getElementById('form-push-notify');
    if (!formPushNotify) return;

    formPushNotify.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusMsg = document.getElementById('status-push-notify');
        const btn = document.getElementById('btn-send-push');
        const title = document.getElementById('push-title').value.trim();
        const body = document.getElementById('push-body').value.trim();
        const url = document.getElementById('push-url').value.trim() || '/events.html';

        statusMsg.style.backgroundColor = '#e0f2fe';
        statusMsg.style.color = '#0369a1';
        statusMsg.innerText = 'Sending push notification to all subscribers...';
        btn.disabled = true;

        try {
            const { data, error } = await pushClient.functions.invoke('send-push', {
                body: { title, body, url }
            });
            if (error) throw new Error(error.message || 'Edge function error');

            const sent = data?.sent ?? '?';
            const failed = data?.failed ?? 0;
            const removed = data?.removed ?? 0;
            const details = Array.isArray(data?.errors) && data.errors.length
                ? ` — ${data.errors.join('; ')}`
                : '';

            statusMsg.style.backgroundColor = '#dcfce7';
            statusMsg.style.color = '#16a34a';
            statusMsg.innerText = `✅ Push sent to ${sent} device${sent !== 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed${removed ? `, ${removed} expired removed` : ''})` : ''}.${details}`;
            formPushNotify.reset();
            document.getElementById('push-url').value = '/events.html';
            loadPushSubscriberCount();
        } catch (err) {
            statusMsg.style.backgroundColor = '#fee2e2';
            statusMsg.style.color = '#dc2626';
            statusMsg.innerText = 'Error: ' + err.message;
        } finally {
            btn.disabled = false;
        }
    });
})();
