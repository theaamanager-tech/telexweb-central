/**
 * Admin Panel Enhanced Features
 * Features: Quick Actions, Ctrl+K Search, Notifications, Export, Dark/Light Mode,
 *           Enhanced Analytics, Bulk Actions, Drag & Drop Products
 */
(function() {
  'use strict';

  // Wait for React app to render
  const waitForApp = (cb, maxWait = 10000) => {
    const start = Date.now();
    const check = () => {
      const main = document.querySelector('main');
      if (main && main.querySelector('div')) { cb(); return; }
      if (Date.now() - start < maxWait) requestAnimationFrame(check);
    };
    check();
  };

  // Utility: create element with styles
  const el = (tag, attrs = {}, children = []) => {
    const e = document.createElement(tag);
    if (attrs.style && typeof attrs.style === 'object') {
      Object.assign(e.style, attrs.style);
      delete attrs.style;
    }
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v);
    });
    children.forEach(c => {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  };

  // SVG icon helper
  const svg = (path, size = 16) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', size);
    s.setAttribute('height', size);
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    s.innerHTML = path;
    return s;
  };

  const icons = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    orders: '<path d="M16 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8Z"/><path d="M15 3v4a2 2 0 002 2h4"/>',
    stock: '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>',
    download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    arrowDown: '<path d="M12 5v14M5 12l7 7 7-7"/>',
    barChart: '<path d="M12 20V10M18 20V4M6 20v-4"/>',
    trendUp: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    users: '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
    broadcast: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2a5.5 5.5 0 010-8.4"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a5.5 5.5 0 010 8.4"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>'
  };

  // ========================================
  // FEATURE #1: Quick Actions on Dashboard
  // ========================================
  function injectQuickActions() {
    const observer = new MutationObserver(() => {
      const banner = document.querySelector('.welcome-banner');
      if (!banner) return;

      // Only inject once
      if (document.getElementById('quick-actions')) return;

      // Find the parent container after the banner
      const bannerParent = banner.parentElement;
      if (!bannerParent) return;

      const actionsDiv = el('div', {
        id: 'quick-actions',
        className: 'quick-actions-grid',
        style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '0' }
      }, [
        createQuickAction('Tambah Produk', icons.plus, '/products', 'hsl(217 91% 60%)', 'hsl(217 91% 50%)'),
        createQuickAction('Lihat Order', icons.orders, '/orders', 'hsl(142 71% 45%)', 'hsl(142 71% 38%)'),
        createQuickAction('Cek Stok', icons.stock, '/stock', 'hsl(38 92% 50%)', 'hsl(38 92% 42%)'),
        createQuickAction('Broadcast', icons.broadcast, '/broadcast', 'hsl(262 83% 58%)', 'hsl(262 83% 48%)'),
      ]);

      // Insert after banner
      banner.after(actionsDiv);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function createQuickAction(label, iconPath, href, bg, bgHover) {
    const btn = el('a', {
      href: href,
      className: 'quick-action-btn',
      style: {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 16px', borderRadius: '12px',
        background: bg, color: '#fff',
        textDecoration: 'none', fontSize: '13px', fontWeight: '600',
        transition: 'all 0.2s ease', cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }
    }, [
      (() => { const s = svg(iconPath, 18); s.style.flexShrink = '0'; return s; })(),
      el('span', {}, [label])
    ]);

    btn.addEventListener('mouseenter', () => { btn.style.background = bgHover; btn.style.transform = 'translateY(-1px)'; btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = bg; btn.style.transform = 'translateY(0)'; btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'; });

    // Use React Router navigation
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    return btn;
  }

  // ========================================
  // FEATURE #2: Global Search (Ctrl+K)
  // ========================================
  const searchPages = [
    { label: 'Dashboard', path: '/', icon: icons.barChart, desc: 'Ringkasan performa toko' },
    { label: 'Products', path: '/products', icon: icons.plus, desc: 'Kelola produk & varian' },
    { label: 'Manajemen Stok', path: '/stock', icon: icons.stock, desc: 'Pantau & tambah stok' },
    { label: 'Orders', path: '/orders', icon: icons.orders, desc: 'Daftar pesanan' },
    { label: 'Kupon & Diskon', path: '/coupons', icon: icons.plus, desc: 'Kelola kupon' },
    { label: 'Rekap Keuangan', path: '/finance', icon: icons.trendUp, desc: 'Pendapatan & laporan' },
    { label: 'Users & Blacklist', path: '/users', icon: icons.users, desc: 'Kelola pengguna' },
    { label: 'Broadcast', path: '/broadcast', icon: icons.broadcast, desc: 'Kirim pesan massal' },
    { label: 'Bot Messages', path: '/bot-messages', icon: icons.orders, desc: 'Kustomisasi pesan bot' },
    { label: 'Settings', path: '/settings', icon: icons.stock, desc: 'Pengaturan toko' },
    { label: 'Tools', path: '/tools', icon: icons.stock, desc: 'Password Filler, Duplicate Remover' },
  ];

  function initGlobalSearch() {
    // Create overlay
    const overlay = el('div', { id: 'search-overlay', style: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      zIndex: 9999, display: 'none', justifyContent: 'center', alignItems: 'flex-start',
      paddingTop: '15vh'
    }});

    const modal = el('div', { style: {
      background: 'hsl(222 47% 11%)', border: '1px solid hsl(215 20% 25%)',
      borderRadius: '16px', width: '560px', maxWidth: '90vw',
      boxShadow: '0 25px 60px rgba(0,0,0,0.5)', overflow: 'hidden',
      animation: 'searchEnter 0.15s ease-out'
    }});

    const inputWrapper = el('div', { style: {
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '16px 20px', borderBottom: '1px solid hsl(215 20% 20%)'
    }}, [
      (() => { const s = svg(icons.search, 20); s.style.color = 'hsl(215 20% 55%)'; s.style.flexShrink = '0'; return s; })()
    ]);

    const input = el('input', {
      type: 'text', placeholder: 'Cari halaman atau fitur...',
      style: {
        flex: 1, background: 'transparent', border: 'none', outline: 'none',
        color: '#fff', fontSize: '15px', fontFamily: 'Inter, sans-serif'
      }
    });
    inputWrapper.appendChild(input);

    const kbd = el('kbd', { style: {
      padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
      background: 'hsl(215 20% 18%)', border: '1px solid hsl(215 20% 25%)',
      color: 'hsl(215 20% 55%)', fontFamily: 'Inter, sans-serif'
    }}, ['ESC']);
    inputWrapper.appendChild(kbd);

    const resultsList = el('div', { id: 'search-results', style: {
      maxHeight: '400px', overflowY: 'auto', padding: '8px'
    }});

    modal.appendChild(inputWrapper);
    modal.appendChild(resultsList);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function renderResults(query) {
      resultsList.innerHTML = '';
      const q = query.toLowerCase().trim();
      const filtered = q ? searchPages.filter(p =>
        p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
      ) : searchPages;

      filtered.forEach((page, i) => {
        const item = el('a', {
          href: page.path,
          className: 'search-result-item',
          style: {
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 12px', borderRadius: '10px',
            textDecoration: 'none', color: '#fff', cursor: 'pointer',
            transition: 'background 0.15s',
            background: i === 0 && q ? 'hsl(215 20% 18%)' : 'transparent'
          }
        }, [
          el('div', { style: {
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'hsl(217 91% 60% / 0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: '0'
          }}, [(() => { const s = svg(page.icon, 16); s.style.color = 'hsl(217 91% 60%)'; return s; })()]),
          el('div', { style: { flex: 1, minWidth: 0 } }, [
            el('div', { style: { fontSize: '14px', fontWeight: '500' } }, [page.label]),
            el('div', { style: { fontSize: '12px', color: 'hsl(215 20% 55%)', marginTop: '1px' } }, [page.desc])
          ])
        ]);

        item.addEventListener('mouseenter', () => { item.style.background = 'hsl(215 20% 18%)'; });
        item.addEventListener('mouseleave', () => { item.style.background = 'transparent'; });
        item.addEventListener('click', (e) => {
          e.preventDefault();
          closeSearch();
          window.history.pushState({}, '', page.path);
          window.dispatchEvent(new PopStateEvent('popstate'));
        });

        resultsList.appendChild(item);
      });

      if (filtered.length === 0) {
        resultsList.appendChild(el('div', { style: {
          padding: '24px', textAlign: 'center', color: 'hsl(215 20% 55%)', fontSize: '14px'
        }}, ['Tidak ditemukan halaman yang cocok.']));
      }
    }

    function openSearch() {
      overlay.style.display = 'flex';
      input.value = '';
      input.focus();
      renderResults('');
    }

    function closeSearch() {
      overlay.style.display = 'none';
    }

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });
    input.addEventListener('input', () => renderResults(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSearch();
      if (e.key === 'Enter') {
        const first = resultsList.querySelector('a');
        if (first) first.click();
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (overlay.style.display === 'flex') closeSearch();
        else openSearch();
      }
    });

    // Add search trigger in sidebar
    addSidebarSearchButton(openSearch);
  }

  function addSidebarSearchButton(openFn) {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector('aside');
      if (!sidebar || document.getElementById('sidebar-search-btn')) return;

      const nav = sidebar.querySelector('nav');
      if (!nav) return;

      const searchBtn = el('button', {
        id: 'sidebar-search-btn',
        style: {
          display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
          padding: '8px 16px', margin: '0 0 8px 0', borderRadius: '8px',
          background: 'hsl(215 20% 15%)', border: '1px solid hsl(215 20% 22%)',
          color: 'hsl(215 20% 55%)', cursor: 'pointer', fontSize: '13px',
          fontFamily: 'Inter, sans-serif', transition: 'all 0.2s'
        },
        onClick: openFn
      }, [
        (() => { const s = svg(icons.search, 14); s.style.flexShrink = '0'; return s; })(),
        el('span', { style: { flex: 1, textAlign: 'left' } }, ['Cari...']),
        el('kbd', { style: {
          padding: '1px 6px', borderRadius: '4px', fontSize: '10px',
          background: 'hsl(215 20% 20%)', border: '1px solid hsl(215 20% 28%)',
          color: 'hsl(215 20% 50%)', fontFamily: 'Inter, sans-serif'
        }}, ['Ctrl+K'])
      ]);

      searchBtn.addEventListener('mouseenter', () => {
        searchBtn.style.borderColor = 'hsl(217 91% 60% / 0.4)';
        searchBtn.style.background = 'hsl(215 20% 17%)';
      });
      searchBtn.addEventListener('mouseleave', () => {
        searchBtn.style.borderColor = 'hsl(215 20% 22%)';
        searchBtn.style.background = 'hsl(215 20% 15%)';
      });

      // Insert at the top of nav
      nav.parentElement.insertBefore(searchBtn, nav);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ========================================
  // FEATURE #3: Real-time Notifications
  // ========================================
  let lastOrderCount = null;
  let notifEnabled = true;

  function initNotifications() {
    // Poll for new orders every 30 seconds
    setInterval(checkNewOrders, 30000);

    // Add notification bell to sidebar
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector('aside');
      if (!sidebar || document.getElementById('notif-bell')) return;

      // Find the sidebar header area
      const sidebarHeader = sidebar.querySelector('div');
      if (!sidebarHeader) return;

      const bellBtn = el('button', {
        id: 'notif-bell',
        style: {
          position: 'relative', background: 'transparent', border: 'none',
          color: 'hsl(215 20% 65%)', cursor: 'pointer', padding: '4px',
          borderRadius: '8px', transition: 'all 0.2s'
        },
        title: 'Notifikasi order baru'
      }, [svg(icons.bell, 18)]);

      const badge = el('span', {
        id: 'notif-badge',
        style: {
          position: 'absolute', top: '-2px', right: '-2px',
          width: '8px', height: '8px', borderRadius: '50%',
          background: 'hsl(0 84% 60%)', display: 'none',
          boxShadow: '0 0 0 2px hsl(222 47% 11%)'
        }
      });
      bellBtn.appendChild(badge);

      bellBtn.addEventListener('mouseenter', () => { bellBtn.style.color = '#fff'; });
      bellBtn.addEventListener('mouseleave', () => { bellBtn.style.color = 'hsl(215 20% 65%)'; });
      bellBtn.addEventListener('click', () => {
        badge.style.display = 'none';
        window.history.pushState({}, '', '/orders');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function checkNewOrders() {
    try {
      const res = await fetch('/api/orders?limit=1&status=pending');
      if (!res.ok) return;
      const data = await res.json();
      const count = data.total || data.length || 0;

      if (lastOrderCount !== null && count > lastOrderCount && notifEnabled) {
        showToast(`${count - lastOrderCount} order baru masuk!`, 'info');
        const badge = document.getElementById('notif-badge');
        if (badge) badge.style.display = 'block';

        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('Order Baru!', { body: `${count - lastOrderCount} order baru masuk.`, icon: '/favicon.svg' });
        }
      }
      lastOrderCount = count;
    } catch (e) { /* silent fail */ }
  }

  function showToast(message, type = 'info') {
    const colors = {
      info: { bg: 'hsl(217 91% 60%)', border: 'hsl(217 91% 50%)' },
      success: { bg: 'hsl(142 71% 45%)', border: 'hsl(142 71% 38%)' },
      error: { bg: 'hsl(0 84% 60%)', border: 'hsl(0 84% 50%)' },
      warning: { bg: 'hsl(38 92% 50%)', border: 'hsl(38 92% 42%)' }
    };
    const c = colors[type] || colors.info;

    let container = document.getElementById('toast-container');
    if (!container) {
      container = el('div', { id: 'toast-container', style: {
        position: 'fixed', top: '16px', right: '16px', zIndex: 10000,
        display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none'
      }});
      document.body.appendChild(container);
    }

    const toast = el('div', { style: {
      background: 'hsl(222 47% 14%)', border: `1px solid ${c.border}`,
      borderRadius: '12px', padding: '12px 16px',
      color: '#fff', fontSize: '13px', fontWeight: '500',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)', pointerEvents: 'auto',
      display: 'flex', alignItems: 'center', gap: '10px',
      animation: 'toastEnter 0.3s ease-out', fontFamily: 'Inter, sans-serif',
      maxWidth: '360px'
    }}, [
      el('div', { style: {
        width: '8px', height: '8px', borderRadius: '50%',
        background: c.bg, flexShrink: '0'
      }}),
      el('span', {}, [message]),
    ]);

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastExit 0.3s ease-in forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // ========================================
  // FEATURE #4: Export Data (CSV)
  // ========================================
  function initExportButtons() {
    const observer = new MutationObserver(() => {
      // Orders page export
      const ordersTitle = findPageTitle('Daftar Pesanan');
      if (ordersTitle && !document.getElementById('export-orders-btn')) {
        const container = ordersTitle.closest('div');
        if (container) {
          const exportBtn = createExportButton('export-orders-btn', 'Export CSV', exportOrders);
          // Find the button container (usually next to filter buttons)
          const btnArea = container.parentElement;
          if (btnArea) {
            btnArea.style.display = 'flex';
            btnArea.style.alignItems = 'center';
            btnArea.style.justifyContent = 'space-between';
            btnArea.style.flexWrap = 'wrap';
            btnArea.style.gap = '8px';
            // Insert at the end of the header row
            const headerRow = ordersTitle.closest('[class*="flex"]');
            if (headerRow) {
              headerRow.appendChild(exportBtn);
            }
          }
        }
      }

      // Finance page export
      const financeTitle = findPageTitle('Rekap Keuangan');
      if (financeTitle && !document.getElementById('export-finance-btn')) {
        const headerRow = financeTitle.closest('[class*="flex"]');
        if (headerRow) {
          headerRow.appendChild(createExportButton('export-finance-btn', 'Export CSV', exportFinance));
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function findPageTitle(text) {
    const headings = document.querySelectorAll('h1, h2');
    for (const h of headings) {
      if (h.textContent.trim() === text) return h;
    }
    return null;
  }

  function createExportButton(id, label, onClick) {
    const btn = el('button', {
      id: id,
      style: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '7px 14px', borderRadius: '8px',
        background: 'hsl(215 20% 18%)', border: '1px solid hsl(215 20% 25%)',
        color: 'hsl(215 20% 75%)', cursor: 'pointer', fontSize: '13px',
        fontWeight: '500', fontFamily: 'Inter, sans-serif',
        transition: 'all 0.2s', whiteSpace: 'nowrap'
      },
      onClick: onClick
    }, [
      svg(icons.download, 14),
      el('span', {}, [label])
    ]);

    btn.addEventListener('mouseenter', () => {
      btn.style.borderColor = 'hsl(217 91% 60% / 0.5)';
      btn.style.color = '#fff';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.borderColor = 'hsl(215 20% 25%)';
      btn.style.color = 'hsl(215 20% 75%)';
    });

    return btn;
  }

  function exportOrders() {
    const table = document.querySelector('table');
    if (!table) { showToast('Tidak ada tabel order untuk di-export', 'warning'); return; }
    const csv = tableToCSV(table);
    downloadCSV(csv, `orders_${new Date().toISOString().slice(0,10)}.csv`);
    showToast('Order berhasil di-export!', 'success');
  }

  function exportFinance() {
    // Try to export finance stats
    const cards = document.querySelectorAll('[class*="bg-card"]');
    const rows = [['Metrik', 'Nilai']];
    cards.forEach(card => {
      const title = card.querySelector('[class*="text-sm"]');
      const value = card.querySelector('[class*="font-bold"]');
      if (title && value) {
        rows.push([title.textContent.trim(), value.textContent.trim()]);
      }
    });

    // Also try to export table if present
    const table = document.querySelector('table');
    if (table) {
      const csv = tableToCSV(table);
      downloadCSV(csv, `keuangan_${new Date().toISOString().slice(0,10)}.csv`);
    } else if (rows.length > 1) {
      const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      downloadCSV(csv, `keuangan_${new Date().toISOString().slice(0,10)}.csv`);
    } else {
      showToast('Tidak ada data untuk di-export', 'warning');
      return;
    }
    showToast('Data keuangan berhasil di-export!', 'success');
  }

  function tableToCSV(table) {
    const rows = [];
    table.querySelectorAll('tr').forEach(tr => {
      const cells = [];
      tr.querySelectorAll('th, td').forEach(td => {
        // Skip checkbox columns
        if (td.querySelector('button[role="checkbox"]')) return;
        if (td.querySelector('[data-state]')) return;
        let text = td.textContent.trim().replace(/"/g, '""');
        cells.push(`"${text}"`);
      });
      if (cells.length > 0) rows.push(cells.join(','));
    });
    return rows.join('\n');
  }

  function downloadCSV(csv, filename) {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // ========================================
  // FEATURE #5: Dark/Light Mode Toggle
  // ========================================
  function initThemeToggle() {
    const saved = localStorage.getItem('admin-theme') || 'dark';
    if (saved === 'light') applyLightTheme();

    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector('aside');
      if (!sidebar || document.getElementById('theme-toggle-btn')) return;

      // Find bottom area of sidebar (near logout)
      const logoutBtns = sidebar.querySelectorAll('button');
      let logoutBtn = null;
      logoutBtns.forEach(b => { if (b.textContent.includes('Logout')) logoutBtn = b; });

      if (!logoutBtn) return;
      const logoutContainer = logoutBtn.closest('div[class]');
      if (!logoutContainer) return;

      const isLight = document.documentElement.classList.contains('light-mode');
      const toggleBtn = el('button', {
        id: 'theme-toggle-btn',
        style: {
          display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
          padding: '8px 12px', borderRadius: '8px',
          background: 'transparent', border: '1px solid hsl(215 20% 22%)',
          color: 'hsl(215 20% 65%)', cursor: 'pointer', fontSize: '13px',
          fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
          marginBottom: '8px'
        }
      }, [
        svg(isLight ? icons.sun : icons.moon, 16),
        el('span', { style: { flex: 1, textAlign: 'left' } }, [isLight ? 'Light Mode' : 'Dark Mode']),
      ]);

      toggleBtn.addEventListener('click', () => {
        const nowLight = document.documentElement.classList.toggle('light-mode');
        localStorage.setItem('admin-theme', nowLight ? 'light' : 'dark');
        toggleBtn.querySelector('span').textContent = nowLight ? 'Light Mode' : 'Dark Mode';
        const svgEl = toggleBtn.querySelector('svg');
        if (svgEl) { svgEl.innerHTML = nowLight ? icons.sun : icons.moon; }
        if (nowLight) applyLightTheme(); else removeLightTheme();
      });

      toggleBtn.addEventListener('mouseenter', () => {
        toggleBtn.style.borderColor = 'hsl(217 91% 60% / 0.4)';
        toggleBtn.style.color = '#fff';
      });
      toggleBtn.addEventListener('mouseleave', () => {
        toggleBtn.style.borderColor = 'hsl(215 20% 22%)';
        toggleBtn.style.color = 'hsl(215 20% 65%)';
      });

      logoutContainer.insertBefore(toggleBtn, logoutBtn);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function applyLightTheme() {
    document.documentElement.classList.add('light-mode');
  }

  function removeLightTheme() {
    document.documentElement.classList.remove('light-mode');
  }

  // ========================================
  // FEATURE #6: Enhanced Dashboard Analytics
  // ========================================
  function initEnhancedAnalytics() {
    const observer = new MutationObserver(() => {
      const banner = document.querySelector('.welcome-banner');
      if (!banner) return;
      if (document.getElementById('analytics-extra')) return;

      // Find stats grid
      const statsGrid = document.querySelector('[class*="grid"][class*="grid-cols-1"]');
      if (!statsGrid) return;

      // Add analytics summary below stats
      const analyticsDiv = el('div', {
        id: 'analytics-extra',
        style: {
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px'
        }
      }, [
        createAnalyticCard('Tips Hari Ini', getTodayTip(), 'hsl(262 83% 58% / 0.12)', 'hsl(262 83% 58%)'),
        createAnalyticCard('Status Toko', 'Aktif & Online', 'hsl(142 71% 45% / 0.12)', 'hsl(142 71% 45%)'),
        createAnalyticCard('Waktu Server', new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB', 'hsl(217 91% 60% / 0.12)', 'hsl(217 91% 60%)')
      ]);

      statsGrid.after(analyticsDiv);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function getTodayTip() {
    const tips = [
      'Pastikan stok selalu terupdate',
      'Balas chat pelanggan dengan cepat',
      'Gunakan broadcast untuk promo',
      'Cek laporan keuangan mingguan',
      'Update foto produk secara berkala',
      'Gunakan kupon untuk menarik pembeli',
      'Monitor order yang pending',
    ];
    return tips[new Date().getDay()];
  }

  function createAnalyticCard(title, value, bg, color) {
    return el('div', { style: {
      padding: '14px 16px', borderRadius: '12px',
      background: bg, border: `1px solid ${color}33`,
      display: 'flex', flexDirection: 'column', gap: '4px'
    }}, [
      el('span', { style: { fontSize: '11px', fontWeight: '600', color: color, textTransform: 'uppercase', letterSpacing: '0.05em' } }, [title]),
      el('span', { style: { fontSize: '14px', fontWeight: '600', color: '#e2e8f0' } }, [value])
    ]);
  }

  // ========================================
  // FEATURE #7: Bulk Actions on Orders
  // ========================================
  function initBulkActions() {
    const observer = new MutationObserver(() => {
      // Check if on orders page
      if (!window.location.pathname.includes('/orders')) return;
      if (document.getElementById('bulk-actions-bar')) return;

      const table = document.querySelector('table');
      if (!table) return;

      // Check for selected checkboxes
      const checkboxes = table.querySelectorAll('button[role="checkbox"]');
      if (checkboxes.length === 0) return;

      // Create floating bulk actions bar
      const bulkBar = el('div', {
        id: 'bulk-actions-bar',
        style: {
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: 'hsl(222 47% 14%)', border: '1px solid hsl(215 20% 25%)',
          borderRadius: '14px', padding: '10px 16px',
          display: 'none', alignItems: 'center', gap: '12px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 1000,
          animation: 'bulkBarEnter 0.2s ease-out', fontFamily: 'Inter, sans-serif'
        }
      }, [
        el('span', { id: 'bulk-count', style: { fontSize: '13px', color: 'hsl(215 20% 65%)', whiteSpace: 'nowrap' } }, ['0 dipilih']),
        el('div', { style: { width: '1px', height: '24px', background: 'hsl(215 20% 25%)' } }),
        createBulkActionBtn('Export Terpilih', icons.download, () => exportSelectedOrders()),
        createBulkActionBtn('Hapus Semua Filter', icons.x, () => clearFilters()),
      ]);

      document.body.appendChild(bulkBar);

      // Watch for checkbox state changes
      const checkObserver = new MutationObserver(() => {
        const checked = table.querySelectorAll('button[role="checkbox"][data-state="checked"]');
        const bar = document.getElementById('bulk-actions-bar');
        const count = document.getElementById('bulk-count');
        if (!bar || !count) return;

        // Subtract 1 for the "select all" header checkbox
        const selectedCount = Math.max(0, checked.length - (checked.length > 0 && table.querySelector('thead button[role="checkbox"][data-state="checked"]') ? 1 : 0));

        if (selectedCount > 0) {
          bar.style.display = 'flex';
          count.textContent = `${selectedCount} dipilih`;
        } else {
          bar.style.display = 'none';
        }
      });

      checkObserver.observe(table, { attributes: true, subtree: true, attributeFilter: ['data-state'] });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function createBulkActionBtn(label, iconPath, onClick) {
    const btn = el('button', {
      style: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px', borderRadius: '8px',
        background: 'hsl(215 20% 20%)', border: '1px solid hsl(215 20% 28%)',
        color: '#e2e8f0', cursor: 'pointer', fontSize: '12px',
        fontWeight: '500', fontFamily: 'Inter, sans-serif',
        transition: 'all 0.15s', whiteSpace: 'nowrap'
      },
      onClick: onClick
    }, [svg(iconPath, 14), el('span', {}, [label])]);

    btn.addEventListener('mouseenter', () => { btn.style.background = 'hsl(215 20% 25%)'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'hsl(215 20% 20%)'; });
    return btn;
  }

  function exportSelectedOrders() {
    const table = document.querySelector('table');
    if (!table) return;

    const rows = [[]];
    // Get headers
    table.querySelectorAll('thead th').forEach(th => {
      if (th.querySelector('button[role="checkbox"]')) return;
      rows[0].push(`"${th.textContent.trim()}"`);
    });

    // Get checked rows
    table.querySelectorAll('tbody tr').forEach(tr => {
      const checkbox = tr.querySelector('button[role="checkbox"]');
      if (checkbox && checkbox.getAttribute('data-state') === 'checked') {
        const cells = [];
        tr.querySelectorAll('td').forEach(td => {
          if (td.querySelector('button[role="checkbox"]')) return;
          cells.push(`"${td.textContent.trim().replace(/"/g, '""')}"`);
        });
        rows.push(cells);
      }
    });

    if (rows.length <= 1) {
      showToast('Pilih order yang ingin di-export', 'warning');
      return;
    }

    const csv = rows.map(r => r.join(',')).join('\n');
    downloadCSV(csv, `orders_selected_${new Date().toISOString().slice(0,10)}.csv`);
    showToast(`${rows.length - 1} order berhasil di-export!`, 'success');
  }

  function clearFilters() {
    // Click all checked checkboxes to uncheck them
    const table = document.querySelector('table');
    if (!table) return;
    const selectAll = table.querySelector('thead button[role="checkbox"]');
    if (selectAll && selectAll.getAttribute('data-state') !== 'unchecked') {
      selectAll.click();
    }
  }

  // ========================================
  // FEATURE #8: Drag & Drop Products
  // ========================================
  function initDragDropProducts() {
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== '/products') return;

      const cards = document.querySelectorAll('main [class*="rounded-xl"][class*="border"]');
      if (cards.length === 0) return;

      cards.forEach(card => {
        if (card.getAttribute('data-draggable') === 'true') return;
        if (!card.querySelector('[class*="font-semibold"]')) return;

        card.setAttribute('data-draggable', 'true');
        card.setAttribute('draggable', 'true');
        card.style.transition = 'all 0.2s ease';

        // Add drag handle
        const handle = el('div', {
          className: 'drag-handle',
          style: {
            position: 'absolute', left: '-2px', top: '50%', transform: 'translateY(-50%)',
            cursor: 'grab', color: 'hsl(215 20% 40%)', padding: '4px',
            borderRadius: '4px', transition: 'color 0.15s', opacity: '0',
            zIndex: 5
          }
        }, [svg(icons.grip, 16)]);

        handle.addEventListener('mouseenter', () => { handle.style.color = 'hsl(215 20% 65%)'; });
        handle.addEventListener('mouseleave', () => { handle.style.color = 'hsl(215 20% 40%)'; });

        if (!card.style.position || card.style.position === 'static') {
          card.style.position = 'relative';
        }
        card.appendChild(handle);

        // Show handle on hover
        card.addEventListener('mouseenter', () => { handle.style.opacity = '1'; });
        card.addEventListener('mouseleave', () => { handle.style.opacity = '0'; });

        // Drag events
        card.addEventListener('dragstart', (e) => {
          card.style.opacity = '0.5';
          card.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
          card.style.opacity = '1';
          card.classList.remove('dragging');
          document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });

        card.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          card.classList.add('drag-over');
        });

        card.addEventListener('dragleave', () => {
          card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
          e.preventDefault();
          card.classList.remove('drag-over');
          const dragging = document.querySelector('.dragging');
          if (dragging && dragging !== card) {
            const parent = card.parentElement;
            const cards = [...parent.children];
            const fromIdx = cards.indexOf(dragging);
            const toIdx = cards.indexOf(card);
            if (fromIdx < toIdx) {
              parent.insertBefore(dragging, card.nextSibling);
            } else {
              parent.insertBefore(dragging, card);
            }
            showToast('Urutan produk berubah (visual only)', 'info');
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ========================================
  // FEATURE #8b: Drag & Drop Variants
  // ========================================
  function initDragDropVariants() {
    let dragState = null; // { el, placeholder, startY, offsetY, container, startIdx }

    const observer = new MutationObserver(() => {
      // Only on product detail pages /products/:id
      if (!/\/products\/\d+/.test(window.location.pathname)) return;

      // Find the "Varian & Stok Konten" section
      const headers = document.querySelectorAll('main [class*="font-semibold"], main [class*="CardTitle"]');
      let variantSection = null;
      headers.forEach(h => {
        if (h.textContent && h.textContent.includes('Varian') && h.textContent.includes('Stok Konten')) {
          variantSection = h.closest('[class*="Card"], [class*="card"], [class*="rounded"]');
        }
      });
      if (!variantSection) return;

      // Find the variant list container (divide-y divide-border)
      const variantContainer = variantSection.querySelector('.divide-y');
      if (!variantContainer) return;
      if (variantContainer.getAttribute('data-variant-drag') === 'true') return;
      variantContainer.setAttribute('data-variant-drag', 'true');

      const variantItems = variantContainer.children;
      if (variantItems.length < 2) return;

      [...variantItems].forEach(item => {
        if (item.querySelector('.variant-drag-handle')) return;

        const innerRow = item.querySelector('div > .flex.items-center') || item.querySelector('div');
        if (!innerRow) return;

        // Add drag handle
        const handle = el('div', {
          className: 'variant-drag-handle',
          style: {
            cursor: 'grab', color: 'hsl(215 20% 40%)', padding: '6px 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '4px', transition: 'color 0.15s, opacity 0.15s',
            opacity: '0.4', flexShrink: '0', touchAction: 'none',
            marginRight: '4px'
          }
        }, [svg(icons.grip, 16)]);

        handle.addEventListener('mouseenter', () => { handle.style.color = 'hsl(215 20% 65%)'; handle.style.opacity = '1'; });
        handle.addEventListener('mouseleave', () => { if (!dragState) { handle.style.color = 'hsl(215 20% 40%)'; handle.style.opacity = '0.4'; }});

        // Insert handle at beginning of the row
        if (innerRow.firstChild) {
          innerRow.insertBefore(handle, innerRow.firstChild);
        } else {
          innerRow.appendChild(handle);
        }

        // Pointer-based drag (works on both mouse and touch)
        handle.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          handle.setPointerCapture(e.pointerId);

          const container = item.parentElement;
          const items = [...container.children];
          const startIdx = items.indexOf(item);
          const rect = item.getBoundingClientRect();
          const offsetY = e.clientY - rect.top;

          // Create placeholder
          const placeholder = document.createElement('div');
          placeholder.style.cssText = `height:${rect.height}px;border:2px dashed hsl(217 91% 60% / 0.4);border-radius:8px;background:hsl(217 91% 60% / 0.05);margin:0;transition:height 0.15s;`;
          placeholder.className = 'variant-drag-placeholder';

          // Style the dragged item
          item.style.position = 'fixed';
          item.style.width = rect.width + 'px';
          item.style.left = rect.left + 'px';
          item.style.top = (e.clientY - offsetY) + 'px';
          item.style.zIndex = '9999';
          item.style.opacity = '0.9';
          item.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
          item.style.borderRadius = '8px';
          item.style.background = 'hsl(222 47% 14%)';
          item.style.pointerEvents = 'none';
          item.style.transition = 'none';

          container.insertBefore(placeholder, item.nextSibling);

          handle.style.cursor = 'grabbing';

          dragState = { el: item, placeholder, startY: e.clientY, offsetY, container, startIdx, pointerId: e.pointerId };
        });

        handle.addEventListener('pointermove', (e) => {
          if (!dragState || dragState.el !== item) return;
          e.preventDefault();

          const newTop = e.clientY - dragState.offsetY;
          item.style.top = newTop + 'px';

          // Find the item we're hovering over
          const children = [...dragState.container.children].filter(c => c !== item && !c.classList.contains('variant-drag-placeholder'));
          const placeholder = dragState.placeholder;

          for (const child of children) {
            const childRect = child.getBoundingClientRect();
            const childMid = childRect.top + childRect.height / 2;
            if (e.clientY < childMid) {
              dragState.container.insertBefore(placeholder, child);
              return;
            }
          }
          // If past all items, append at end
          dragState.container.appendChild(placeholder);
        });

        const endDrag = (e) => {
          if (!dragState || dragState.el !== item) return;

          const container = dragState.container;
          const placeholder = dragState.placeholder;

          // Reset styles
          item.style.position = '';
          item.style.width = '';
          item.style.left = '';
          item.style.top = '';
          item.style.zIndex = '';
          item.style.opacity = '';
          item.style.boxShadow = '';
          item.style.borderRadius = '';
          item.style.background = '';
          item.style.pointerEvents = '';
          item.style.transition = '';

          handle.style.cursor = 'grab';

          // Move element to placeholder position
          container.insertBefore(item, placeholder);
          placeholder.remove();

          // Get new order and persist via API
          const newItems = [...container.children];
          const newIdx = newItems.indexOf(item);
          if (newIdx !== dragState.startIdx) {
            persistVariantOrder(container);
            showToast('Urutan varian berhasil diubah', 'success');
          }

          dragState = null;
        };

        handle.addEventListener('pointerup', endDrag);
        handle.addEventListener('pointercancel', endDrag);
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function persistVariantOrder(container) {
    const items = [...container.children];
    const token = localStorage.getItem('dn_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    items.forEach((item, idx) => {
      // Extract variant ID from data-testid attributes (e.g., btn-edit-variant-123)
      const editBtn = item.querySelector('[data-testid^="btn-edit-variant-"]');
      const deleteBtn = item.querySelector('[data-testid^="btn-delete-variant-"]');
      let variantId = null;

      if (editBtn) {
        const match = editBtn.getAttribute('data-testid').match(/btn-edit-variant-(\d+)/);
        if (match) variantId = parseInt(match[1]);
      } else if (deleteBtn) {
        const match = deleteBtn.getAttribute('data-testid').match(/btn-delete-variant-(\d+)/);
        if (match) variantId = parseInt(match[1]);
      }

      if (variantId) {
        fetch('/api/variants/' + variantId, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify({ displayOrder: idx + 1 })
        }).catch(err => console.warn('Failed to update variant order:', err));
      }
    });
  }

  // ========================================
  // KEYBOARD SHORTCUTS
  // ========================================
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

      const shortcuts = {
        'd': '/',
        'p': '/products',
        'o': '/orders',
        's': '/stock',
        'f': '/finance',
        'b': '/broadcast',
        'u': '/users',
      };

      if (!e.ctrlKey && !e.metaKey && !e.altKey && shortcuts[e.key]) {
        e.preventDefault();
        window.history.pushState({}, '', shortcuts[e.key]);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    });
  }

  // ========================================
  // FEATURE #9: Broadcast Templates
  // ========================================
  const TEMPLATES_KEY = 'broadcast-templates';

  function getTemplates() {
    try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]'); } catch { return []; }
  }

  function saveTemplates(templates) {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  }

  function initBroadcastTemplates() {
    const observer = new MutationObserver(() => {
      if (!window.location.pathname.includes('/broadcast')) return;
      if (document.getElementById('broadcast-templates-section')) return;

      // Find the textarea (message input)
      const textarea = document.querySelector('textarea');
      if (!textarea) return;

      // Find the send button area
      const sendBtnArea = document.querySelector('main [class*="flex"][class*="justify-end"]');
      if (!sendBtnArea) return;

      // Add "Save as Template" button next to send
      if (!document.getElementById('save-template-btn')) {
        const saveBtn = el('button', {
          id: 'save-template-btn',
          style: {
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px',
            background: 'hsl(215 20% 18%)', border: '1px solid hsl(215 20% 25%)',
            color: 'hsl(215 20% 75%)', cursor: 'pointer', fontSize: '13px',
            fontWeight: '500', fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s', marginRight: '8px'
          }
        }, [
          svg(icons.plus, 14),
          el('span', {}, ['Simpan Template'])
        ]);

        saveBtn.addEventListener('mouseenter', () => {
          saveBtn.style.borderColor = 'hsl(217 91% 60% / 0.5)';
          saveBtn.style.color = '#fff';
        });
        saveBtn.addEventListener('mouseleave', () => {
          saveBtn.style.borderColor = 'hsl(215 20% 25%)';
          saveBtn.style.color = 'hsl(215 20% 75%)';
        });

        saveBtn.addEventListener('click', () => {
          const msg = textarea.value.trim();
          if (!msg) {
            showToast('Tulis pesan dulu sebelum menyimpan template', 'warning');
            return;
          }
          showSaveTemplateDialog(msg);
        });

        sendBtnArea.style.display = 'flex';
        sendBtnArea.style.gap = '8px';
        sendBtnArea.insertBefore(saveBtn, sendBtnArea.firstChild);
      }

      // Render template list below
      renderTemplateList(textarea);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function showSaveTemplateDialog(message) {
    // Remove existing dialog
    const existing = document.getElementById('save-template-dialog');
    if (existing) existing.remove();

    const overlay = el('div', {
      id: 'save-template-dialog',
      style: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
      }
    });

    const modal = el('div', { style: {
      background: 'hsl(222 47% 11%)', border: '1px solid hsl(215 20% 25%)',
      borderRadius: '16px', width: '420px', maxWidth: '90vw', padding: '24px',
      boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      animation: 'searchEnter 0.15s ease-out'
    }});

    const title = el('h3', { style: {
      fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '16px'
    }}, ['Simpan Template Broadcast']);

    const nameLabel = el('label', { style: {
      fontSize: '13px', color: 'hsl(215 20% 65%)', display: 'block', marginBottom: '6px'
    }}, ['Nama Template']);

    const nameInput = el('input', {
      type: 'text',
      placeholder: 'Contoh: Promo Akhir Bulan, Info Produk Baru...',
      style: {
        width: '100%', padding: '10px 12px', borderRadius: '8px',
        background: 'hsl(215 20% 15%)', border: '1px solid hsl(215 20% 25%)',
        color: '#fff', fontSize: '14px', fontFamily: 'Inter, sans-serif',
        outline: 'none', boxSizing: 'border-box'
      }
    });

    const preview = el('div', { style: {
      marginTop: '12px', padding: '10px 12px', borderRadius: '8px',
      background: 'hsl(215 20% 13%)', border: '1px solid hsl(215 20% 20%)',
      fontSize: '12px', color: 'hsl(215 20% 55%)', maxHeight: '80px',
      overflow: 'hidden', fontFamily: 'monospace', whiteSpace: 'pre-wrap'
    }}, [message.length > 200 ? message.slice(0, 200) + '...' : message]);

    const btnRow = el('div', { style: {
      display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px'
    }});

    const cancelBtn = el('button', { style: {
      padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
      background: 'transparent', border: '1px solid hsl(215 20% 25%)',
      color: 'hsl(215 20% 65%)', cursor: 'pointer', fontFamily: 'Inter, sans-serif'
    }}, ['Batal']);

    const confirmBtn = el('button', { style: {
      padding: '8px 20px', borderRadius: '8px', fontSize: '13px',
      background: 'hsl(217 91% 60%)', border: 'none',
      color: '#fff', cursor: 'pointer', fontWeight: '600', fontFamily: 'Inter, sans-serif'
    }}, ['Simpan']);

    cancelBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    confirmBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.style.borderColor = 'hsl(0 84% 60%)';
        nameInput.focus();
        return;
      }
      const templates = getTemplates();
      templates.unshift({
        id: Date.now().toString(),
        name: name,
        message: message,
        createdAt: new Date().toISOString()
      });
      saveTemplates(templates);
      overlay.remove();
      showToast('Template berhasil disimpan!', 'success');

      // Re-render template list
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const oldSection = document.getElementById('broadcast-templates-section');
        if (oldSection) oldSection.remove();
        renderTemplateList(textarea);
      }
    });

    nameInput.addEventListener('focus', () => { nameInput.style.borderColor = 'hsl(217 91% 60%)'; });
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmBtn.click(); });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    modal.appendChild(title);
    modal.appendChild(nameLabel);
    modal.appendChild(nameInput);
    modal.appendChild(preview);
    modal.appendChild(btnRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    setTimeout(() => nameInput.focus(), 100);
  }

  function renderTemplateList(textarea) {
    if (document.getElementById('broadcast-templates-section')) return;

    const templates = getTemplates();

    // Find the parent container of the broadcast form
    const mainContent = textarea.closest('[class*="space-y"]');
    if (!mainContent) return;

    const section = el('div', {
      id: 'broadcast-templates-section',
      style: { marginTop: '0' }
    });

    const header = el('div', { style: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: '12px'
    }}, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M13 8h5"/><path d="M13 12h5"/><path d="M13 16h5"/>', 18),
        el('h3', { style: {
          fontSize: '15px', fontWeight: '600', color: '#e2e8f0'
        }}, ['Template Tersimpan']),
        el('span', { style: {
          fontSize: '11px', color: 'hsl(215 20% 45%)',
          background: 'hsl(215 20% 15%)', padding: '2px 8px',
          borderRadius: '10px', fontWeight: '500'
        }}, [templates.length.toString()])
      ])
    ]);

    section.appendChild(header);

    if (templates.length === 0) {
      const empty = el('div', { style: {
        padding: '24px', textAlign: 'center', borderRadius: '12px',
        border: '1px dashed hsl(215 20% 22%)', color: 'hsl(215 20% 45%)'
      }}, [
        el('p', { style: { fontSize: '13px', marginBottom: '4px' } }, ['Belum ada template tersimpan']),
        el('p', { style: { fontSize: '11px' } }, ['Tulis pesan lalu klik "Simpan Template" untuk menyimpan'])
      ]);
      section.appendChild(empty);
    } else {
      const grid = el('div', { style: {
        display: 'grid', gap: '8px'
      }});

      templates.forEach((tmpl, idx) => {
        const card = el('div', {
          className: 'template-card',
          style: {
            display: 'flex', alignItems: 'stretch', gap: '0',
            borderRadius: '10px', border: '1px solid hsl(215 20% 20%)',
            background: 'hsl(215 20% 12%)', overflow: 'hidden',
            transition: 'all 0.15s', cursor: 'pointer'
          }
        });

        // Main clickable area
        const mainArea = el('div', {
          style: {
            flex: 1, padding: '12px 14px', minWidth: 0, cursor: 'pointer'
          }
        }, [
          el('div', { style: {
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'
          }}, [
            el('span', { style: {
              fontSize: '13px', fontWeight: '600', color: '#e2e8f0'
            }}, [tmpl.name]),
            el('span', { style: {
              fontSize: '10px', color: 'hsl(215 20% 40%)',
              marginLeft: 'auto', whiteSpace: 'nowrap'
            }}, [new Date(tmpl.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })])
          ]),
          el('p', { style: {
            fontSize: '12px', color: 'hsl(215 20% 50%)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            fontFamily: 'monospace'
          }}, [tmpl.message.slice(0, 100)])
        ]);

        mainArea.addEventListener('click', () => {
          // Set textarea value using React's synthetic event system
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 'value'
          ).set;
          nativeInputValueSetter.call(textarea, tmpl.message);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
          textarea.focus();
          textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
          showToast(`Template "${tmpl.name}" dipasang`, 'success');
        });

        mainArea.addEventListener('mouseenter', () => {
          card.style.borderColor = 'hsl(217 91% 60% / 0.4)';
          card.style.background = 'hsl(215 20% 14%)';
        });
        mainArea.addEventListener('mouseleave', () => {
          card.style.borderColor = 'hsl(215 20% 20%)';
          card.style.background = 'hsl(215 20% 12%)';
        });

        // Delete button
        const deleteBtn = el('button', {
          style: {
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', background: 'transparent', border: 'none',
            borderLeft: '1px solid hsl(215 20% 20%)',
            color: 'hsl(215 20% 40%)', cursor: 'pointer',
            transition: 'all 0.15s', flexShrink: '0'
          },
          title: 'Hapus template'
        }, [svg(icons.trash, 14)]);

        deleteBtn.addEventListener('mouseenter', () => {
          deleteBtn.style.color = 'hsl(0 84% 60%)';
          deleteBtn.style.background = 'hsl(0 84% 60% / 0.08)';
        });
        deleteBtn.addEventListener('mouseleave', () => {
          deleteBtn.style.color = 'hsl(215 20% 40%)';
          deleteBtn.style.background = 'transparent';
        });

        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!window.confirm(`Hapus template "${tmpl.name}"?`)) return;
          const templates = getTemplates();
          const updated = templates.filter(t => t.id !== tmpl.id);
          saveTemplates(updated);
          card.style.animation = 'toastExit 0.2s ease-in forwards';
          setTimeout(() => {
            card.remove();
            // Update count
            const countEl = section.querySelector('span[style*="borderRadius"]');
            if (countEl) countEl.textContent = updated.length.toString();
            // Show empty state if no templates left
            if (updated.length === 0) {
              const oldSection = document.getElementById('broadcast-templates-section');
              if (oldSection) oldSection.remove();
              renderTemplateList(textarea);
            }
          }, 200);
          showToast('Template dihapus', 'info');
        });

        card.appendChild(mainArea);
        card.appendChild(deleteBtn);
        grid.appendChild(card);
      });

      section.appendChild(grid);
    }

    // Insert the template section at the bottom of the page (after all cards)
    // Find the warning card (last card on the page)
    const allCards = mainContent.querySelectorAll(':scope > div[class*="rounded"]');
    const warningCard = mainContent.querySelector('[class*="border-orange"]');
    if (warningCard) {
      warningCard.after(section);
    } else {
      mainContent.appendChild(section);
    }
  }

  // ========================================
  // INITIALIZE ALL FEATURES
  // ========================================
  waitForApp(() => {
    try { injectQuickActions(); } catch(e) { console.warn('Quick Actions failed:', e); }
    try { initGlobalSearch(); } catch(e) { console.warn('Global Search failed:', e); }
    try { initNotifications(); } catch(e) { console.warn('Notifications failed:', e); }
    try { initExportButtons(); } catch(e) { console.warn('Export failed:', e); }
    try { initThemeToggle(); } catch(e) { console.warn('Theme Toggle failed:', e); }
    try { initEnhancedAnalytics(); } catch(e) { console.warn('Analytics failed:', e); }
    try { initBulkActions(); } catch(e) { console.warn('Bulk Actions failed:', e); }
    try { initDragDropProducts(); } catch(e) { console.warn('Drag & Drop failed:', e); }
    try { initDragDropVariants(); } catch(e) { console.warn('Drag & Drop Variants failed:', e); }
    try { initKeyboardShortcuts(); } catch(e) { console.warn('Keyboard Shortcuts failed:', e); }
    try { initBroadcastTemplates(); } catch(e) { console.warn('Broadcast Templates failed:', e); }

    console.log('[Admin Panel] All features loaded successfully');
  });

})();


// ========================================
// FEATURE #10: Stock Grid Layout
// Transforms stock page from vertical list to grid boxes
// with popup modal for editing/adding stock
// ========================================
(function() {
  'use strict';

  const STOCK_GRID_STYLE_ID = 'stock-grid-styles';

  function injectStockGridStyles() {
    if (document.getElementById(STOCK_GRID_STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STOCK_GRID_STYLE_ID;
    style.textContent = [
      '.stock-grid-container { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }',
      '@media (min-width:1280px) { .stock-grid-container { grid-template-columns:repeat(4,1fr); } }',
      '@media (max-width:768px) { .stock-grid-container { grid-template-columns:repeat(2,1fr); } }',
      '@media (max-width:480px) { .stock-grid-container { grid-template-columns:1fr; } }',
      '.stock-grid-card { background:hsl(var(--card)); border:1px solid hsl(var(--border)); border-radius:12px; padding:16px; cursor:pointer; transition:all 0.2s cubic-bezier(0.4,0,0.2,1); display:flex; flex-direction:column; gap:10px; position:relative; overflow:hidden; }',
      '.stock-grid-card:hover { border-color:hsl(var(--primary)/0.5); transform:translateY(-2px); box-shadow:0 8px 24px -4px rgba(0,0,0,0.2),0 0 12px -2px hsl(var(--primary)/0.1); }',
      '.stock-grid-card .card-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }',
      '.stock-grid-card .card-title { font-weight:600; font-size:14px; color:hsl(var(--foreground)); line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '.stock-grid-card .card-variants { font-size:11px; color:hsl(var(--muted-foreground)); }',
      '.stock-grid-card .card-stock-badge { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:700; padding:3px 10px; border-radius:20px; }',
      '.stock-grid-card .card-stock-bar { height:4px; border-radius:4px; background:hsl(var(--muted)); overflow:hidden; margin-top:auto; }',
      '.stock-grid-card .card-stock-bar-fill { height:100%; border-radius:4px; transition:width 0.5s ease; }',
      '.stock-grid-card.stock-ok .card-icon { background:hsl(142 71% 45%/0.12); }',
      '.stock-grid-card.stock-ok .card-stock-badge { background:hsl(142 71% 45%/0.1); color:hsl(142 71% 45%); }',
      '.stock-grid-card.stock-ok .card-stock-bar-fill { background:hsl(142 71% 45%); }',
      '.stock-grid-card.stock-low .card-icon { background:hsl(38 92% 50%/0.12); }',
      '.stock-grid-card.stock-low .card-stock-badge { background:hsl(38 92% 50%/0.1); color:hsl(38 92% 50%); }',
      '.stock-grid-card.stock-low .card-stock-bar-fill { background:hsl(38 92% 50%); }',
      '.stock-grid-card.stock-empty .card-icon { background:hsl(0 84% 55%/0.12); }',
      '.stock-grid-card.stock-empty .card-stock-badge { background:hsl(0 84% 55%/0.1); color:hsl(0 84% 55%); }',
      '.stock-grid-card.stock-empty .card-stock-bar-fill { background:hsl(0 84% 55%); }',
      '.stock-grid-card .card-inactive-badge { position:absolute; top:8px; right:8px; font-size:10px; padding:2px 6px; border-radius:4px; background:hsl(var(--muted)); color:hsl(var(--muted-foreground)); font-weight:500; }',
      '.stock-modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); z-index:10000; display:flex; align-items:center; justify-content:center; animation:stockModalFadeIn 0.2s ease; }',
      '@keyframes stockModalFadeIn { from{opacity:0} to{opacity:1} }',
      '.stock-modal { background:hsl(var(--card)); border:1px solid hsl(var(--border)); border-radius:16px; width:90%; max-width:520px; max-height:85vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.4); animation:stockModalSlideIn 0.25s ease; }',
      '@keyframes stockModalSlideIn { from{opacity:0;transform:scale(0.95) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }',
      '.stock-modal-header { display:flex; align-items:center; justify-content:space-between; padding:18px 20px; border-bottom:1px solid hsl(var(--border)); }',
      '.stock-modal-header h2 { font-size:16px; font-weight:700; color:hsl(var(--foreground)); margin:0; }',
      '.stock-modal-close { width:32px; height:32px; border-radius:8px; border:1px solid hsl(var(--border)); background:transparent; color:hsl(var(--muted-foreground)); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; font-size:18px; }',
      '.stock-modal-close:hover { background:hsl(var(--muted)); color:hsl(var(--foreground)); }',
      '.stock-modal-body { padding:16px 20px 20px; }',
      '.stock-variant-row { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-radius:10px; border:1px solid hsl(var(--border)); margin-bottom:10px; transition:border-color 0.15s; }',
      '.stock-variant-row:hover { border-color:hsl(var(--primary)/0.4); }',
      '.stock-variant-row .variant-info { flex:1; min-width:0; }',
      '.stock-variant-row .variant-name { font-weight:600; font-size:13px; color:hsl(var(--foreground)); }',
      '.stock-variant-row .variant-price { font-size:12px; color:hsl(var(--primary)); font-family:monospace; }',
      '.stock-variant-row .variant-stock-info { display:flex; align-items:center; gap:10px; flex-shrink:0; }',
      '.stock-variant-row .variant-stock-count { font-weight:700; font-size:14px; min-width:60px; text-align:center; }',
      '.stock-variant-row .variant-stock-count.ok { color:hsl(142 71% 45%); }',
      '.stock-variant-row .variant-stock-count.low { color:hsl(38 92% 50%); }',
      '.stock-variant-row .variant-stock-count.empty { color:hsl(0 84% 55%); }',
      '.stock-variant-row .variant-add-btn { width:34px; height:34px; border-radius:8px; border:1px solid hsl(var(--primary)/0.3); background:hsl(var(--primary)/0.08); color:hsl(var(--primary)); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; font-size:16px; }',
      '.stock-variant-row .variant-add-btn:hover { background:hsl(var(--primary)/0.2); border-color:hsl(var(--primary)/0.5); }',
      '.stock-variant-row .variant-inactive { font-size:10px; padding:2px 6px; border-radius:4px; background:hsl(var(--muted)); color:hsl(var(--muted-foreground)); margin-left:6px; }',
      '.stock-modal-edit { padding:20px; border-top:1px solid hsl(var(--border)); }',
      '.stock-edit-link { display:block; text-align:center; padding:10px; border-radius:8px; background:hsl(var(--primary)/0.08); color:hsl(var(--primary)); text-decoration:none; font-size:13px; font-weight:600; transition:background 0.15s; cursor:pointer; border:1px solid hsl(var(--primary)/0.2); }',
      '.stock-edit-link:hover { background:hsl(var(--primary)/0.15); }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getStockClass(available) {
    if (available === 0) return 'stock-empty';
    if (available <= 5) return 'stock-low';
    return 'stock-ok';
  }

  function getStockEmoji(available) {
    if (available === 0) return '\uD83D\uDD34';
    if (available <= 5) return '\uD83D\uDFE1';
    return '\uD83D\uDFE2';
  }

  function formatPrice(price) {
    return 'Rp ' + Number(price).toLocaleString('id-ID');
  }

  function showStockModal(product) {
    var existing = document.querySelector('.stock-modal-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'stock-modal-overlay';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });

    var totalAvail = product.variants.reduce(function(s, v) { return s + (v.available || 0); }, 0);
    var totalStock = product.variants.reduce(function(s, v) { return s + (v.totalStock || 0); }, 0);

    var variantsHtml = '';
    product.variants.forEach(function(v) {
      var countCls = v.available === 0 ? 'empty' : v.available <= 5 ? 'low' : 'ok';
      var inactiveTag = v.isActive === false ? '<span class="variant-inactive">Off</span>' : '';
      variantsHtml += '<div class="stock-variant-row">' +
        '<div class="variant-info">' +
          '<div class="variant-name">' + v.name + inactiveTag + '</div>' +
          '<div class="variant-price">' + formatPrice(v.price) + '</div>' +
        '</div>' +
        '<div class="variant-stock-info">' +
          '<div class="variant-stock-count ' + countCls + '">' + v.available + '/' + v.totalStock + '</div>' +
          '<button class="variant-add-btn" data-variant-id="' + v.id + '" title="Tambah stok">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>';
    });

    var modal = document.createElement('div');
    modal.className = 'stock-modal';
    modal.innerHTML =
      '<div class="stock-modal-header">' +
        '<h2>' + getStockEmoji(totalAvail) + ' ' + product.name + '</h2>' +
        '<button class="stock-modal-close">&times;</button>' +
      '</div>' +
      '<div class="stock-modal-body">' + variantsHtml + '</div>' +
      '<div class="stock-modal-edit">' +
        '<a class="stock-edit-link" href="/products/' + product.id + '" data-nav="true">\uD83D\uDCE6 Buka Detail Produk</a>' +
      '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector('.stock-modal-close').addEventListener('click', function() { overlay.remove(); });

    modal.querySelector('[data-nav="true"]').addEventListener('click', function(e) {
      e.preventDefault();
      overlay.remove();
      window.history.pushState({}, '', '/products/' + product.id);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    modal.querySelectorAll('.variant-add-btn').forEach(function(btn, idx) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        overlay.remove();
        triggerReactAddStock(product.id, parseInt(btn.getAttribute('data-variant-id')), idx);
      });
    });

    var escHandler = function(e) {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
  }

  function triggerReactAddStock(productId, variantId, variantIndex) {
    var mainContent = document.querySelector('main');
    if (!mainContent) return;
    var cards = mainContent.querySelectorAll('[class*="overflow-hidden"][class*="transition-all"]');
    cards.forEach(function(card) {
      var editLink = card.querySelector('a[href*="/products/"]');
      if (!editLink) return;
      var href = editLink.getAttribute('href') || '';
      var m = href.match(/\/products\/(\d+)/);
      if (!m || parseInt(m[1]) !== productId) return;
      var headerRow = card.querySelector('[class*="cursor-pointer"]');
      if (!headerRow) return;
      var expanded = card.querySelector('table');
      if (!expanded) headerRow.click();
      setTimeout(function() {
        var rows = card.querySelectorAll('tbody tr');
        if (typeof variantIndex === 'number' && variantIndex >= 0 && variantIndex < rows.length) {
          var addBtn = rows[variantIndex].querySelector('button');
          if (addBtn) addBtn.click();
        }
      }, 300);
    });
  }

  function extractProductId(card) {
    var editLink = card.querySelector('a[href*="/products/"]');
    if (editLink) {
      var m = editLink.getAttribute('href').match(/\/products\/(\d+)/);
      if (m) return parseInt(m[1]);
    }
    return 0;
  }

  function extractVariantData(card) {
    var variants = [];
    var rows = card.querySelectorAll('tbody tr');
    rows.forEach(function(row) {
      var cells = row.querySelectorAll('td');
      if (cells.length < 5) return;
      var nameEl = cells[0].querySelector('.font-medium');
      var priceEl = cells[1];
      var stockEl = cells[2];
      var name = nameEl ? nameEl.textContent.trim() : '';
      var price = priceEl ? priceEl.textContent.replace(/[^0-9]/g, '') : '0';
      var isActive = !cells[0].querySelector('[class*="text-\\[10px\\]"]');
      var stockText = stockEl ? stockEl.textContent.trim() : '0/0';
      var stockParts = stockText.match(/(\d+)\s*\/\s*(\d+)/);
      var available = stockParts ? parseInt(stockParts[1]) : 0;
      var totalStock = stockParts ? parseInt(stockParts[2]) : 0;
      var variantId = 0;
      // Try to get variant ID from React key
      var key = row.getAttribute('data-key') || '';
      var idMatch = key.match(/\d+/);
      if (idMatch) variantId = parseInt(idMatch[0]);
      variants.push({ id: variantId, name: name, price: parseInt(price) || 0, available: available, totalStock: totalStock, isActive: isActive });
    });
    return variants;
  }

  function transformStockPage() {
    if (window.location.pathname !== '/stock') return;
    var mainContent = document.querySelector('main');
    if (!mainContent) return;

    // Find the product list container
    var productListContainer = null;
    var spaceyDivs = mainContent.querySelectorAll('div');
    for (var i = 0; i < spaceyDivs.length; i++) {
      var d = spaceyDivs[i];
      if (d.className && d.className.indexOf('space-y-2') !== -1) {
        var hasCards = d.querySelectorAll(':scope > [class*="overflow-hidden"]');
        if (hasCards.length > 0) { productListContainer = d; break; }
      }
    }
    if (!productListContainer) return;
    if (productListContainer.getAttribute('data-stock-grid') === 'done') return;

    var productCards = productListContainer.querySelectorAll(':scope > [class*="overflow-hidden"]');
    if (productCards.length === 0) return;

    var products = [];
    productCards.forEach(function(card) {
      var nameEl = card.querySelector('.font-semibold');
      var stockBadgeEl = card.querySelector('[class*="border-green"], [class*="border-yellow"], [class*="border-red"]');
      var variantCountEl = null;
      var spans = card.querySelectorAll('span');
      for (var j = 0; j < spans.length; j++) {
        if (spans[j].textContent.indexOf('varian') !== -1) { variantCountEl = spans[j]; break; }
      }
      var inactiveBadge = null;
      var badges = card.querySelectorAll('[class*="text-\\[10px\\]"]');
      for (var j = 0; j < badges.length; j++) {
        if (badges[j].textContent.trim() === 'Off') { inactiveBadge = badges[j]; break; }
      }
      var headerRow = card.querySelector('[class*="cursor-pointer"]');
      var name = nameEl ? nameEl.textContent.trim() : 'Unknown';
      var stockText = stockBadgeEl ? stockBadgeEl.textContent.trim() : '0 stok';
      var totalAvailable = parseInt(stockText) || 0;
      var variantCount = variantCountEl ? variantCountEl.textContent.trim() : '';
      var isActive = !inactiveBadge;
      products.push({ name: name, totalAvailable: totalAvailable, variantCount: variantCount, isActive: isActive, card: card, headerRow: headerRow });
    });

    productListContainer.setAttribute('data-stock-grid', 'done');

    var gridContainer = document.createElement('div');
    gridContainer.className = 'stock-grid-container';
    gridContainer.setAttribute('data-stock-grid', 'done');

    products.forEach(function(product) {
      var stockClass = getStockClass(product.totalAvailable);
      var pctGuess = product.totalAvailable === 0 ? 0 : Math.min(product.totalAvailable * 5, 100);
      var gridCard = document.createElement('div');
      gridCard.className = 'stock-grid-card ' + stockClass;
      gridCard.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div class="card-icon">' + getStockEmoji(product.totalAvailable) + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div class="card-title">' + product.name + '</div>' +
            '<div class="card-variants">' + product.variantCount + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<span class="card-stock-badge">' + product.totalAvailable + ' stok</span>' +
          (!product.isActive ? '<span class="card-inactive-badge">Off</span>' : '') +
        '</div>' +
        '<div class="card-stock-bar">' +
          '<div class="card-stock-bar-fill" style="width:' + pctGuess + '%"></div>' +
        '</div>';

      gridCard.addEventListener('click', (function(prod) {
        return function() {
          if (prod.headerRow) {
            var expanded = prod.card.querySelector('table');
            if (!expanded) prod.headerRow.click();
            setTimeout(function() {
              var variantData = extractVariantData(prod.card);
              showStockModal({ id: extractProductId(prod.card), name: prod.name, variants: variantData });
            }, 400);
          }
        };
      })(product));

      gridContainer.appendChild(gridCard);
    });

    productListContainer.style.display = 'none';
    productListContainer.parentElement.insertBefore(gridContainer, productListContainer.nextSibling);
  }

  function initStockGrid() {
    injectStockGridStyles();
    var runTransform = function() { setTimeout(transformStockPage, 500); };
    window.addEventListener('popstate', runTransform);
    var observer = new MutationObserver(function() {
      if (window.location.pathname === '/stock') {
        var grid = document.querySelector('.stock-grid-container');
        if (!grid) transformStockPage();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    runTransform();
  }

  var waitReady = function(cb, maxWait) {
    maxWait = maxWait || 10000;
    var start = Date.now();
    var check = function() {
      var main = document.querySelector('main');
      if (main && main.querySelector('div')) { cb(); return; }
      if (Date.now() - start < maxWait) requestAnimationFrame(check);
    };
    check();
  };

  waitReady(function() {
    try { initStockGrid(); } catch(e) { console.warn('Stock Grid failed:', e); }
    console.log('[Admin Panel] Stock Grid feature loaded');
  });

})();


// ========================================
// FEATURE #11: Products Grid Layout
// Transforms products table into grid boxes
// ========================================
(function() {
  'use strict';

  var PROD_GRID_STYLE_ID = 'products-grid-styles';

  function injectProductGridStyles() {
    if (document.getElementById(PROD_GRID_STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = PROD_GRID_STYLE_ID;
    style.textContent = [
      '.prod-grid-container { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }',
      '@media (min-width:1280px) { .prod-grid-container { grid-template-columns:repeat(4,1fr); } }',
      '@media (max-width:768px) { .prod-grid-container { grid-template-columns:repeat(2,1fr); } }',
      '@media (max-width:480px) { .prod-grid-container { grid-template-columns:1fr; } }',
      '.prod-grid-card { background:hsl(var(--card)); border:1px solid hsl(var(--border)); border-radius:12px; padding:16px; cursor:pointer; transition:all 0.2s cubic-bezier(0.4,0,0.2,1); display:flex; flex-direction:column; gap:10px; position:relative; overflow:hidden; }',
      '.prod-grid-card:hover { border-color:hsl(var(--primary)/0.5); transform:translateY(-2px); box-shadow:0 8px 24px -4px rgba(0,0,0,0.2),0 0 12px -2px hsl(var(--primary)/0.1); }',
      '.prod-grid-card .prod-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }',
      '.prod-grid-card .prod-title { font-weight:600; font-size:14px; color:hsl(var(--foreground)); line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '.prod-grid-card .prod-desc { font-size:11px; color:hsl(var(--muted-foreground)); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '.prod-grid-card .prod-sales { font-size:12px; color:hsl(var(--muted-foreground)); font-weight:500; }',
      '.prod-grid-card .prod-status-badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; padding:3px 10px; border-radius:20px; }',
      '.prod-grid-card .prod-status-badge.active { background:hsl(142 71% 45%/0.1); color:hsl(142 71% 45%); }',
      '.prod-grid-card .prod-status-badge.inactive { background:hsl(var(--muted)); color:hsl(var(--muted-foreground)); }',
      '.prod-grid-card .prod-icon.active { background:hsl(262 83% 58%/0.12); }',
      '.prod-grid-card .prod-icon.inactive { background:hsl(var(--muted)); }',
      '.prod-grid-card .prod-actions { display:flex; gap:6px; margin-top:auto; }',
      '.prod-grid-card .prod-action-btn { flex:1; padding:6px 0; border-radius:8px; font-size:11px; font-weight:600; text-align:center; cursor:pointer; border:1px solid; transition:all 0.15s; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px; }',
      '.prod-grid-card .prod-action-manage { background:hsl(var(--primary)/0.08); color:hsl(var(--primary)); border-color:hsl(var(--primary)/0.2); }',
      '.prod-grid-card .prod-action-manage:hover { background:hsl(var(--primary)/0.15); border-color:hsl(var(--primary)/0.4); }',
      '.prod-grid-card .prod-action-delete { background:hsl(0 84% 55%/0.08); color:hsl(0 84% 55%); border-color:hsl(0 84% 55%/0.2); }',
      '.prod-grid-card .prod-action-delete:hover { background:hsl(0 84% 55%/0.15); border-color:hsl(0 84% 55%/0.4); }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function transformProductsPage() {
    if (window.location.pathname !== '/products') return;
    var mainContent = document.querySelector('main');
    if (!mainContent) return;

    var tableContainer = mainContent.querySelector('table');
    if (!tableContainer) return;
    var cardEl = tableContainer.closest('[class*="bg-card"]');
    if (!cardEl) return;
    if (cardEl.getAttribute('data-prod-grid') === 'done') return;

    var rows = tableContainer.querySelectorAll('tbody tr');
    if (!rows.length) return;

    var products = [];
    rows.forEach(function(row) {
      var cells = row.querySelectorAll('td');
      if (cells.length < 4) return;

      var nameDiv = cells[0].querySelector('.font-medium');
      var descDiv = cells[0].querySelector('.text-xs');
      var salesSpan = cells[1].querySelector('.font-medium');
      var switchEl = cells[2].querySelector('[role="switch"], button[data-state]');
      var badgeEl = cells[2].querySelector('[class*="bg-emerald"], [class*="bg-gray"]');
      var manageLink = cells[3].querySelector('a[href*="/products/"]');
      var deleteBtn = cells[3].querySelector('button[class*="destructive"], button:last-child');

      var name = nameDiv ? nameDiv.textContent.trim() : '';
      var desc = descDiv ? descDiv.textContent.trim() : '';
      var sales = salesSpan ? salesSpan.textContent.trim() : '0 sold';
      var isActive = badgeEl ? badgeEl.textContent.trim() === 'Active' : true;
      var href = manageLink ? manageLink.getAttribute('href') : '';
      var id = href ? href.replace('/products/', '') : '';

      products.push({ name: name, desc: desc, sales: sales, isActive: isActive, href: href, id: id, row: row, switchEl: switchEl, deleteBtn: deleteBtn });
    });

    if (products.length === 0) return;
    cardEl.setAttribute('data-prod-grid', 'done');

    var gridContainer = document.createElement('div');
    gridContainer.className = 'prod-grid-container';
    gridContainer.setAttribute('data-prod-grid', 'done');

    products.forEach(function(product) {
      var gridCard = document.createElement('div');
      gridCard.className = 'prod-grid-card';

      var statusCls = product.isActive ? 'active' : 'inactive';
      var emoji = product.isActive ? '\uD83D\uDFE2' : '\u26AA';

      gridCard.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div class="prod-icon ' + statusCls + '">' + emoji + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div class="prod-title">' + escapeHtml(product.name) + '</div>' +
            (product.desc ? '<div class="prod-desc">' + escapeHtml(product.desc) + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<span class="prod-sales">\uD83D\uDCCA ' + escapeHtml(product.sales) + '</span>' +
          '<span class="prod-status-badge ' + statusCls + '">' + (product.isActive ? 'Active' : 'Inactive') + '</span>' +
        '</div>' +
        '<div class="prod-actions">' +
          '<a class="prod-action-btn prod-action-manage" href="' + product.href + '" data-nav="manage">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>' +
            ' Manage' +
          '</a>' +
          '<button class="prod-action-btn prod-action-delete" data-prod-delete="' + product.id + '">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>' +
            ' Hapus' +
          '</button>' +
        '</div>';

      gridCard.querySelector('[data-nav="manage"]').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.history.pushState({}, '', product.href);
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      gridCard.querySelector('[data-prod-delete]').addEventListener('click', function(e) {
        e.stopPropagation();
        if (product.deleteBtn) product.deleteBtn.click();
      });

      gridContainer.appendChild(gridCard);
    });

    cardEl.style.display = 'none';
    cardEl.parentElement.insertBefore(gridContainer, cardEl.nextSibling);
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function initProductsGrid() {
    injectProductGridStyles();
    var runTransform = function() { setTimeout(transformProductsPage, 500); };
    window.addEventListener('popstate', runTransform);
    var observer = new MutationObserver(function() {
      if (window.location.pathname === '/products') {
        var grid = document.querySelector('.prod-grid-container');
        if (!grid) transformProductsPage();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    runTransform();
  }

  var waitReady = function(cb, maxWait) {
    maxWait = maxWait || 10000;
    var start = Date.now();
    var check = function() {
      var main = document.querySelector('main');
      if (main && main.querySelector('div')) { cb(); return; }
      if (Date.now() - start < maxWait) requestAnimationFrame(check);
    };
    check();
  };

  waitReady(function() {
    try { initProductsGrid(); } catch(e) { console.warn('Products Grid failed:', e); }
    console.log('[Admin Panel] Products Grid feature loaded');
  });

})();


// ========================================
// FEATURE #12: Inject Notification Settings into Konfigurasi Toko
// Adds admin_telegram_chat_id and sales_channel_id fields
// ========================================
(function() {
  'use strict';

  var INJECTED_ATTR = 'data-notif-fields-injected';
  var SAVE_HOOKED_ATTR = 'data-notif-save-hooked';

  // Module-level storage for pending notification values
  var _pendingNotifSettings = {};
  var _notifDirty = false;
  var _saveDebounceTimer = null;
  var _saveStatusEl = null;

  function createSettingField(labelText, placeholder, settingKey, description) {
    var wrapper = document.createElement('div');
    wrapper.className = 'space-y-2';
    wrapper.setAttribute('data-setting-key', settingKey);

    var label = document.createElement('label');
    label.className = 'text-sm font-semibold';
    label.style.display = 'block';
    label.textContent = labelText;
    wrapper.appendChild(label);

    var input = document.createElement('input');
    input.className = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
    input.type = 'text';
    input.placeholder = placeholder;
    input.setAttribute('data-notif-field', 'true');
    wrapper.appendChild(input);

    if (description) {
      var desc = document.createElement('p');
      desc.className = 'text-xs text-muted-foreground';
      desc.textContent = description;
      wrapper.appendChild(desc);
    }

    // Load current value from API
    fetch('/api/settings', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('dn_admin_token') }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var settings = data.settings || data;
      if (settings[settingKey] && settings[settingKey].value) {
        input.value = settings[settingKey].value;
      }
    })
    .catch(function() {});

    // Store value on input change and auto-save with debounce
    input.addEventListener('input', function() {
      _pendingNotifSettings[settingKey] = input.value.trim();
      _notifDirty = true;
      // Debounced auto-save: save 1.5s after user stops typing
      if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);
      _saveDebounceTimer = setTimeout(function() {
        saveNotifSettings();
      }, 1500);
    });

    return wrapper;
  }

  // Save notification settings to API
  function saveNotifSettings() {
    if (!_notifDirty || Object.keys(_pendingNotifSettings).length === 0) return;
    var payload = {};
    for (var key in _pendingNotifSettings) {
      payload[key] = _pendingNotifSettings[key];
    }
    showSaveStatus('saving');
    fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('dn_admin_token')
      },
      body: JSON.stringify({ settings: payload })
    }).then(function(r) {
      if (r.ok) {
        _pendingNotifSettings = {};
        _notifDirty = false;
        showSaveStatus('saved');
      } else {
        showSaveStatus('error');
      }
    }).catch(function() {
      showSaveStatus('error');
    });
  }

  function showSaveStatus(status) {
    if (!_saveStatusEl) return;
    if (status === 'saving') {
      _saveStatusEl.textContent = '\u23F3 Menyimpan...';
      _saveStatusEl.style.color = 'hsl(var(--muted-foreground))';
      _saveStatusEl.style.display = 'block';
    } else if (status === 'saved') {
      _saveStatusEl.textContent = '\u2705 Tersimpan!';
      _saveStatusEl.style.color = 'hsl(142 71% 45%)';
      _saveStatusEl.style.display = 'block';
      setTimeout(function() { _saveStatusEl.style.display = 'none'; }, 3000);
    } else if (status === 'error') {
      _saveStatusEl.textContent = '\u274C Gagal menyimpan';
      _saveStatusEl.style.color = 'hsl(0 84% 60%)';
      _saveStatusEl.style.display = 'block';
    }
  }

  function findTextElement(root, text) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.trim() === text) {
        return walker.currentNode.parentElement;
      }
    }
    return null;
  }

  function findDialogContainer(startEl) {
    var el = startEl;
    for (var i = 0; i < 20 && el; i++) {
      if (el.getAttribute && (
        el.getAttribute('role') === 'dialog' ||
        el.getAttribute('data-state') === 'open' ||
        (el.style && el.style.position === 'fixed') ||
        (el.className && typeof el.className === 'string' && (
          el.className.indexOf('max-h-') > -1 ||
          el.className.indexOf('overflow') > -1
        ))
      )) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function injectNotifFields() {
    var observer = new MutationObserver(function() {
      if (window.location.pathname !== '/settings') return;
      if (document.querySelector('[' + INJECTED_ATTR + ']')) return;

      // Strategy: find "Waktu Kadaluarsa Pembayaran" label text as anchor
      var anchorEl = findTextElement(document.body, 'Waktu Kadaluarsa Pembayaran');
      if (!anchorEl) return;

      // Walk up to find the field wrapper (space-y-2 div)
      var fieldWrapper = anchorEl.closest('.space-y-2') || anchorEl.parentElement;
      if (!fieldWrapper) return;

      // The form container is the parent of the field wrappers (space-y-4)
      var formContainer = fieldWrapper.parentElement;
      if (!formContainer) return;

      // Verify we're in the right dialog by checking for "Konfigurasi Toko" text nearby
      var dialogContainer = findDialogContainer(formContainer) || formContainer.parentElement;
      if (!dialogContainer) return;
      var konfTitle = findTextElement(dialogContainer, 'Konfigurasi Toko');
      if (!konfTitle) return;

      // Mark as injected
      formContainer.setAttribute(INJECTED_ATTR, 'true');

      // Ensure dialog/scroll container is scrollable so all fields are visible
      var scrollParent = dialogContainer || formContainer.parentElement;
      if (scrollParent) {
        scrollParent.style.overflowY = 'auto';
        // Also check grandparent for fixed-height containers
        if (scrollParent.parentElement) {
          scrollParent.parentElement.style.overflowY = 'auto';
        }
      }

      // Find the "Tutup" button wrapper (the div with class pt-2)
      var tutupWrapper = null;
      var allBtns = formContainer.querySelectorAll('button');
      allBtns.forEach(function(b) {
        if (b.textContent.trim() === 'Tutup') {
          tutupWrapper = b.parentElement;
        }
      });

      // Create separator with section title
      var separator = document.createElement('div');
      separator.style.cssText = 'border-top:1px solid hsl(var(--border));padding-top:16px;margin-top:8px;';

      var sectionTitle = document.createElement('p');
      sectionTitle.className = 'text-sm font-semibold text-primary';
      sectionTitle.textContent = 'Notifikasi Telegram';
      sectionTitle.style.marginBottom = '12px';
      separator.appendChild(sectionTitle);

      var chatIdField = createSettingField(
        'Chat ID Admin',
        'Masukkan Chat ID admin Telegram',
        'admin_telegram_chat_id',
        'Chat ID Telegram admin untuk notifikasi order baru (gunakan @userinfobot untuk mengetahui ID Anda)'
      );

      var spacer = document.createElement('div');
      spacer.style.height = '12px';

      var channelField = createSettingField(
        'Channel Notifikasi Penjualan',
        '@namaChannel atau -100xxxxxxxxx',
        'sales_channel_id',
        'ID atau username channel Telegram untuk notifikasi setiap ada penjualan berhasil'
      );

      var spacer2 = document.createElement('div');
      spacer2.style.height = '12px';

      var broadcastChannelField = createSettingField(
        'Channel Broadcast',
        '@namaChannel atau -100xxxxxxxxx',
        'broadcast_channel_id',
        'ID atau username channel Telegram ke-2 khusus untuk broadcast pesan ke channel'
      );
      broadcastChannelField.style.display = 'block';
      broadcastChannelField.style.visibility = 'visible';
      broadcastChannelField.style.minHeight = '60px';
      console.log('[Admin Panel] Broadcast channel field created:', broadcastChannelField);

      // Test notification button
      var testBtnWrapper = document.createElement('div');
      testBtnWrapper.style.cssText = 'margin-top:12px;';

      var testBtn = document.createElement('button');
      testBtn.type = 'button';
      testBtn.className = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2';
      testBtn.innerHTML = '&#x1F514; Tes Notifikasi';
      testBtn.style.cssText = 'width:100%;cursor:pointer;';

      var testResultEl = document.createElement('div');
      testResultEl.className = 'text-xs';
      testResultEl.style.cssText = 'margin-top:8px;display:none;padding:8px;border-radius:6px;';

      testBtn.addEventListener('click', function() {
        testBtn.disabled = true;
        testBtn.innerHTML = '&#x23F3; Mengirim tes...';
        testResultEl.style.display = 'none';

        fetch('/api/settings/test-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('dn_admin_token')
          }
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          testBtn.disabled = false;
          testBtn.innerHTML = '&#x1F514; Tes Notifikasi';

          if (data.error) {
            testResultEl.style.display = 'block';
            testResultEl.style.background = 'hsl(0 84% 60% / 0.1)';
            testResultEl.style.color = 'hsl(0 84% 60%)';
            testResultEl.textContent = data.error;
            return;
          }

          var lines = [];
          var r = data.results || {};
          if (r.admin) {
            lines.push(r.admin.success
              ? '\u2705 Admin (' + r.admin.chatId + '): Terkirim'
              : '\u274C Admin: ' + (r.admin.error || 'Gagal'));
          }
          if (r.channel) {
            lines.push(r.channel.success
              ? '\u2705 Ch. Penjualan (' + r.channel.chatId + '): Terkirim'
              : '\u274C Ch. Penjualan: ' + (r.channel.error || 'Gagal'));
          }
          if (r.broadcastChannel) {
            lines.push(r.broadcastChannel.success
              ? '\u2705 Ch. Broadcast (' + r.broadcastChannel.chatId + '): Terkirim'
              : '\u274C Ch. Broadcast: ' + (r.broadcastChannel.error || 'Gagal'));
          }

          var allOk = (r.admin && r.admin.success) || (r.channel && r.channel.success) || (r.broadcastChannel && r.broadcastChannel.success);
          testResultEl.style.display = 'block';
          testResultEl.style.background = allOk ? 'hsl(142 71% 45% / 0.1)' : 'hsl(0 84% 60% / 0.1)';
          testResultEl.style.color = allOk ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)';
          testResultEl.innerHTML = lines.join('<br>');
        })
        .catch(function() {
          testBtn.disabled = false;
          testBtn.innerHTML = '&#x1F514; Tes Notifikasi';
          testResultEl.style.display = 'block';
          testResultEl.style.background = 'hsl(0 84% 60% / 0.1)';
          testResultEl.style.color = 'hsl(0 84% 60%)';
          testResultEl.textContent = 'Gagal menghubungi server';
        });
      });

      testBtnWrapper.appendChild(testBtn);
      testBtnWrapper.appendChild(testResultEl);

      // Save button for notification settings
      var saveBtnWrapper = document.createElement('div');
      saveBtnWrapper.style.cssText = 'margin-top:12px;';

      var saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 gap-2';
      saveBtn.innerHTML = '&#x1F4BE; Simpan Pengaturan Notifikasi';
      saveBtn.style.cssText = 'width:100%;cursor:pointer;';
      saveBtn.addEventListener('click', function() {
        // Collect all current field values before saving
        var allNotifInputs = separator.querySelectorAll('input[data-notif-field]');
        allNotifInputs.forEach(function(inp) {
          var wrapper = inp.closest('[data-setting-key]');
          if (wrapper) {
            var key = wrapper.getAttribute('data-setting-key');
            _pendingNotifSettings[key] = inp.value.trim();
            _notifDirty = true;
          }
        });
        saveNotifSettings();
      });

      var saveStatusEl = document.createElement('p');
      saveStatusEl.className = 'text-xs';
      saveStatusEl.style.cssText = 'margin-top:6px;text-align:center;display:none;';
      _saveStatusEl = saveStatusEl;

      saveBtnWrapper.appendChild(saveBtn);
      saveBtnWrapper.appendChild(saveStatusEl);

      // Force Join Channel toggle
      var forceJoinSpacer = document.createElement('div');
      forceJoinSpacer.style.height = '12px';

      var forceJoinWrapper = document.createElement('div');
      forceJoinWrapper.style.cssText = 'border-top:1px solid hsl(var(--border));padding-top:12px;margin-top:8px;';

      var forceJoinTitle = document.createElement('p');
      forceJoinTitle.className = 'text-sm font-semibold text-primary';
      forceJoinTitle.textContent = 'Wajib Join Channel';
      forceJoinTitle.style.marginBottom = '4px';
      forceJoinWrapper.appendChild(forceJoinTitle);

      var forceJoinDesc = document.createElement('p');
      forceJoinDesc.className = 'text-xs text-muted-foreground';
      forceJoinDesc.textContent = 'Jika aktif, user harus join channel di atas sebelum bisa menggunakan bot';
      forceJoinDesc.style.marginBottom = '8px';
      forceJoinWrapper.appendChild(forceJoinDesc);

      var forceJoinToggleRow = document.createElement('div');
      forceJoinToggleRow.style.cssText = 'display:flex;align-items:center;gap:10px;';

      var forceJoinCheckbox = document.createElement('input');
      forceJoinCheckbox.type = 'checkbox';
      forceJoinCheckbox.id = 'force_join_enabled';
      forceJoinCheckbox.style.cssText = 'width:18px;height:18px;cursor:pointer;accent-color:hsl(217 91% 60%);';

      var forceJoinLabel = document.createElement('label');
      forceJoinLabel.htmlFor = 'force_join_enabled';
      forceJoinLabel.className = 'text-sm';
      forceJoinLabel.textContent = 'Aktifkan Wajib Join Channel';
      forceJoinLabel.style.cursor = 'pointer';

      forceJoinToggleRow.appendChild(forceJoinCheckbox);
      forceJoinToggleRow.appendChild(forceJoinLabel);
      forceJoinWrapper.appendChild(forceJoinToggleRow);

      // Load force_join_enabled setting
      fetch('/api/settings', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('dn_admin_token') }
      }).then(function(r) { return r.json(); }).then(function(data) {
        var settings = data.settings || {};
        if (settings.force_join_enabled) {
          forceJoinCheckbox.checked = (settings.force_join_enabled.value === 'true');
        }
      }).catch(function() {});

      // Save on toggle change
      forceJoinCheckbox.addEventListener('change', function() {
        var val = forceJoinCheckbox.checked ? 'true' : 'false';
        fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('dn_admin_token')
          },
          body: JSON.stringify({ settings: { force_join_enabled: val } })
        }).then(function() {
          if (_saveStatusEl) {
            _saveStatusEl.style.display = 'block';
            _saveStatusEl.style.color = 'hsl(142 71% 45%)';
            _saveStatusEl.textContent = '\u2705 Pengaturan Wajib Join Channel tersimpan!';
            setTimeout(function() { _saveStatusEl.style.display = 'none'; }, 2000);
          }
        }).catch(function() {
          if (_saveStatusEl) {
            _saveStatusEl.style.display = 'block';
            _saveStatusEl.style.color = 'hsl(0 84% 60%)';
            _saveStatusEl.textContent = '\u274C Gagal menyimpan pengaturan';
            setTimeout(function() { _saveStatusEl.style.display = 'none'; }, 2000);
          }
        });
      });

      separator.appendChild(chatIdField);
      separator.appendChild(spacer);
      separator.appendChild(channelField);
      separator.appendChild(spacer2);
      separator.appendChild(broadcastChannelField);
      separator.appendChild(forceJoinSpacer);
      separator.appendChild(forceJoinWrapper);
      separator.appendChild(saveBtnWrapper);
      separator.appendChild(testBtnWrapper);

      // Insert before the Tutup button wrapper, or append to form container
      if (tutupWrapper && tutupWrapper.parentElement === formContainer) {
        formContainer.insertBefore(separator, tutupWrapper);
      } else {
        formContainer.appendChild(separator);
      }

      console.log('[Admin Panel] Notification fields injected into Konfigurasi Toko. Broadcast channel field present:', separator.contains(broadcastChannelField));
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  var waitReady = function(cb, maxWait) {
    maxWait = maxWait || 10000;
    var start = Date.now();
    var check = function() {
      var main = document.querySelector('main');
      if (main && main.querySelector('div')) { cb(); return; }
      if (Date.now() - start < maxWait) requestAnimationFrame(check);
    };
    check();
  };

  waitReady(function() {
    try { injectNotifFields(); } catch(e) { console.warn('Notif Fields injection failed:', e); }
    console.log('[Admin Panel] Notification Settings fields loaded');
  });

})();


// ========================================
// FEATURE #13: Inject Broadcast Target Toggles into Broadcast Page
// Adds 3 individual on/off toggles: Bot, Channel Sales, Channel Broadcast
// ========================================
(function() {
  'use strict';

  var INJECTED_ATTR = 'data-broadcast-mode-injected';
  var broadcastTargets = {
    send_to_bot: true,
    send_to_sales_channel: false,
    send_to_broadcast_channel: false
  };

  function createToggle(key, icon, label, desc) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border:1px solid hsl(var(--border));border-radius:10px;transition:all 0.2s;';

    var left = document.createElement('div');
    left.style.cssText = 'display:flex;align-items:center;gap:10px;flex:1;';
    left.innerHTML = '<span style="font-size:1.3rem;">' + icon + '</span>' +
      '<div><p class="text-sm font-semibold">' + label + '</p>' +
      '<p class="text-xs text-muted-foreground">' + desc + '</p></div>';

    var toggle = document.createElement('label');
    toggle.style.cssText = 'position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0;cursor:pointer;';

    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = broadcastTargets[key];
    checkbox.style.cssText = 'opacity:0;width:0;height:0;';

    var slider = document.createElement('span');
    slider.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;border-radius:24px;transition:0.3s;' +
      (checkbox.checked ? 'background:hsl(217 91% 60%);' : 'background:hsl(var(--border));');

    var knob = document.createElement('span');
    knob.style.cssText = 'position:absolute;height:18px;width:18px;left:3px;bottom:3px;border-radius:50%;background:white;transition:0.3s;' +
      (checkbox.checked ? 'transform:translateX(20px);' : '');

    slider.appendChild(knob);
    toggle.appendChild(checkbox);
    toggle.appendChild(slider);

    function updateVisual() {
      if (checkbox.checked) {
        slider.style.background = 'hsl(217 91% 60%)';
        knob.style.transform = 'translateX(20px)';
        row.style.borderColor = 'hsl(217 91% 60%)';
        row.style.background = 'hsl(217 91% 60% / 0.05)';
      } else {
        slider.style.background = 'hsl(var(--border))';
        knob.style.transform = 'translateX(0)';
        row.style.borderColor = 'hsl(var(--border))';
        row.style.background = 'transparent';
      }
    }

    checkbox.addEventListener('change', function() {
      broadcastTargets[key] = checkbox.checked;
      updateVisual();
    });

    updateVisual();
    row.appendChild(left);
    row.appendChild(toggle);
    return row;
  }

  function createTargetToggles() {
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-top:16px;display:flex;flex-direction:column;gap:8px;';
    wrapper.setAttribute(INJECTED_ATTR, 'true');

    var sectionTitle = document.createElement('div');
    sectionTitle.style.cssText = 'margin-bottom:4px;';
    sectionTitle.innerHTML = '<p class="text-sm font-semibold text-foreground" style="margin-bottom:4px;">Tujuan Broadcast</p><p class="text-xs text-muted-foreground">Aktifkan/nonaktifkan tujuan pengiriman broadcast</p>';
    wrapper.appendChild(sectionTitle);

    wrapper.appendChild(createToggle('send_to_bot', '\uD83E\uDD16', 'Bot (Pengguna)', 'Kirim ke semua pengguna bot'));
    wrapper.appendChild(createToggle('send_to_sales_channel', '\uD83D\uDCB0', 'Channel Sales', 'Kirim ke channel penjualan'));
    wrapper.appendChild(createToggle('send_to_broadcast_channel', '\uD83D\uDCE2', 'Channel Broadcast', 'Kirim ke channel broadcast'));

    return wrapper;
  }

  function interceptBroadcastFetch() {
    var origFetch = window.fetch;
    window.fetch = function() {
      var args = Array.prototype.slice.call(arguments);
      var url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
      var opts = args[1] || {};

      if (url.indexOf('/broadcast') > -1 && opts.method && opts.method.toUpperCase() === 'POST') {
        if (opts.body instanceof FormData) {
          opts.body.append('send_to_bot', broadcastTargets.send_to_bot ? 'true' : 'false');
          opts.body.append('send_to_sales_channel', broadcastTargets.send_to_sales_channel ? 'true' : 'false');
          opts.body.append('send_to_broadcast_channel', broadcastTargets.send_to_broadcast_channel ? 'true' : 'false');
        } else if (typeof opts.body === 'string') {
          try {
            var parsed = JSON.parse(opts.body);
            parsed.send_to_bot = broadcastTargets.send_to_bot ? 'true' : 'false';
            parsed.send_to_sales_channel = broadcastTargets.send_to_sales_channel ? 'true' : 'false';
            parsed.send_to_broadcast_channel = broadcastTargets.send_to_broadcast_channel ? 'true' : 'false';
            opts.body = JSON.stringify(parsed);
          } catch(e) {}
        }
        args[1] = opts;
      }
      return origFetch.apply(this, args);
    };
  }

  function injectBroadcastMode() {
    var observer = new MutationObserver(function() {
      if (window.location.pathname !== '/broadcast') return;
      if (document.querySelector('[' + INJECTED_ATTR + ']')) return;

      // Find the target type selector grid (Semua Pengguna / Pembeli)
      var grids = document.querySelectorAll('.grid.gap-4');
      var targetGrid = null;
      for (var i = 0; i < grids.length; i++) {
        var texts = grids[i].textContent || '';
        if (texts.indexOf('Semua Pengguna') > -1 && texts.indexOf('Pembeli') > -1) {
          targetGrid = grids[i];
          break;
        }
      }
      if (!targetGrid) return;

      var toggles = createTargetToggles();
      targetGrid.parentElement.insertBefore(toggles, targetGrid.nextSibling);

      console.log('[Admin Panel] Broadcast target toggles injected');
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  var waitReady = function(cb, maxWait) {
    maxWait = maxWait || 10000;
    var start = Date.now();
    var check = function() {
      var main = document.querySelector('main');
      if (main && main.querySelector('div')) { cb(); return; }
      if (Date.now() - start < maxWait) requestAnimationFrame(check);
    };
    check();
  };

  waitReady(function() {
    try {
      interceptBroadcastFetch();
      injectBroadcastMode();
    } catch(e) { console.warn('Broadcast Mode injection failed:', e); }
    console.log('[Admin Panel] Broadcast Mode feature loaded');
  });

})();


// ========================================
// FEATURE #14: Tools Page (Password Filler + Duplicate Remover)
// Adds Tools nav item to sidebar + full tools page
// ========================================
(function() {
  'use strict';

  var TOOLS_INJECTED = 'data-tools-injected';
  var TOOLS_NAV_INJECTED = 'data-tools-nav-injected';

  // SVG icons
  var toolsIcon = '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>';
  var copyIcon = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>';
  var trashIcon = '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>';

  // Saved password presets (stored in localStorage)
  function getPresets() {
    try { return JSON.parse(localStorage.getItem('tools_pw_presets') || '[]'); } catch(e) { return []; }
  }
  function savePresets(list) {
    localStorage.setItem('tools_pw_presets', JSON.stringify(list));
  }

  function createToolsPage() {
    var container = document.createElement('div');
    container.setAttribute(TOOLS_INJECTED, 'true');
    container.style.cssText = 'padding:24px;max-width:900px;margin:0 auto;';

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'margin-bottom:24px;';
    header.innerHTML = '<h1 class="text-2xl font-bold" style="margin-bottom:4px;">\uD83D\uDEE0\uFE0F Tools</h1>' +
      '<p class="text-sm text-muted-foreground">Utilitas untuk memproses data stok dan teks</p>';
    container.appendChild(header);

    // Tool selector tabs
    var tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;gap:8px;margin-bottom:20px;';

    var tools = [
      { id: 'password-filler', label: '\uD83D\uDD10 Password Filler' },
      { id: 'duplicate-remover', label: '\uD83D\uDCCB Duplicate Remover' }
    ];

    var panels = {};
    var activeTab = 'password-filler';

    tools.forEach(function(tool) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = tool.label;
      btn.setAttribute('data-tool-tab', tool.id);
      btn.style.cssText = 'padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;border:1px solid hsl(var(--border));transition:all 0.2s;';

      btn.addEventListener('click', function() {
        activeTab = tool.id;
        updateTabs();
      });

      tabBar.appendChild(btn);
    });
    container.appendChild(tabBar);

    function updateTabs() {
      var btns = tabBar.querySelectorAll('[data-tool-tab]');
      btns.forEach(function(b) {
        var isActive = b.getAttribute('data-tool-tab') === activeTab;
        b.style.background = isActive ? 'hsl(217 91% 60%)' : 'transparent';
        b.style.color = isActive ? '#fff' : 'inherit';
        b.style.borderColor = isActive ? 'hsl(217 91% 60%)' : 'hsl(var(--border))';
      });
      Object.keys(panels).forEach(function(k) {
        panels[k].style.display = k === activeTab ? 'block' : 'none';
      });
    }

    // =====================
    // TOOL 1: Password Filler
    // =====================
    var pwPanel = document.createElement('div');
    panels['password-filler'] = pwPanel;

    var pwDesc = document.createElement('p');
    pwDesc.className = 'text-sm text-muted-foreground';
    pwDesc.textContent = 'Paste daftar email/username per baris, lalu pilih atau ketik password. Output: setiap baris ditambahkan " | password" di belakangnya.';
    pwDesc.style.marginBottom = '16px';
    pwPanel.appendChild(pwDesc);

    // Input textarea
    var pwInputLabel = document.createElement('label');
    pwInputLabel.className = 'text-sm font-semibold';
    pwInputLabel.textContent = 'Input (satu per baris)';
    pwInputLabel.style.display = 'block';
    pwInputLabel.style.marginBottom = '6px';
    pwPanel.appendChild(pwInputLabel);

    var pwInput = document.createElement('textarea');
    pwInput.placeholder = 'contoh@gmail.com\ncontoh2@gmail.com\ncontoh3@gmail.com';
    pwInput.style.cssText = 'width:100%;min-height:150px;padding:12px;border-radius:8px;border:1px solid hsl(var(--border));background:hsl(var(--background));color:inherit;font-family:monospace;font-size:13px;resize:vertical;';
    pwPanel.appendChild(pwInput);

    // Password section
    var pwSection = document.createElement('div');
    pwSection.style.cssText = 'margin-top:16px;display:flex;flex-direction:column;gap:8px;';

    var pwLabel = document.createElement('label');
    pwLabel.className = 'text-sm font-semibold';
    pwLabel.textContent = 'Password';
    pwSection.appendChild(pwLabel);

    // Manual password input
    var pwRow = document.createElement('div');
    pwRow.style.cssText = 'display:flex;gap:8px;align-items:center;';

    var pwManualInput = document.createElement('input');
    pwManualInput.type = 'text';
    pwManualInput.placeholder = 'Ketik password atau pilih preset di bawah';
    pwManualInput.style.cssText = 'flex:1;padding:8px 12px;border-radius:8px;border:1px solid hsl(var(--border));background:hsl(var(--background));color:inherit;font-family:monospace;font-size:13px;';
    pwRow.appendChild(pwManualInput);
    pwSection.appendChild(pwRow);

    // Preset management
    var presetSection = document.createElement('div');
    presetSection.style.cssText = 'margin-top:8px;';

    var presetLabel = document.createElement('div');
    presetLabel.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;';
    presetLabel.innerHTML = '<span class="text-xs font-semibold text-muted-foreground">Preset Password</span>';

    // Add preset button
    var addPresetBtn = document.createElement('button');
    addPresetBtn.type = 'button';
    addPresetBtn.textContent = '+ Tambah Preset';
    addPresetBtn.style.cssText = 'font-size:12px;padding:2px 8px;border-radius:6px;border:1px solid hsl(var(--border));background:transparent;color:hsl(217 91% 60%);cursor:pointer;';
    addPresetBtn.addEventListener('click', function() {
      var pw = pwManualInput.value.trim();
      if (!pw) { alert('Ketik password dulu di field di atas'); return; }
      var presets = getPresets();
      if (presets.indexOf(pw) === -1) {
        presets.push(pw);
        savePresets(presets);
        renderPresets();
      }
    });
    presetLabel.appendChild(addPresetBtn);
    presetSection.appendChild(presetLabel);

    var presetList = document.createElement('div');
    presetList.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
    presetSection.appendChild(presetList);

    function renderPresets() {
      presetList.innerHTML = '';
      var presets = getPresets();
      if (presets.length === 0) {
        var empty = document.createElement('span');
        empty.className = 'text-xs text-muted-foreground';
        empty.textContent = 'Belum ada preset. Ketik password lalu klik "+ Tambah Preset"';
        presetList.appendChild(empty);
        return;
      }
      presets.forEach(function(pw, idx) {
        var chip = document.createElement('div');
        chip.style.cssText = 'display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;border:1px solid hsl(var(--border));background:hsl(var(--background));cursor:pointer;font-size:12px;font-family:monospace;transition:all 0.2s;';

        var chipText = document.createElement('span');
        chipText.textContent = pw;
        chip.appendChild(chipText);

        var chipDel = document.createElement('span');
        chipDel.textContent = '\u00D7';
        chipDel.style.cssText = 'color:hsl(0 84% 60%);cursor:pointer;font-size:14px;font-weight:bold;margin-left:4px;';
        chipDel.title = 'Hapus preset';
        chipDel.addEventListener('click', function(e) {
          e.stopPropagation();
          var presets = getPresets();
          presets.splice(idx, 1);
          savePresets(presets);
          renderPresets();
        });
        chip.appendChild(chipDel);

        chip.addEventListener('click', function() {
          pwManualInput.value = pw;
        });
        chip.addEventListener('mouseenter', function() {
          chip.style.borderColor = 'hsl(217 91% 60%)';
          chip.style.background = 'hsl(217 91% 60% / 0.1)';
        });
        chip.addEventListener('mouseleave', function() {
          chip.style.borderColor = 'hsl(var(--border))';
          chip.style.background = 'hsl(var(--background))';
        });

        presetList.appendChild(chip);
      });
    }
    renderPresets();
    pwSection.appendChild(presetSection);
    pwPanel.appendChild(pwSection);

    // Generate button
    var pwGenBtn = document.createElement('button');
    pwGenBtn.type = 'button';
    pwGenBtn.innerHTML = '\uD83D\uDD10 Generate';
    pwGenBtn.style.cssText = 'margin-top:16px;padding:10px 24px;border-radius:8px;border:none;background:hsl(217 91% 60%);color:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;';
    pwGenBtn.addEventListener('mouseenter', function() { pwGenBtn.style.background = 'hsl(217 91% 50%)'; });
    pwGenBtn.addEventListener('mouseleave', function() { pwGenBtn.style.background = 'hsl(217 91% 60%)'; });
    pwPanel.appendChild(pwGenBtn);

    // Output
    var pwOutputLabel = document.createElement('label');
    pwOutputLabel.className = 'text-sm font-semibold';
    pwOutputLabel.textContent = 'Output';
    pwOutputLabel.style.cssText = 'display:block;margin-top:16px;margin-bottom:6px;';
    pwPanel.appendChild(pwOutputLabel);

    var pwOutput = document.createElement('textarea');
    pwOutput.readOnly = true;
    pwOutput.placeholder = 'Hasil akan muncul di sini...';
    pwOutput.style.cssText = 'width:100%;min-height:150px;padding:12px;border-radius:8px;border:1px solid hsl(var(--border));background:hsl(222 47% 8%);color:hsl(142 71% 45%);font-family:monospace;font-size:13px;resize:vertical;';
    pwPanel.appendChild(pwOutput);

    // Copy button
    var pwCopyBtn = document.createElement('button');
    pwCopyBtn.type = 'button';
    pwCopyBtn.innerHTML = '\uD83D\uDCCB Copy';
    pwCopyBtn.style.cssText = 'margin-top:8px;padding:6px 16px;border-radius:6px;border:1px solid hsl(var(--border));background:transparent;color:inherit;font-size:13px;cursor:pointer;transition:all 0.2s;';
    pwPanel.appendChild(pwCopyBtn);

    var pwCountInfo = document.createElement('span');
    pwCountInfo.className = 'text-xs text-muted-foreground';
    pwCountInfo.style.cssText = 'margin-left:10px;';
    pwPanel.appendChild(pwCountInfo);

    // Generate logic
    pwGenBtn.addEventListener('click', function() {
      var password = pwManualInput.value.trim();
      if (!password) { alert('Masukkan password terlebih dahulu'); return; }
      var lines = pwInput.value.split('\n').filter(function(l) { return l.trim() !== ''; });
      if (lines.length === 0) { alert('Masukkan daftar email/username terlebih dahulu'); return; }
      var result = lines.map(function(line) {
        return line.trim() + ' | ' + password;
      });
      pwOutput.value = result.join('\n');
      pwCountInfo.textContent = result.length + ' baris diproses';
    });

    // Copy logic
    pwCopyBtn.addEventListener('click', function() {
      if (!pwOutput.value) return;
      navigator.clipboard.writeText(pwOutput.value).then(function() {
        pwCopyBtn.innerHTML = '\u2705 Copied!';
        setTimeout(function() { pwCopyBtn.innerHTML = '\uD83D\uDCCB Copy'; }, 1500);
      });
    });

    container.appendChild(pwPanel);

    // =====================
    // TOOL 2: Duplicate Remover
    // =====================
    var drPanel = document.createElement('div');
    drPanel.style.display = 'none';
    panels['duplicate-remover'] = drPanel;

    var drDesc = document.createElement('p');
    drDesc.className = 'text-sm text-muted-foreground';
    drDesc.textContent = 'Paste daftar teks per baris. Baris duplikat akan dihapus, hanya menyisakan yang unik.';
    drDesc.style.marginBottom = '16px';
    drPanel.appendChild(drDesc);

    // Input
    var drInputLabel = document.createElement('label');
    drInputLabel.className = 'text-sm font-semibold';
    drInputLabel.textContent = 'Input (satu per baris)';
    drInputLabel.style.cssText = 'display:block;margin-bottom:6px;';
    drPanel.appendChild(drInputLabel);

    var drInput = document.createElement('textarea');
    drInput.placeholder = 'contoh@gmail.com\ncontoh2@gmail.com\ncontoh@gmail.com\ncontoh3@gmail.com';
    drInput.style.cssText = 'width:100%;min-height:150px;padding:12px;border-radius:8px;border:1px solid hsl(var(--border));background:hsl(var(--background));color:inherit;font-family:monospace;font-size:13px;resize:vertical;';
    drPanel.appendChild(drInput);

    // Options
    var drOptRow = document.createElement('div');
    drOptRow.style.cssText = 'margin-top:12px;display:flex;align-items:center;gap:12px;';

    var drCaseCb = document.createElement('input');
    drCaseCb.type = 'checkbox';
    drCaseCb.id = 'dr-case-sensitive';
    drCaseCb.style.cssText = 'width:16px;height:16px;cursor:pointer;';

    var drCaseLabel = document.createElement('label');
    drCaseLabel.htmlFor = 'dr-case-sensitive';
    drCaseLabel.className = 'text-sm';
    drCaseLabel.textContent = 'Case-sensitive (huruf besar/kecil berbeda)';
    drCaseLabel.style.cursor = 'pointer';

    drOptRow.appendChild(drCaseCb);
    drOptRow.appendChild(drCaseLabel);
    drPanel.appendChild(drOptRow);

    // Process button
    var drGenBtn = document.createElement('button');
    drGenBtn.type = 'button';
    drGenBtn.innerHTML = '\uD83D\uDCCB Hapus Duplikat';
    drGenBtn.style.cssText = 'margin-top:16px;padding:10px 24px;border-radius:8px;border:none;background:hsl(217 91% 60%);color:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;';
    drGenBtn.addEventListener('mouseenter', function() { drGenBtn.style.background = 'hsl(217 91% 50%)'; });
    drGenBtn.addEventListener('mouseleave', function() { drGenBtn.style.background = 'hsl(217 91% 60%)'; });
    drPanel.appendChild(drGenBtn);

    // Output
    var drOutputLabel = document.createElement('label');
    drOutputLabel.className = 'text-sm font-semibold';
    drOutputLabel.textContent = 'Output';
    drOutputLabel.style.cssText = 'display:block;margin-top:16px;margin-bottom:6px;';
    drPanel.appendChild(drOutputLabel);

    var drOutput = document.createElement('textarea');
    drOutput.readOnly = true;
    drOutput.placeholder = 'Hasil akan muncul di sini...';
    drOutput.style.cssText = 'width:100%;min-height:150px;padding:12px;border-radius:8px;border:1px solid hsl(var(--border));background:hsl(222 47% 8%);color:hsl(142 71% 45%);font-family:monospace;font-size:13px;resize:vertical;';
    drPanel.appendChild(drOutput);

    // Copy + stats
    var drCopyBtn = document.createElement('button');
    drCopyBtn.type = 'button';
    drCopyBtn.innerHTML = '\uD83D\uDCCB Copy';
    drCopyBtn.style.cssText = 'margin-top:8px;padding:6px 16px;border-radius:6px;border:1px solid hsl(var(--border));background:transparent;color:inherit;font-size:13px;cursor:pointer;transition:all 0.2s;';
    drPanel.appendChild(drCopyBtn);

    var drCountInfo = document.createElement('span');
    drCountInfo.className = 'text-xs text-muted-foreground';
    drCountInfo.style.cssText = 'margin-left:10px;';
    drPanel.appendChild(drCountInfo);

    // Process logic
    drGenBtn.addEventListener('click', function() {
      var lines = drInput.value.split('\n').filter(function(l) { return l.trim() !== ''; });
      if (lines.length === 0) { alert('Masukkan teks terlebih dahulu'); return; }
      var caseSensitive = drCaseCb.checked;
      var seen = {};
      var unique = [];
      var dupeCount = 0;
      lines.forEach(function(line) {
        var trimmed = line.trim();
        var key = caseSensitive ? trimmed : trimmed.toLowerCase();
        if (!seen[key]) {
          seen[key] = true;
          unique.push(trimmed);
        } else {
          dupeCount++;
        }
      });
      drOutput.value = unique.join('\n');
      drCountInfo.textContent = lines.length + ' baris input \u2192 ' + unique.length + ' unik, ' + dupeCount + ' duplikat dihapus';
    });

    // Copy logic
    drCopyBtn.addEventListener('click', function() {
      if (!drOutput.value) return;
      navigator.clipboard.writeText(drOutput.value).then(function() {
        drCopyBtn.innerHTML = '\u2705 Copied!';
        setTimeout(function() { drCopyBtn.innerHTML = '\uD83D\uDCCB Copy'; }, 1500);
      });
    });

    container.appendChild(drPanel);

    updateTabs();
    return container;
  }

  // Inject Tools nav item in sidebar
  function injectToolsNav() {
    var observer = new MutationObserver(function() {
      var sidebar = document.querySelector('aside');
      if (!sidebar || sidebar.querySelector('[' + TOOLS_NAV_INJECTED + ']')) return;

      var nav = sidebar.querySelector('nav');
      if (!nav) return;

      // Find the last nav link (Settings)
      var links = nav.querySelectorAll('a');
      var settingsLink = null;
      for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute('href') === '/settings' || (links[i].textContent && links[i].textContent.indexOf('Settings') > -1)) {
          settingsLink = links[i];
          break;
        }
      }

      // Create Tools nav item by cloning the style of existing links
      var toolsLink = document.createElement('a');
      toolsLink.href = '/tools';
      toolsLink.setAttribute(TOOLS_NAV_INJECTED, 'true');
      if (settingsLink) {
        toolsLink.className = settingsLink.className;
      }
      toolsLink.style.cssText = 'display:flex;align-items:center;gap:8px;text-decoration:none;';

      // Create wrench icon
      var iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('width', '18');
      iconSvg.setAttribute('height', '18');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.setAttribute('fill', 'none');
      iconSvg.setAttribute('stroke', 'currentColor');
      iconSvg.setAttribute('stroke-width', '2');
      iconSvg.setAttribute('stroke-linecap', 'round');
      iconSvg.setAttribute('stroke-linejoin', 'round');
      iconSvg.innerHTML = toolsIcon;

      var labelSpan = document.createElement('span');
      labelSpan.textContent = 'Tools';

      toolsLink.appendChild(iconSvg);
      toolsLink.appendChild(labelSpan);

      toolsLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.history.pushState({}, '', '/tools');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      // Insert after Settings link
      if (settingsLink && settingsLink.parentElement) {
        settingsLink.parentElement.insertBefore(toolsLink, settingsLink.nextSibling);
      } else {
        nav.appendChild(toolsLink);
      }

      // Highlight active state
      function updateActive() {
        var isActive = window.location.pathname === '/tools';
        if (settingsLink) {
          // Copy active/inactive class pattern from existing links
          var refLink = isActive ? null : settingsLink;
          if (isActive) {
            toolsLink.style.background = 'hsl(217 91% 60% / 0.1)';
            toolsLink.style.color = 'hsl(217 91% 60%)';
          } else {
            toolsLink.style.background = '';
            toolsLink.style.color = '';
          }
        }
      }
      updateActive();
      window.addEventListener('popstate', updateActive);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function hideMainChildren(main) {
    for (var i = 0; i < main.children.length; i++) {
      var child = main.children[i];
      if (!child.hasAttribute(TOOLS_INJECTED)) {
        child.setAttribute('data-tools-hidden', 'true');
        child.style.display = 'none';
      }
    }
  }

  function showMainChildren(main) {
    var hidden = main.querySelectorAll('[data-tools-hidden]');
    for (var i = 0; i < hidden.length; i++) {
      hidden[i].removeAttribute('data-tools-hidden');
      hidden[i].style.display = '';
    }
  }

  // Inject Tools page content
  function injectToolsPage() {
    var observer = new MutationObserver(function() {
      if (window.location.pathname !== '/tools') {
        // Remove tools page if navigated away
        var existing = document.querySelector('[' + TOOLS_INJECTED + ']');
        if (existing) {
          var main = existing.parentElement;
          existing.remove();
          if (main) showMainChildren(main);
        }
        return;
      }

      // Find main content area
      var main = document.querySelector('main');
      if (!main) return;

      // Hide all existing children (including 404 page)
      hideMainChildren(main);

      if (document.querySelector('[' + TOOLS_INJECTED + ']')) return;

      var toolsPage = createToolsPage();
      main.appendChild(toolsPage);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Also listen for navigation
    window.addEventListener('popstate', function() {
      setTimeout(function() {
        if (window.location.pathname !== '/tools') {
          var existing = document.querySelector('[' + TOOLS_INJECTED + ']');
          if (existing) {
            var main = existing.parentElement;
            existing.remove();
            if (main) showMainChildren(main);
          }
        }
      }, 50);
    });
  }

  var waitReady = function(cb, maxWait) {
    maxWait = maxWait || 10000;
    var start = Date.now();
    var check = function() {
      var main = document.querySelector('main');
      if (main && main.querySelector('div')) { cb(); return; }
      if (Date.now() - start < maxWait) requestAnimationFrame(check);
    };
    check();
  };

  waitReady(function() {
    try {
      injectToolsNav();
      injectToolsPage();
    } catch(e) { console.warn('Tools injection failed:', e); }
    console.log('[Admin Panel] Tools feature loaded');
  });

})();


// ========================================
// FEATURE #15: Admin Management in Settings
// ========================================
(function() {
  'use strict';
  var ADMIN_INJECTED = 'data-admin-mgmt-injected';
  var _token = function() { return localStorage.getItem('dn_admin_token'); };

  function createAdminSection() {
    var section = document.createElement('div');
    section.setAttribute(ADMIN_INJECTED, 'true');
    section.style.cssText = 'border-top:1px solid hsl(var(--border));padding-top:16px;margin-top:16px;max-height:420px;overflow-y:auto;';

    var title = document.createElement('p');
    title.className = 'text-sm font-semibold text-primary';
    title.textContent = 'Kelola Admin';
    title.style.marginBottom = '12px';
    section.appendChild(title);

    var listContainer = document.createElement('div');
    listContainer.id = 'admin-list-container';
    listContainer.style.cssText = 'margin-bottom:12px;';
    section.appendChild(listContainer);

    var addForm = document.createElement('div');
    addForm.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid hsl(var(--border));border-radius:8px;margin-top:8px;';

    var addTitle = document.createElement('p');
    addTitle.className = 'text-xs font-semibold';
    addTitle.textContent = 'Tambah Admin Baru';
    addForm.appendChild(addTitle);

    var inputClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

    var nameInput = document.createElement('input');
    nameInput.className = inputClass;
    nameInput.placeholder = 'Nama';
    addForm.appendChild(nameInput);

    var userInput = document.createElement('input');
    userInput.className = inputClass;
    userInput.placeholder = 'Username';
    addForm.appendChild(userInput);

    var passInput = document.createElement('input');
    passInput.className = inputClass;
    passInput.type = 'password';
    passInput.placeholder = 'Password';
    addForm.appendChild(passInput);

    var addBtn = document.createElement('button');
    addBtn.className = 'inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2';
    addBtn.textContent = 'Tambah Admin';
    addBtn.style.cursor = 'pointer';
    addBtn.addEventListener('click', function() {
      var name = nameInput.value.trim();
      var username = userInput.value.trim();
      var password = passInput.value;
      if (!name || !username || !password) { alert('Semua field wajib diisi'); return; }
      addBtn.disabled = true;
      addBtn.textContent = 'Menyimpan...';
      fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _token() },
        body: JSON.stringify({ username: username, password: password, name: name })
      }).then(function(r) { return r.json(); }).then(function(data) {
        addBtn.disabled = false;
        addBtn.textContent = 'Tambah Admin';
        if (data.error) { alert(data.error); return; }
        nameInput.value = '';
        userInput.value = '';
        passInput.value = '';
        loadAdmins(listContainer);
      }).catch(function() {
        addBtn.disabled = false;
        addBtn.textContent = 'Tambah Admin';
        alert('Gagal menambah admin');
      });
    });
    addForm.appendChild(addBtn);
    section.appendChild(addForm);

    loadAdmins(listContainer);
    return section;
  }

  function loadAdmins(container) {
    fetch('/api/admins', {
      headers: { 'Authorization': 'Bearer ' + _token() }
    }).then(function(r) { return r.json(); }).then(function(admins) {
      container.innerHTML = '';
      if (!Array.isArray(admins) || admins.length === 0) {
        container.innerHTML = '<p class="text-xs text-muted-foreground">Belum ada admin</p>';
        return;
      }
      admins.forEach(function(admin) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border:1px solid hsl(var(--border));border-radius:6px;margin-bottom:6px;';

        var info = document.createElement('div');
        info.innerHTML = '<span class="text-sm font-semibold">' + admin.name + '</span><br><span class="text-xs text-muted-foreground">@' + admin.username + '</span>';
        row.appendChild(info);

        var actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:6px;';

        var delBtn = document.createElement('button');
        delBtn.className = 'text-xs';
        delBtn.textContent = 'Hapus';
        delBtn.style.cssText = 'color:hsl(0 84% 60%);cursor:pointer;padding:4px 8px;border:1px solid hsl(0 84% 60% / 0.3);border-radius:4px;background:transparent;';
        delBtn.addEventListener('click', function() {
          if (!confirm('Hapus admin ' + admin.name + '?')) return;
          fetch('/api/admins/' + admin.id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + _token() }
          }).then(function(r) { return r.json(); }).then(function(data) {
            if (data.error) { alert(data.error); return; }
            loadAdmins(container);
          }).catch(function() { alert('Gagal menghapus admin'); });
        });
        actions.appendChild(delBtn);
        row.appendChild(actions);
        container.appendChild(row);
      });
    }).catch(function() {
      container.innerHTML = '<p class="text-xs text-muted-foreground">Gagal memuat daftar admin</p>';
    });
  }

  function injectAdminManagement() {
    var observer = new MutationObserver(function() {
      if (window.location.pathname !== '/settings') return;
      if (document.querySelector('[' + ADMIN_INJECTED + ']')) return;

      var anchorEl = null;
      document.querySelectorAll('p, span, label').forEach(function(el) {
        if (el.textContent.trim() === 'Notifikasi Telegram') anchorEl = el;
      });
      if (!anchorEl) return;
      var formContainer = anchorEl.closest('div[style*="border-top"]');
      if (!formContainer) formContainer = anchorEl.parentElement;
      var parentContainer = formContainer ? formContainer.parentElement : null;
      if (!parentContainer) return;

      var adminSection = createAdminSection();
      parentContainer.appendChild(adminSection);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  var waitReady = function(cb, maxWait) {
    maxWait = maxWait || 10000;
    var start = Date.now();
    var check = function() {
      var main = document.querySelector('main');
      if (main && main.querySelector('div')) { cb(); return; }
      if (Date.now() - start < maxWait) requestAnimationFrame(check);
    };
    check();
  };

  waitReady(function() {
    try { injectAdminManagement(); } catch(e) { console.warn('Admin mgmt injection failed:', e); }
    console.log('[Admin Panel] Admin Management loaded');
  });
})();


// ========================================
// FEATURE #16: QRIS Fee Bearer Toggle — REMOVED
// Potongan QRIS dihapus, tidak ada fee untuk penjual maupun pembeli.
// ========================================


// ========================================
// FEATURE #17: Admin Filter in Rekap Keuangan
// ========================================
(function() {
  'use strict';
  var FILTER_INJECTED = 'data-admin-filter-injected';
  var _token = function() { return localStorage.getItem('dn_admin_token'); };

  // Global state for selected admin filter and settled filter
  var selectedAdmin = '';
  window.__settledFilter = 'all';

  // Intercept fetch to inject admin + settled params into finance/report requests
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string' && input.indexOf('/finance/report') !== -1) {
      if (selectedAdmin) {
        var sep = input.indexOf('?') !== -1 ? '&' : '?';
        input = input + sep + 'admin=' + encodeURIComponent(selectedAdmin);
      }
      if (window.__settledFilter && window.__settledFilter !== 'all') {
        var sep2 = input.indexOf('?') !== -1 ? '&' : '?';
        input = input + sep2 + 'settled=' + encodeURIComponent(window.__settledFilter);
      }
    }
    return origFetch.call(this, input, init);
  };

  function clickRefreshButton() {
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent.indexOf('Refresh') !== -1) {
        buttons[i].click();
        return;
      }
    }
  }

  function tryInjectFilter() {
    if (window.location.pathname !== '/finance') return false;
    if (document.querySelector('[' + FILTER_INJECTED + ']')) return true;

    var financeTitle = null;
    document.querySelectorAll('h1, h2').forEach(function(h) {
      if (h.textContent.trim() === 'Rekap Keuangan') financeTitle = h;
    });
    if (!financeTitle) return false;

    var headerRow = financeTitle.closest('[class*="between"]');
    if (!headerRow) {
      var p = financeTitle.parentElement;
      headerRow = p ? p.parentElement : null;
    }
    if (!headerRow) return false;

    var filterWrapper = document.createElement('div');
    filterWrapper.setAttribute(FILTER_INJECTED, 'true');
    filterWrapper.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:12px;width:100%;';

    var filterLabel = document.createElement('span');
    filterLabel.className = 'text-sm text-muted-foreground';
    filterLabel.textContent = 'Filter Admin:';
    filterWrapper.appendChild(filterLabel);

    var select = document.createElement('select');
    select.className = 'flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm';
    select.style.cssText = 'min-width:150px;cursor:pointer;';

    var optAll = document.createElement('option');
    optAll.value = '';
    optAll.textContent = 'Semua Admin';
    select.appendChild(optAll);

    fetch('/api/admins', {
      headers: { 'Authorization': 'Bearer ' + _token() }
    }).then(function(r) { return r.json(); }).then(function(admins) {
      if (!Array.isArray(admins)) return;
      admins.forEach(function(admin) {
        var opt = document.createElement('option');
        opt.value = admin.username;
        opt.textContent = admin.name + ' (@' + admin.username + ')';
        select.appendChild(opt);
      });
    }).catch(function() {});

    select.addEventListener('change', function() {
      selectedAdmin = select.value;
      // Trigger React's own Refresh button so it refetches with the intercepted admin param
      clickRefreshButton();
    });

    filterWrapper.appendChild(select);
    if (headerRow.nextSibling) {
      headerRow.parentElement.insertBefore(filterWrapper, headerRow.nextSibling);
    } else {
      headerRow.parentElement.appendChild(filterWrapper);
    }
    return true;
  }

  function injectAdminFilter() {
    tryInjectFilter();

    var observer = new MutationObserver(function() {
      tryInjectFilter();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    var attempts = 0;
    var poll = setInterval(function() {
      attempts++;
      if (tryInjectFilter() || attempts > 20) {
        clearInterval(poll);
      }
    }, 500);
  }

  var waitReady = function(cb, maxWait) {
    maxWait = maxWait || 10000;
    var start = Date.now();
    var check = function() {
      var main = document.querySelector('main');
      if (main && main.querySelector('div')) { cb(); return; }
      if (Date.now() - start < maxWait) requestAnimationFrame(check);
    };
    check();
  };

  waitReady(function() {
    try { injectAdminFilter(); } catch(e) { console.warn('Admin filter injection failed:', e); }
    console.log('[Admin Panel] Admin Filter in Finance loaded');
  });
})();


// ========================================
// FEATURE #18: Settlement / Pembagian Uang
// ========================================
(function() {
  'use strict';
  var SETTLE_INJECTED = 'data-settlement-injected';
  var _token = function() { return localStorage.getItem('dn_admin_token'); };

  function formatRp(n) { return 'Rp ' + (n || 0).toLocaleString('id-ID'); }
  function formatDate(d) {
    if (!d) return '—';
    var dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function clickRefreshButton() {
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent.indexOf('Refresh') !== -1) {
        buttons[i].click();
        return;
      }
    }
  }

  function createSettlementUI() {
    var wrapper = document.createElement('div');
    wrapper.setAttribute(SETTLE_INJECTED, 'true');
    wrapper.style.cssText = 'margin-top:16px;width:100%;';

    // --- Settled filter tabs ---
    var tabRow = document.createElement('div');
    tabRow.style.cssText = 'display:flex;gap:4px;margin-bottom:16px;background:hsl(var(--muted));border-radius:8px;padding:4px;';

    var tabs = [
      { value: 'all', label: 'Semua' },
      { value: 'unsettled', label: 'Belum Dibagi' },
      { value: 'settled', label: 'Sudah Dibagi' }
    ];
    var tabButtons = [];

    tabs.forEach(function(tab) {
      var btn = document.createElement('button');
      btn.textContent = tab.label;
      btn.style.cssText = 'flex:1;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.2s;';
      btn.dataset.value = tab.value;
      tabButtons.push(btn);
      tabRow.appendChild(btn);
    });

    function updateTabUI(activeValue) {
      tabButtons.forEach(function(b) {
        if (b.dataset.value === activeValue) {
          b.style.background = 'hsl(var(--background))';
          b.style.color = 'hsl(var(--foreground))';
          b.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        } else {
          b.style.background = 'transparent';
          b.style.color = 'hsl(var(--muted-foreground))';
          b.style.boxShadow = 'none';
        }
      });
    }
    updateTabUI(window.__settledFilter || 'all');

    tabButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        window.__settledFilter = btn.dataset.value;
        updateTabUI(btn.dataset.value);
        clickRefreshButton();
      });
    });
    wrapper.appendChild(tabRow);

    // --- Settlement action card ---
    var settleCard = document.createElement('div');
    settleCard.style.cssText = 'border:1px solid hsl(var(--border));border-radius:12px;padding:16px;margin-bottom:16px;background:hsl(var(--card));';

    var settleTitle = document.createElement('p');
    settleTitle.className = 'text-sm font-semibold text-primary';
    settleTitle.textContent = 'Tandai Sudah Dibagi';
    settleTitle.style.marginBottom = '12px';
    settleCard.appendChild(settleTitle);

    var settleDesc = document.createElement('p');
    settleDesc.className = 'text-xs text-muted-foreground';
    settleDesc.textContent = 'Pilih rentang tanggal order yang ingin ditandai sebagai sudah dibagi. Order yang sudah ditandai tidak akan terhitung di pembagian berikutnya.';
    settleDesc.style.marginBottom = '12px';
    settleCard.appendChild(settleDesc);

    var dateRow = document.createElement('div');
    dateRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;';

    var labelFrom = document.createElement('span');
    labelFrom.className = 'text-xs text-muted-foreground';
    labelFrom.textContent = 'Dari:';
    dateRow.appendChild(labelFrom);

    var inputFrom = document.createElement('input');
    inputFrom.type = 'date';
    inputFrom.className = 'flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm';
    inputFrom.style.cssText = 'color-scheme:dark;cursor:pointer;';
    dateRow.appendChild(inputFrom);

    var labelTo = document.createElement('span');
    labelTo.className = 'text-xs text-muted-foreground';
    labelTo.textContent = 'Sampai:';
    dateRow.appendChild(labelTo);

    var inputTo = document.createElement('input');
    inputTo.type = 'date';
    inputTo.className = 'flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm';
    inputTo.style.cssText = 'color-scheme:dark;cursor:pointer;';
    dateRow.appendChild(inputTo);

    // Set defaults: from = 7 days ago, to = today
    var today = new Date();
    var weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    inputTo.value = today.toISOString().split('T')[0];
    inputFrom.value = weekAgo.toISOString().split('T')[0];

    settleCard.appendChild(dateRow);

    // Settle button
    var settleBtn = document.createElement('button');
    settleBtn.className = 'inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2';
    settleBtn.textContent = 'Tandai Sudah Dibagi';
    settleBtn.style.cssText = 'cursor:pointer;width:100%;';

    var settleStatus = document.createElement('p');
    settleStatus.className = 'text-xs';
    settleStatus.style.cssText = 'margin-top:8px;text-align:center;display:none;';

    settleBtn.addEventListener('click', function() {
      if (!inputFrom.value || !inputTo.value) {
        settleStatus.textContent = 'Pilih tanggal dari dan sampai terlebih dahulu';
        settleStatus.style.color = 'hsl(0 84% 60%)';
        settleStatus.style.display = 'block';
        return;
      }
      settleBtn.disabled = true;
      settleBtn.textContent = 'Memproses...';
      var body = { dateFrom: inputFrom.value, dateTo: inputTo.value };
      // Use the admin filter if selected
      var adminSelect = document.querySelector('[data-admin-filter-injected] select');
      if (adminSelect && adminSelect.value) {
        body.admin = adminSelect.value;
      }
      fetch('/api/finance/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _token() },
        body: JSON.stringify(body)
      }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
        .then(function(result) {
          if (result.ok) {
            settleStatus.textContent = result.data.message;
            settleStatus.style.color = 'hsl(142 71% 45%)';
            loadSettlementHistory();
            clickRefreshButton();
          } else {
            settleStatus.textContent = result.data.error || 'Gagal melakukan settlement';
            settleStatus.style.color = 'hsl(0 84% 60%)';
          }
          settleStatus.style.display = 'block';
          setTimeout(function() { settleStatus.style.display = 'none'; }, 5000);
        })
        .catch(function() {
          settleStatus.textContent = 'Terjadi kesalahan jaringan';
          settleStatus.style.color = 'hsl(0 84% 60%)';
          settleStatus.style.display = 'block';
        })
        .finally(function() {
          settleBtn.disabled = false;
          settleBtn.textContent = 'Tandai Sudah Dibagi';
        });
    });

    settleCard.appendChild(settleBtn);
    settleCard.appendChild(settleStatus);
    wrapper.appendChild(settleCard);

    // --- Settlement history ---
    var historyCard = document.createElement('div');
    historyCard.style.cssText = 'border:1px solid hsl(var(--border));border-radius:12px;padding:16px;background:hsl(var(--card));';

    var historyTitle = document.createElement('p');
    historyTitle.className = 'text-sm font-semibold text-primary';
    historyTitle.textContent = 'Riwayat Pembagian';
    historyTitle.style.marginBottom = '12px';
    historyCard.appendChild(historyTitle);

    var historyBody = document.createElement('div');
    historyBody.id = 'settlement-history-body';
    historyCard.appendChild(historyBody);
    wrapper.appendChild(historyCard);

    function loadSettlementHistory() {
      fetch('/api/finance/settlements', {
        headers: { 'Authorization': 'Bearer ' + _token() }
      }).then(function(r) { return r.json(); }).then(function(data) {
        var settlements = data.settlements || [];
        if (settlements.length === 0) {
          historyBody.innerHTML = '<p class="text-xs text-muted-foreground" style="text-align:center;padding:12px;">Belum ada riwayat pembagian</p>';
          return;
        }
        var html = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;">';
        html += '<thead><tr style="border-bottom:1px solid hsl(var(--border));">';
        html += '<th style="padding:8px 6px;text-align:left;color:hsl(var(--muted-foreground));">Tanggal Dibagi</th>';
        html += '<th style="padding:8px 6px;text-align:left;color:hsl(var(--muted-foreground));">Periode</th>';
        html += '<th style="padding:8px 6px;text-align:left;color:hsl(var(--muted-foreground));">Admin</th>';
        html += '<th style="padding:8px 6px;text-align:right;color:hsl(var(--muted-foreground));">Order</th>';
        html += '<th style="padding:8px 6px;text-align:right;color:hsl(var(--muted-foreground));">Total</th>';
        html += '<th style="padding:8px 6px;text-align:center;color:hsl(var(--muted-foreground));">Aksi</th>';
        html += '</tr></thead><tbody>';
        settlements.forEach(function(s) {
          html += '<tr style="border-bottom:1px solid hsl(var(--border)/0.5);">';
          html += '<td style="padding:8px 6px;">' + formatDate(s.createdAt) + '</td>';
          html += '<td style="padding:8px 6px;">' + formatDate(s.settledFrom) + ' — ' + formatDate(s.settledTo) + '</td>';
          html += '<td style="padding:8px 6px;">' + (s.adminFilter || 'Semua') + '</td>';
          html += '<td style="padding:8px 6px;text-align:right;">' + s.orderCount + '</td>';
          html += '<td style="padding:8px 6px;text-align:right;color:hsl(142 71% 45%);">' + formatRp(s.totalGross) + '</td>';
          html += '<td style="padding:8px 6px;text-align:center;"><button class="settle-undo-btn" data-id="' + s.id + '" style="border:none;background:hsl(0 84% 60% / 0.15);color:hsl(0 84% 60%);padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;">Batalkan</button></td>';
          html += '</tr>';
        });
        html += '</tbody></table></div>';
        historyBody.innerHTML = html;

        // Attach undo handlers
        historyBody.querySelectorAll('.settle-undo-btn').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var sid = btn.dataset.id;
            if (!sid) return;
            if (!confirm('Yakin ingin membatalkan pembagian ini? Order akan dikembalikan ke status "Belum Dibagi".')) return;
            btn.disabled = true;
            btn.textContent = '...';
            fetch('/api/finance/settlements/' + sid, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + _token() }
            }).then(function(r) {
              return r.json().then(function(d) { return { ok: r.ok, data: d }; });
            }).then(function(result) {
              if (result.ok) {
                loadSettlementHistory();
                setTimeout(function() { clickRefreshButton(); }, 300);
              } else {
                btn.disabled = false;
                btn.textContent = 'Batalkan';
                alert(result.data.error || 'Gagal membatalkan pembagian');
              }
            }).catch(function() {
              btn.disabled = false;
              btn.textContent = 'Batalkan';
              alert('Terjadi kesalahan jaringan');
            });
          });
        });
      }).catch(function() {
        historyBody.innerHTML = '<p class="text-xs text-muted-foreground" style="text-align:center;padding:12px;">Gagal memuat riwayat</p>';
      });
    }

    // Load history on creation
    loadSettlementHistory();

    return wrapper;
  }

  function tryInjectSettlement() {
    if (window.location.pathname !== '/finance') return false;
    if (document.querySelector('[' + SETTLE_INJECTED + ']')) return true;

    // Find the admin filter (injected by Feature #17) and place settlement below it
    var adminFilter = document.querySelector('[data-admin-filter-injected]');
    var insertAfter = adminFilter;

    // If no admin filter yet, find the header row
    if (!insertAfter) {
      var financeTitle = null;
      document.querySelectorAll('h1, h2').forEach(function(h) {
        if (h.textContent.trim() === 'Rekap Keuangan') financeTitle = h;
      });
      if (!financeTitle) return false;
      var headerRow = financeTitle.closest('[class*="between"]');
      if (!headerRow) {
        var p = financeTitle.parentElement;
        headerRow = p ? p.parentElement : null;
      }
      insertAfter = headerRow;
    }
    if (!insertAfter) return false;

    var settlementUI = createSettlementUI();
    if (insertAfter.nextSibling) {
      insertAfter.parentElement.insertBefore(settlementUI, insertAfter.nextSibling);
    } else {
      insertAfter.parentElement.appendChild(settlementUI);
    }
    return true;
  }

  function injectSettlement() {
    tryInjectSettlement();
    var observer = new MutationObserver(function() {
      tryInjectSettlement();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    var attempts = 0;
    var poll = setInterval(function() {
      attempts++;
      if (tryInjectSettlement() || attempts > 30) {
        clearInterval(poll);
      }
    }, 500);
  }

  var waitReady = function(cb, maxWait) {
    maxWait = maxWait || 10000;
    var start = Date.now();
    var check = function() {
      var main = document.querySelector('main');
      if (main && main.querySelector('div')) { cb(); return; }
      if (Date.now() - start < maxWait) requestAnimationFrame(check);
    };
    check();
  };

  waitReady(function() {
    try { injectSettlement(); } catch(e) { console.warn('Settlement injection failed:', e); }
    console.log('[Admin Panel] Settlement Feature loaded');
  });
})();
