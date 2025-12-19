// CartRecovery Pro - API Module
const RecoveryAPI = {
    storage: {
        get(key, def = null) { try { return JSON.parse(localStorage.getItem(`recovery_${key}`)) || def; } catch { return def; } },
        set(key, val) { localStorage.setItem(`recovery_${key}`, JSON.stringify(val)); }
    },

    carts: {
        getAll() { return RecoveryAPI.storage.get('carts', []); },
        save(carts) { RecoveryAPI.storage.set('carts', carts); },
        add(cart) {
            const carts = this.getAll();
            cart.id = 'CART-' + Date.now().toString(36).toUpperCase();
            cart.createdAt = new Date().toISOString();
            cart.status = 'abandoned';
            cart.attempts = 0;
            carts.unshift(cart);
            this.save(carts);
            return cart;
        },
        update(id, updates) {
            const carts = this.getAll();
            const idx = carts.findIndex(c => c.id === id);
            if (idx !== -1) { Object.assign(carts[idx], updates); this.save(carts); return carts[idx]; }
            return null;
        },
        delete(id) { let carts = this.getAll(); carts = carts.filter(c => c.id !== id); this.save(carts); },
        recover(id) { return this.update(id, { status: 'recovered', recoveredAt: new Date().toISOString() }); },
        sendReminder(id) {
            const cart = this.getAll().find(c => c.id === id);
            if (cart) {
                cart.attempts = (cart.attempts || 0) + 1;
                cart.lastReminder = new Date().toISOString();
                this.save(this.getAll().map(c => c.id === id ? cart : c));
                return true;
            }
            return false;
        }
    },

    templates: {
        getAll() { return RecoveryAPI.storage.get('templates', this.defaults()); },
        save(templates) { RecoveryAPI.storage.set('templates', templates); },
        defaults() {
            return [
                { id: 'default1', name: 'Friendly Reminder', subject: "Hey {name}, you left something behind!", body: "Hi {name},\n\nWe noticed you left some items in your cart worth {total}. Ready to complete your purchase?\n\n{cart_link}\n\nBest,\nThe Team" },
                { id: 'default2', name: 'Discount Offer', subject: "10% OFF your cart - just for you!", body: "Hi {name},\n\nWe're offering you an exclusive 10% discount on your cart ({total})!\n\nUse code COMEBACK10 at checkout:\n{cart_link}\n\nHurry, expires in 24 hours!" },
                { id: 'default3', name: 'Last Chance', subject: "Last chance! Your cart is expiring soon", body: "Hi {name},\n\nYour cart with {total} in items will expire soon. Don't miss out!\n\n{cart_link}\n\nSee you soon!" }
            ];
        },
        add(template) {
            const templates = this.getAll();
            template.id = 'tpl-' + Date.now().toString(36);
            templates.push(template);
            this.save(templates);
            return template;
        },
        delete(id) { let templates = this.getAll(); templates = templates.filter(t => t.id !== id); this.save(templates); }
    },

    campaigns: {
        getAll() { return RecoveryAPI.storage.get('campaigns', []); },
        save(campaigns) { RecoveryAPI.storage.set('campaigns', campaigns); },
        add(campaign) {
            const campaigns = this.getAll();
            campaign.id = 'CMP-' + Date.now().toString(36).toUpperCase();
            campaign.createdAt = new Date().toISOString();
            campaign.status = 'active';
            campaign.sent = 0;
            campaign.recovered = 0;
            campaigns.unshift(campaign);
            this.save(campaigns);
            return campaign;
        }
    },

    getAnalytics() {
        const carts = this.carts.getAll();
        const abandoned = carts.filter(c => c.status === 'abandoned');
        const recovered = carts.filter(c => c.status === 'recovered');
        const lostRevenue = abandoned.reduce((sum, c) => sum + (c.total || 0), 0);
        const recoveredRevenue = recovered.reduce((sum, c) => sum + (c.total || 0), 0);
        return {
            total: carts.length,
            abandoned: abandoned.length,
            recovered: recovered.length,
            recoveryRate: carts.length ? (recovered.length / carts.length * 100) : 0,
            lostRevenue,
            recoveredRevenue,
            avgCartValue: carts.length ? carts.reduce((s, c) => s + (c.total || 0), 0) / carts.length : 0
        };
    },

    format: {
        currency(n) { return '$' + Number(n).toFixed(2); },
        timeAgo(date) {
            const s = Math.floor((new Date() - new Date(date)) / 1000);
            if (s < 60) return 'Just now';
            if (s < 3600) return Math.floor(s / 60) + 'm ago';
            if (s < 86400) return Math.floor(s / 3600) + 'h ago';
            return Math.floor(s / 86400) + 'd ago';
        }
    },

    toast: { show(msg, type = 'success') { const c = document.getElementById('toast-container') || this.create(); const t = document.createElement('div'); t.className = `toast toast-${type}`; t.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i> ${msg}`; c.appendChild(t); setTimeout(() => t.classList.add('show'), 10); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000); }, create() { const c = document.createElement('div'); c.id = 'toast-container'; c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;'; document.body.appendChild(c); const s = document.createElement('style'); s.textContent = '.toast{display:flex;align-items:center;gap:10px;padding:12px 20px;background:#1e1e3f;border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;margin-bottom:10px;transform:translateX(120%);transition:0.3s;}.toast.show{transform:translateX(0);}.toast-success{border-left:3px solid #10b981;}'; document.head.appendChild(s); return c; } }
};
window.RecoveryAPI = RecoveryAPI;
