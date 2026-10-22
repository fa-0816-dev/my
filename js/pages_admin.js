/* ============================================
   管理员端页面渲染 pages_admin.js
   登录注册、数据看板、景点档案、用户管理、游记审核、评论管理、消息管理、个人设置
   ============================================ */

/* ===== 管理员登录 ===== */
Router.adminPages['/login'] = (app) => {
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card" style="border:2px solid var(--accent)">
                <h2>🛡️ 管理员登录</h2>
                <div class="form-group">
                    <label class="form-label">用户名</label>
                    <input id="admin-login-username" class="form-control" placeholder="admin">
                </div>
                <div class="form-group">
                    <label class="form-label">密码</label>
                    <input id="admin-login-password" class="form-control" type="password" placeholder="admin123">
                </div>
                <button class="btn btn-primary btn-block" onclick="adminLogin()">登录管理后台</button>
                <div style="margin-top:16px;text-align:center">
                    <a href="#/admin/register" style="font-size:0.85rem">注册管理员</a>
                    <span style="margin:0 8px">|</span>
                    <a href="#/" style="font-size:0.85rem">返回首页</a>
                </div>
            </div>
        </div>
    `;

    window.adminLogin = () => {
        const username = document.getElementById('admin-login-username').value.trim();
        const password = document.getElementById('admin-login-password').value;
        if (!username || !password) { UI.toast('请填写完整', 'warning'); return; }
        const result = Auth.adminLogin(username, password);
        if (result.success) {
            UI.toast('管理员登录成功', 'success');
            setTimeout(() => Router.navigate('/admin/dashboard'), 500);
        } else {
            UI.toast(result.message, 'error');
        }
    };
};

/* ===== 管理员注册 ===== */
Router.adminPages['/register'] = (app) => {
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>📝 注册管理员</h2>
                <div class="form-group">
                    <label class="form-label">用户名</label>
                    <input id="admin-reg-username" class="form-control" placeholder="4-20位字符">
                </div>
                <div class="form-group">
                    <label class="form-label">真实姓名</label>
                    <input id="admin-reg-name" class="form-control" placeholder="您的姓名">
                </div>
                <div class="form-group">
                    <label class="form-label">密码</label>
                    <input id="admin-reg-password" class="form-control" type="password" placeholder="至少6位">
                </div>
                <button class="btn btn-primary btn-block" onclick="adminRegister()">立即注册</button>
                <div style="margin-top:16px;text-align:center">
                    <a href="#/admin/login" style="font-size:0.85rem">已有账号？去登录</a>
                </div>
            </div>
        </div>
    `;

    window.adminRegister = () => {
        const data = {
            username: document.getElementById('admin-reg-username').value.trim(),
            name: document.getElementById('admin-reg-name').value.trim(),
            password: document.getElementById('admin-reg-password').value
        };
        if (!data.username || !data.name || !data.password) { UI.toast('请填写完整', 'warning'); return; }
        if (data.password.length < 6) { UI.toast('密码至少6位', 'warning'); return; }

        const result = Auth.adminRegister(data);
        if (result.success) {
            UI.toast('注册成功，请登录', 'success');
            setTimeout(() => Router.navigate('/admin/login'), 800);
        } else {
            UI.toast(result.message, 'error');
        }
    };
};

/* ---------- 管理员布局壳 ---------- */
const ADMIN_SIDEBAR = [
    { path: '/dashboard', icon: '📊', name: '数据看板' },
    { path: '/home', icon: '🏠', name: '首页轮播图管理' },
    { path: '/spots', icon: '📍', name: '景点档案管理' },
    { path: '/users', icon: '👥', name: '用户管理' },
    { path: '/travels', icon: '📖', name: '游记审核' },
    { path: '/comments', icon: '💬', name: '评论管理' },
    { path: '/messages', icon: '📨', name: '站内消息管理' },
    { path: '/settings', icon: '⚙️', name: '个人设置' }
];

function wrapAdminLayout(contentHTML, activePath) {
    const admin = Query.getCurrentAdmin();
    return `
        <div class="admin-layout">
            <aside class="admin-sidebar">
                <h3>🛡️ 管理后台</h3>
                ${ADMIN_SIDEBAR.map(item => `
                    <a href="#/admin${item.path}" class="${activePath === item.path ? 'active' : ''}">
                        <span>${item.icon}</span> ${item.name}
                    </a>
                `).join('')}
                <div style="margin-top:24px;padding:16px;border-top:1px solid var(--border)">
                    <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px">当前: ${admin?.name}</div>
                    <button class="btn btn-sm btn-outline btn-block" onclick="adminLogout()">🚪 退出登录</button>
                </div>
            </aside>
            <main class="admin-content">${contentHTML}</main>
        </div>
    `;
}

window.adminLogout = () => {
    Auth.adminLogout();
    UI.toast('已退出管理员登录', 'info');
    Router.navigate('/admin/login');
};

/* ===== 数据看板 ===== */
Router.adminPages['/dashboard'] = (app) => {
    const spots = DB.get(STORAGE_KEYS.SPOTS);
    const users = DB.get(STORAGE_KEYS.USERS);
    const travels = DB.get(STORAGE_KEYS.TRAVELS);
    const pendingTravels = travels.filter(t => t.status === 'pending');
    const comments = DB.get(STORAGE_KEYS.COMMENTS);
    const checkins = DB.get(STORAGE_KEYS.CHECKINS);

    // 各校区景点分布
    const campusStats = {};
    spots.forEach(s => { campusStats[s.campus] = (campusStats[s.campus] || 0) + 1; });

    // 游记状态分布
    const travelStats = { approved: 0, pending: 0, rejected: 0 };
    travels.forEach(t => { travelStats[t.status] = (travelStats[t.status] || 0) + 1; });

    const content = `
        <div class="section">
            <div class="section-title">📊 数据看板</div>

            <!-- 统计卡片 -->
            <div class="stats-grid">
                <div class="stat-card clickable" onclick="Router.navigate('/admin/spots')">
                    <div class="stat-icon">📍</div>
                    <div class="stat-number">${spots.length}</div>
                    <div class="stat-label">校园景点</div>
                    <div class="stat-hint">点击管理 →</div>
                </div>
                <div class="stat-card clickable" onclick="Router.navigate('/admin/users')">
                    <div class="stat-icon">👥</div>
                    <div class="stat-number">${users.length}</div>
                    <div class="stat-label">注册用户</div>
                    <div class="stat-hint">点击管理 →</div>
                </div>
                <div class="stat-card clickable" onclick="Router.navigate('/admin/travels')">
                    <div class="stat-icon">📖</div>
                    <div class="stat-number">${travels.length}</div>
                    <div class="stat-label">游记总数</div>
                    <div class="stat-hint">点击管理 →</div>
                </div>
                <div class="stat-card clickable" onclick="Router.navigate('/admin/travels?status=pending')">
                    <div class="stat-icon">✅</div>
                    <div class="stat-number">${pendingTravels.length}</div>
                    <div class="stat-label">待审核游记</div>
                    <div class="stat-hint">点击审核 →</div>
                </div>
            </div>

            <div class="grid" style="grid-template-columns:2fr 1fr">
                <!-- 待审核游记 -->
                <div class="detail-section clickable" onclick="Router.navigate('/admin/travels?status=pending')" title="点击前往审核">
                    <h3>📋 待审核游记</h3>
                    ${pendingTravels.length === 0 ? '<p class="text-muted">暂无待审核游记 🎉</p>' : `
                        ${pendingTravels.slice(0, 5).map(t => {
                            const author = Query.getUser(t.userId);
                            return `
                            <div style="padding:12px;background:var(--secondary);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
                                <div>
                                    <div style="font-weight:600">${t.title}</div>
                                    <div class="text-muted" style="font-size:0.8rem">by ${author?.username} · ${t.createTime}</div>
                                </div>
                                <a href="#/admin/travels?status=pending" class="btn btn-sm btn-primary" onclick="event.stopPropagation()">审核</a>
                            </div>
                        `}).join('')}
                    `}
                </div>

                <!-- 各校区景点分布 -->
                <div class="detail-section clickable" onclick="Router.navigate('/admin/spots')" title="点击前往景点档案">
                    <h3>🏫 校区景点分布</h3>
                    ${Object.entries(campusStats).map(([c, n]) => `
                        <div style="margin-bottom:12px">
                            <div style="display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:4px">
                                <span>${c}</span><span class="text-muted">${n} 个</span>
                            </div>
                            <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
                                <div style="height:100%;background:var(--primary);border-radius:4px;width:${n / spots.length * 100}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="grid" style="grid-template-columns:1fr 1fr">
                <!-- 游记状态 -->
                <div class="detail-section clickable" onclick="Router.navigate('/admin/travels')" title="点击前往游记管理">
                    <h3>📖 游记状态分布</h3>
                    <div style="display:flex;gap:16px;margin-top:12px">
                        <div style="flex:1;text-align:center;padding:16px;background:var(--secondary);border-radius:8px">
                            <div class="stat-number" style="color:var(--success)">${travelStats.approved}</div>
                            <div class="text-muted" style="font-size:0.85rem">已通过</div>
                        </div>
                        <div style="flex:1;text-align:center;padding:16px;background:var(--secondary);border-radius:8px">
                            <div class="stat-number" style="color:var(--warning)">${travelStats.pending}</div>
                            <div class="text-muted" style="font-size:0.85rem">审核中</div>
                        </div>
                        <div style="flex:1;text-align:center;padding:16px;background:var(--secondary);border-radius:8px">
                            <div class="stat-number" style="color:var(--danger)">${travelStats.rejected || 0}</div>
                            <div class="text-muted" style="font-size:0.85rem">已驳回</div>
                        </div>
                    </div>
                </div>

                <!-- 打卡统计 -->
                <div class="detail-section clickable" onclick="Router.navigate('/admin/spots')" title="点击前往景点档案">
                    <h3>📍 打卡统计: ${checkins.length}</h3>
                    ${spots.sort((a, b) => (b.hot || 0) - (a.hot || 0)).slice(0, 5).map((s, i) => `
                        <div style="display:flex;align-items:center;gap:10px;padding:6px 0">
                            <span style="width:24px;height:24px;border-radius:50%;background:${i<3?'var(--primary)':'var(--border)'};
                                color:white;display:flex;align-items:center;justify-content:center;font-size:0.7rem">${i+1}</span>
                            <span style="flex:1;font-size:0.9rem">${UI.spotIcon(s, 24)} ${s.name}</span>
                            <span class="text-muted" style="font-size:0.85rem">🔥 ${s.hot}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/dashboard');
};

/* ===== 景点档案管理 ===== */
Router.adminPages['/spots'] = (app) => {
    const spots = DB.get(STORAGE_KEYS.SPOTS);

    const content = `
        <div class="section">
            <div class="section-title">📍 景点档案管理</div>
            <div style="margin-bottom:16px">
                <button class="btn btn-primary" onclick="adminOpenSpotForm()">➕ 新增景点</button>
                <button class="btn btn-outline" onclick="exportSpots()">📥 导出数据</button>
            </div>

            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>图标</th>
                            <th>名称</th>
                            <th>类别</th>
                            <th>校区</th>
                            <th>经纬度</th>
                            <th>热度</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${spots.map(s => `
                            <tr>
                                <td>${s.id}</td>
                                <td style="font-size:1.5rem">${UI.spotIcon(s, 36)}</td>
                                <td><strong>${s.name}</strong></td>
                                <td>${s.category}</td>
                                <td>${s.campus}</td>
                                <td style="font-size:0.75rem;color:var(--text-muted)">${s.lat}, ${s.lng}</td>
                                <td>🔥 ${s.hot}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline" onclick="adminOpenSpotForm(${s.id})">编辑</button>
                                    <button class="btn btn-sm btn-danger" onclick="adminDeleteSpot(${s.id})">删除</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/spots');

    window.adminOpenSpotForm = (spotId = 0) => {
        const spot = spotId ? Query.getSpot(spotId) : {};
        const isEdit = !!spotId;
        UI.openModal(isEdit ? '编辑景点' : '新增景点', `
            <div class="form-group">
                <label class="form-label">景点名称</label>
                <input id="f-name" class="form-control" value="${spot.name || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">图标</label>
                <div style="display:flex;gap:8px;align-items:center">
                    <button type="button" id="f-icon-btn" onclick="toggleIconPicker()" style="padding:10px 14px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);cursor:pointer;font-size:1.5rem;min-width:60px">${spot.icon || '📍'}</button>
                    <input id="f-icon" type="hidden" value="${spot.icon || '📍'}">
                    <span class="text-muted" style="font-size:0.8rem">点击选择图标</span>
                </div>
                <!-- 图标选择器 -->
                <div id="icon-picker" class="icon-picker-grid">
                    ${['📍','🏫','🌳','📚','🏛️','🏟️','🎨','🧬','⚙️','🚪','🍜','🏥','🎵','🎭','🌲','🔬','🔨','📖','🏢','🗺️','🏃','🧪','🌸','🌻','🌴','🏔️','🌊','🌙','⭐','⚡','🔥','💧','🌿','🍃','🎓','🎯','📌','🔖','🏷️','💎','🎁','🌈','☕','🍱','🏪','🏬','🏠','🛖','🌆','⛲','⛳','🎒','📷','🎬','🎤','🎧','📱','💻','🖥️','📺','🔭','🌟','✨','💫','🛝','🎠','🎡','🏝️','🏜️','🏞️','🏕️','🏖️','🏗️','🛕','⛩️','🏯','🏰','🕌','🛗','🚏','🚨','🚦','🚥','🚧','⛽','🛣️','🛤️','🛢️','🧭','🧱','🪨','🪵','🛖','🪑','🚪','🛗','🪞','🪟','🛏️','🛋️','🪤','🪒','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🧽','🧯','🛒','🚬','⚰️','⚱️','🗿','🪧','🪪','💈','💉','💊','🩹','🩺','🚪','🛃','🛄','🛅','🚹','🚺','🚼','⚧','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','💱','™️','©️','®️','👁️‍🗨️','🔚','🔙','🔛','🔝','🔜','〰️','➰','➿','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔷','🔳','🔲','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔷','🔳','🔲','🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💪','🦾','🦵','🦶','👀','👁️','👅','👄','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🫅','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🫃','🫄','🤱','👼','🎅','🤶','🦸','🦹','🧙','🧚','🧛','🧜','🧝','🧞','🧟','🧌','💆','💇','🚶','🧍','🧎','🏃','💃','🕺','🕴️','👥','🫂','👣','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪲','🐢','🐍','🦎','🦖','🦕','🐳','🐋','🐬','🦭','🐟','🐠','🐡','🦈','🐙','🐚','🪸','🪼','🐌','🦀','🦞','🦐','🦑','🐒','🦧','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🦁','🐯','🐅','🐆','🐎','🐖','🐗','🐽','🐏','🐑','🐐','🐪','🐫','🦙','🦒','🐘','🦣','🦏','🦛','🐭','🐁','🐀','🐹','🐰','🐇','🐿️','🦫','🦔','🦇','🐻','🐻‍❄️','🐨','🐼','🦥','🦦','🦨','🦘','🦡','🐾','🦃','🐔','🐓','🐣','🐤','🐥','🐦','🐧','🕊️','🐦','🐧','🕊️','🦅','🦆','🦢','🦉','🦤','🪶','🦩','🦚','🦜','🪽','🐦','🐧','🕊️','🐸','🐊','🐢','🦎','🐍','🐲','🐉','🦕','🦖','🐳','🐋','🐬','🦭','🐟','🐠','🐡','🦈','🐙','🐚','🪸','🪼','🐌','🦀','🦞','🦐','🦑','🌱','🪴','🌲','🌳','🌴','🌵','🌾','🌿','☘️','🍀','🍁','🍂','🍃','🪹','🪺','🍄','🌰','🦀','🦞','🦐','🦑','🦪','🍇','🍈','🍉','🍊','🍋','🍌','🍍','🥭','🍎','🍏','🍐','🍑','🍒','🍓','🫐','🥝','🍅','🫒','🥥','🥑','🍆','🥔','🥕','🌽','🌶️','🫑','🥒','🥬','🥦','🧄','🧅','🥜','🫘','🌰','🫚','🫛','🍞','🥐','🥖','🫓','🥨','🥯','🥞','🧇','🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🫔','🥙','🧆','🥚','🍳','🥘','🍲','🫕','🥗','🍿','🧈','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🦀','🦞','🦐','🦑','🦪','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🫖','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🫗','🥤','🧋','🧃','🧉','🧊','🥢','🍽️','🍴','🥄','🔪','🫙','🏺','🌍','🌎','🌏','🌐','🪨','🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘','🌙','🌚','🌛','🌜','☀️','🌝','🌞','🪐','⭐','🌟','🌠','🌌','☁️','⛅','⛈️','🌤️','🌥️','🌦️','🌧️','🌨️','🌩️','🌪️','🌫️','🌬️','🌀','🌈','🌂','☂️','☔','⛱️','⚡','❄️','☃️','⛄','☄️','🔥','💧','🌊','🎃','🎄','🎁','🎈','🎉','🎊','🏮','🎆','🎇','🧨','✨','🌟','⭐','💫','🌀','🎵','🎶','🎼','🎤','🎧','📻','🎷','🪗','🎸','🎹','🎺','🎻','🪈','🥁','🪘','🥳','🤹','⛳','⛸️','🏂','🛷','⛷️','🏂','🏋️','🤼','🤸','🤺','⛹️','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🏵️','🎫','🎟️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🎹','🎻','🪈','📱','📲','☎️','📞','📟','📠','🔋','🪫','🔌','💻','🖥️','🖨️','⌨️','🖱️','🖲️','💽','💾','💿','📀','🧮','🎥','🎞️','📽️','🎬','📺','📷','📸','📹','📼','🔍','🔎','🕯️','💡','🔦','🏮','🪔','📔','📕','📖','📗','📘','📙','📚','📓','📒','📃','📜','📄','📰','🗞️','📑','🔖','🏷️','💰','💴','💵','💶','💷','💸','💳','🧾','💹','💱','💲','💠','🧿','🪧','🪪','🔇','🔈','🔉','🔊','📢','📣','📯','🔔','🔕','🎼','🎵','🎶','🎙️','🎚️','🎛️','🎤','🎧','📻','🎷','🪗','🎸','🎹','🎺','🎻','🪈','🥁','🪘','⚙️','🪜','⌛','⏳','⌚','⏰','⏱️','⏲️','🕰️','🕛','🕧','🕐','🕜','🕑','🕝','🕒','🕞','🕓','🕟','🕔','🕠','🕕','🕡','🕖','🕢','🕗','🕣','🕘','🕤','🕙','🕥','🕚','🕦','📡','🔋','🪫','🔌','💻','🖥️','🖨️','⌨️','🖱️','🖲️','💽','💾','💿','📀','🧮','🎥','🎞️','📽️','🎬','📺','📷','📸','📹','📼','🔍','🔎','🕯️','💡','🔦','🏮','🪔','📔','📕','📖','📗','📘','📙','📚','📓','📒','📃','📜','📄','📰','🗞️','📑','🔖','🏷️','💰','💴','💵','💶','💷','💸','💳','🧾','💹','💱','💲','💠','🧿','🪧','🪪'].map(e =>
                        `<button type="button" onclick="pickIcon('${e}')" style="padding:8px;border:1px solid transparent;background:none;border-radius:6px;cursor:pointer;font-size:1.2rem;transition:all 0.15s" onmouseover="this.style.background='var(--secondary)'" onmouseout="this.style.background=''">${e}</button>`
                    ).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">类别</label>
                <select id="f-category" class="form-control">
                    ${['学习场所','办公建筑','教学场所','运动场所','餐饮服务','地标建筑','自然景观','文化场馆','活动场所'].map(c =>
                        `<option ${spot.category===c?'selected':''}>${c}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">校区</label>
                <select id="f-campus" class="form-control">
                    <option ${spot.campus==='东园'?'selected':''}>东园</option>
                    <option ${spot.campus==='西园'?'selected':''}>西园</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">景点图片 (可选)</label>
                <div style="display:flex;gap:12px;align-items:center">
                    <input id="f-image" class="form-control" type="file" accept="image/*" onchange="adminPreviewSpotImg(this)">
                    <img id="f-img-preview" src="${spot.image || ''}" style="max-width:120px;max-height:80px;border-radius:6px;object-fit:cover;${spot.image?'':'display:none'}">
                </div>
                ${spot.image ? '<button type="button" class="btn btn-outline" style="margin-top:6px;font-size:0.8rem;padding:4px 10px" onclick="adminClearSpotImg()">🗑️ 清除图片</button>' : ''}
            </div>
            <div class="form-group">
                <label class="form-label">描述</label>
                <textarea id="f-desc" class="form-control form-textarea" rows="3">${spot.description || ''}</textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="form-group">
                    <label class="form-label">纬度</label>
                    <input id="f-lat" class="form-control" value="${spot.lat || 28.13}">
                </div>
                <div class="form-group">
                    <label class="form-label">经度</label>
                    <input id="f-lng" class="form-control" value="${spot.lng || 112.99}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">地址</label>
                <input id="f-address" class="form-control" value="${spot.address || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">开放时间</label>
                <input id="f-openTime" class="form-control" value="${spot.openTime || ''}">
            </div>
        `, `
            <button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="adminSaveSpot(${spotId})">💾 保存</button>
        `);
    };

    window.adminPreviewSpotImg = (input) => {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        console.log('[upload] === 开始 ===', file.name, (file.size/1024).toFixed(1) + 'KB', file.type);

        // 景点图片不走 cropImage！因为 cropImage 会 openModal 覆盖当前的景点表单 modal，
        // 把 modal-body innerHTML 整个干掉，裁剪完表单就消失了！
        // 所以这里直接 FileReader 预览，保存时再 Canvas 压缩。
        const reader = new FileReader();
        reader.onerror = () => { UI.toast('❌ 图片读取失败', 'error'); };
        reader.onload = (e) => {
            const preview = document.getElementById('f-img-preview');
            if (!preview) { UI.toast('❌ 预览元素不存在', 'error'); return; }
            preview.src = e.target.result;
            preview.style.display = 'inline-block';
            UI.toast('✓ 图片已选择（保存时会自动压缩）', 'success');
        };
        reader.readAsDataURL(file);
        input.value = '';
    };

    window.adminClearSpotImg = () => {
        const input = document.getElementById('f-image');
        const preview = document.getElementById('f-img-preview');
        input.value = '';
        preview.src = '';
        preview.style.display = 'none';
    };

    // 图标选择器
    window.toggleIconPicker = () => {
        const p = document.getElementById('icon-picker');
        if (!p) return;
        if (p.style.display === 'none') {
            p.style.display = 'grid';
        } else {
            p.style.display = 'none';
        }
    };
    window.pickIcon = (e) => {
        document.getElementById('f-icon').value = e;
        document.getElementById('f-icon-btn').textContent = e;
        document.getElementById('icon-picker').style.display = 'none';
    };
    // 点击弹窗外关闭图标选择器
    document.addEventListener('click', (ev) => {
        const p = document.getElementById('icon-picker');
        if (!p || !p.parentElement) return;
        if (!p.parentElement.contains(ev.target) && ev.target.id !== 'f-icon-btn' && !ev.target.closest('#icon-picker')) {
            p.style.display = 'none';
        }
    });

    window.adminSaveSpot = (spotId) => {
        const preview = document.getElementById('f-img-preview');
        const existingSpot = spotId ? Query.getSpot(spotId) : {};
        const data = {
            name: document.getElementById('f-name').value.trim(),
            icon: document.getElementById('f-icon').value.trim() || '📍',
            category: document.getElementById('f-category').value,
            campus: document.getElementById('f-campus').value,
            image: preview.src && !preview.src.startsWith('data:,') ? preview.src : (existingSpot.image || ''),
            description: document.getElementById('f-desc').value.trim(),
            lat: parseFloat(document.getElementById('f-lat').value) || 28.13,
            lng: parseFloat(document.getElementById('f-lng').value) || 112.99,
            address: document.getElementById('f-address').value.trim(),
            openTime: document.getElementById('f-openTime').value.trim()
        };
        if (!data.name) { UI.toast('请填写景点名称', 'warning'); return; }

        if (spotId) {
            DB.update(STORAGE_KEYS.SPOTS, spotId, data);
            UI.toast('景点已更新', 'success');
        } else {
            DB.add(STORAGE_KEYS.SPOTS, { ...data, hot: 0 });
            UI.toast('景点已添加', 'success');
        }
        UI.closeModal();
        Router.handleRoute();
    };

    window.adminDeleteSpot = (spotId) => {
        UI.openModal('删除确认', '<p>确定删除该景点吗？此操作不可恢复。</p>',
            `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-danger" onclick="confirmDeleteSpot(${spotId})">确认删除</button>`);
    };

    window.confirmDeleteSpot = (spotId) => {
        DB.remove(STORAGE_KEYS.SPOTS, spotId);
        UI.closeModal();
        UI.toast('景点已删除', 'success');
        Router.handleRoute();
    };

    window.exportSpots = () => {
        const data = JSON.stringify(DB.get(STORAGE_KEYS.SPOTS), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'campus_spots.json'; a.click();
        URL.revokeObjectURL(url);
        UI.toast('数据已导出', 'success');
    };
};

/* ===== 用户管理 ===== */
Router.adminPages['/users'] = (app) => {
    const users = DB.get(STORAGE_KEYS.USERS);

    const content = `
        <div class="section">
            <div class="section-title">👥 用户管理 (${users.length})</div>

            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>昵称</th>
                            <th>学号</th>
                            <th>手机号</th>
                            <th>邮箱</th>
                            <th>注册时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td>${u.id}</td>
                                <td><div class="user-avatar" style="display:inline-flex;width:28px;height:28px;font-size:0.85rem;margin-right:6px">${u.avatar}</div>${u.username}</td>
                                <td>${u.studentId}</td>
                                <td>${u.phone}</td>
                                <td style="font-size:0.8rem">${u.email || '-'}</td>
                                <td style="font-size:0.8rem;color:var(--text-muted)">${u.createTime}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline" onclick="adminOpenUserForm(${u.id})">编辑</button>
                                    <button class="btn btn-sm btn-danger" onclick="adminDeleteUser(${u.id})">删除</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/users');

    window.adminOpenUserForm = (userId) => {
        const u = Query.getUser(userId);
        UI.openModal('编辑用户', `
            <div class="form-group">
                <label class="form-label">昵称</label>
                <input id="u-username" class="form-control" value="${u.username}">
            </div>
            <div class="form-group">
                <label class="form-label">手机号</label>
                <input id="u-phone" class="form-control" value="${u.phone}">
            </div>
            <div class="form-group">
                <label class="form-label">邮箱</label>
                <input id="u-email" class="form-control" value="${u.email || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">重置密码 (留空不修改)</label>
                <input id="u-password" class="form-control" type="password" placeholder="输入新密码">
            </div>
        `, `
            <button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="adminSaveUser(${userId})">💾 保存</button>
        `);
    };

    window.adminSaveUser = (userId) => {
        const data = {
            username: document.getElementById('u-username').value.trim(),
            phone: document.getElementById('u-phone').value.trim(),
            email: document.getElementById('u-email').value.trim(),
            avatar: document.getElementById('u-username').value.trim().charAt(0)
        };
        const newPwd = document.getElementById('u-password').value;
        if (newPwd) data.password = newPwd;
        DB.update(STORAGE_KEYS.USERS, userId, data);
        UI.closeModal();
        UI.toast('用户信息已更新', 'success');
        Router.handleRoute();
    };

    window.adminDeleteUser = (userId) => {
        UI.openModal('删除确认', '<p>确定删除该用户吗？其所有打卡/收藏/评论数据将保留。</p>',
            `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-danger" onclick="confirmDeleteUser(${userId})">确认删除</button>`);
    };

    window.confirmDeleteUser = (userId) => {
        DB.remove(STORAGE_KEYS.USERS, userId);
        UI.closeModal();
        UI.toast('用户已删除', 'success');
        Router.handleRoute();
    };
};

/* ===== 游记审核管理 ===== */
Router.adminPages['/travels'] = (app) => {
    const filter = Router.getQuery('status') || '';
    let travels = DB.get(STORAGE_KEYS.TRAVELS);
    if (filter) travels = travels.filter(t => t.status === filter);

    const count = {
        all: DB.get(STORAGE_KEYS.TRAVELS).length,
        approved: DB.get(STORAGE_KEYS.TRAVELS).filter(t => t.status === 'approved').length,
        pending: DB.get(STORAGE_KEYS.TRAVELS).filter(t => t.status === 'pending').length,
        rejected: DB.get(STORAGE_KEYS.TRAVELS).filter(t => t.status === 'rejected').length
    };

    const content = `
        <div class="section">
            <div class="section-title">📖 游记审核管理</div>

            <!-- 筛选 -->
            <div class="tag-group">
                <a href="#/admin/travels" class="tag ${!filter?'active':''}">全部 (${count.all})</a>
                <a href="#/admin/travels?status=pending" class="tag ${filter==='pending'?'active':''}">⏳ 待审核 (${count.pending})</a>
                <a href="#/admin/travels?status=approved" class="tag ${filter==='approved'?'active':''}">✅ 已通过 (${count.approved})</a>
                <a href="#/admin/travels?status=rejected" class="tag ${filter==='rejected'?'active':''}">❌ 已驳回 (${count.rejected})</a>
            </div>

            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>标题</th>
                            <th>作者</th>
                            <th>内容预览</th>
                            <th>标签</th>
                            <th>提交时间</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${travels.map(t => {
                            const author = Query.getUser(t.userId);
                            return `
                            <tr>
                                <td>${t.id}</td>
                                <td><strong>${t.title}</strong></td>
                                <td>${author?.username || '未知'}</td>
                                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.8rem">${t.content.substring(0, 60)}...</td>
                                <td>${(t.tags || []).map(tag => `<span class="card-tag">#${tag}</span>`).join('')}</td>
                                <td style="font-size:0.8rem;color:var(--text-muted)">${t.createTime}</td>
                                <td>
                                    <span class="badge ${t.status==='approved'?'badge-success':t.status==='pending'?'badge-warning':'badge-danger'}">
                                        ${t.status==='approved'?'已通过':t.status==='pending'?'审核中':'已驳回'}
                                    </span>
                                </td>
                                <td>
                                    ${t.status === 'pending' ? `
                                        <button class="btn btn-sm btn-primary" onclick="approveTravel(${t.id})">通过</button>
                                        <button class="btn btn-sm btn-danger" onclick="rejectTravel(${t.id})">驳回</button>
                                    ` : `
                                        <button class="btn btn-sm btn-outline" onclick="viewTravel(${t.id})">查看</button>
                                        <button class="btn btn-sm btn-danger" onclick="adminDeleteTravel(${t.id})">删除</button>
                                    `}
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/travels');

    window.approveTravel = (id) => {
        const t = Query.getTravel(id);
        DB.update(STORAGE_KEYS.TRAVELS, id, { status: 'approved' });
        // 推送消息给用户
        DB.add(STORAGE_KEYS.MESSAGES, {
            userId: t.userId,
            title: '游记审核通过 ✅',
            content: `您发布的游记《${t.title}》已审核通过，现在可以在前台看到啦！`,
            type: 'system', read: false, time: Utils.now()
        });
        UI.toast('已通过，用户已收到通知', 'success');
        Router.handleRoute();
    };

    window.rejectTravel = (id) => {
        const t = Query.getTravel(id);
        UI.openModal('驳回游记', `
            <p>请填写驳回原因：</p>
            <textarea id="reject-reason" class="form-control form-textarea" rows="3" placeholder="如：内容不符合规范..."></textarea>
        `, `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-danger" onclick="confirmReject(${id}, '${t.title.replace(/'/g, "\\'")}', ${t.userId})">确认驳回</button>`);
    };

    window.confirmReject = (id, title, userId) => {
        const reason = document.getElementById('reject-reason').value.trim();
        DB.update(STORAGE_KEYS.TRAVELS, id, { status: 'rejected' });
        DB.add(STORAGE_KEYS.MESSAGES, {
            userId,
            title: '游记被驳回',
            content: `您发布的游记《${title}》未通过审核${reason ? ('，原因：' + reason) : ''}。请修改后重新提交。`,
            type: 'system', read: false, time: Utils.now()
        });
        UI.closeModal();
        UI.toast('已驳回，用户已收到通知', 'warning');
        Router.handleRoute();
    };

    window.viewTravel = (id) => { Router.navigate('/travels/' + id); };

    window.adminDeleteTravel = (id) => {
        UI.openModal('删除游记', '<p>确定删除该游记吗？</p>',
            `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-danger" onclick="confirmDeleteTravel2(${id})">删除</button>`);
    };

    window.confirmDeleteTravel2 = (id) => {
        DB.remove(STORAGE_KEYS.TRAVELS, id);
        UI.closeModal();
        UI.toast('游记已删除', 'success');
        Router.handleRoute();
    };
};

/* ===== 评论管理 ===== */
Router.adminPages['/comments'] = (app) => {
    const comments = DB.get(STORAGE_KEYS.COMMENTS);

    const content = `
        <div class="section">
            <div class="section-title">💬 评论管理 (${comments.length})</div>

            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>评论者</th>
                            <th>目标</th>
                            <th>内容</th>
                            <th>时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${comments.map(c => {
                            const author = Query.getUser(c.userId);
                            let target = '';
                            if (c.targetType === 'spot') {
                                const s = Query.getSpot(c.targetId);
                                target = `<a href="#/spots/${c.targetId}">📍 ${s?.name || '#' + c.targetId}</a>`;
                            } else {
                                const t = Query.getTravel(c.targetId);
                                target = `<a href="#/travels/${c.targetId}">📖 ${t?.title?.substring(0, 20) || '#' + c.targetId}</a>`;
                            }
                            return `
                            <tr>
                                <td>${c.id}</td>
                                <td>${author?.username || '未知'}</td>
                                <td>${target}</td>
                                <td style="max-width:250px;font-size:0.85rem">${c.content}</td>
                                <td style="font-size:0.8rem;color:var(--text-muted)">${c.time}</td>
                                <td>
                                    <button class="btn btn-sm btn-danger" onclick="adminDeleteComment(${c.id})">删除</button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/comments');

    window.adminDeleteComment = (id) => {
        DB.remove(STORAGE_KEYS.COMMENTS, id);
        UI.toast('评论已删除', 'success');
        Router.handleRoute();
    };
};

/* ===== 站内消息管理 ===== */
Router.adminPages['/messages'] = (app) => {
    const messages = DB.get(STORAGE_KEYS.MESSAGES);
    const users = DB.get(STORAGE_KEYS.USERS);

    const content = `
        <div class="section">
            <div class="section-title">📨 站内消息管理</div>

            <!-- 发送消息 -->
            <div class="detail-section">
                <h3>✉️ 发送新消息</h3>
                <div class="form-group">
                    <label class="form-label">目标用户</label>
                    <select id="msg-user" class="form-control">
                        <option value="0">全部用户 (群发)</option>
                        ${users.map(u => `<option value="${u.id}">${u.username} (${u.studentId})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">消息标题</label>
                    <input id="msg-title" class="form-control" placeholder="消息标题">
                </div>
                <div class="form-group">
                    <label class="form-label">消息类型</label>
                    <select id="msg-type" class="form-control">
                        <option value="system">系统通知</option>
                        <option value="recommend">推荐更新</option>
                        <option value="comment">评论提醒</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">消息内容</label>
                    <textarea id="msg-content" class="form-control form-textarea" rows="4" placeholder="详细内容..."></textarea>
                </div>
                <button class="btn btn-primary" onclick="sendAdminMessage()">📤 发送消息</button>
            </div>

            <!-- 消息列表 -->
            <div class="detail-section">
                <h3>📋 已发送消息 (${messages.length})</h3>
                ${messages.length === 0 ? '<p class="text-muted">暂无消息</p>' : `
                ${messages.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 20).map(m => {
                    const u = Query.getUser(m.userId);
                    return `
                    <div style="padding:12px;background:var(--secondary);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:flex-start">
                        <div style="flex:1">
                            <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
                                <strong>${m.title}</strong>
                                <span class="badge badge-info">${m.type}</span>
                                ${m.read ? '<span class="text-muted" style="font-size:0.75rem">已读</span>' : '<span class="badge badge-danger">未读</span>'}
                            </div>
                            <div style="font-size:0.85rem;color:var(--text-light)">${m.content}</div>
                            <div class="text-muted" style="font-size:0.75rem;margin-top:4px">→ ${u?.username || '#unknown'} · ${m.time}</div>
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="deleteAdminMsg(${m.id})">删除</button>
                    </div>
                `}).join('')}
                `}
            </div>
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/messages');

    window.sendAdminMessage = () => {
        const userId = parseInt(document.getElementById('msg-user').value);
        const title = document.getElementById('msg-title').value.trim();
        const type = document.getElementById('msg-type').value;
        const content = document.getElementById('msg-content').value.trim();

        if (!title || !content) { UI.toast('请填写标题和内容', 'warning'); return; }

        if (userId === 0) {
            // 群发
            users.forEach(u => {
                DB.add(STORAGE_KEYS.MESSAGES, {
                    userId: u.id, title, type, content,
                    read: false, time: Utils.now()
                });
            });
            UI.toast(`已向 ${users.length} 个用户发送消息`, 'success');
        } else {
            DB.add(STORAGE_KEYS.MESSAGES, {
                userId, title, type, content,
                read: false, time: Utils.now()
            });
            UI.toast('消息发送成功', 'success');
        }

        document.getElementById('msg-title').value = '';
        document.getElementById('msg-content').value = '';
        Router.handleRoute();
    };

    window.deleteAdminMsg = (id) => {
        DB.remove(STORAGE_KEYS.MESSAGES, id);
        UI.toast('消息已删除', 'success');
        Router.handleRoute();
    };
};

/* ===== 管理员个人设置 ===== */
Router.adminPages['/settings'] = (app) => {
    const admin = Query.getCurrentAdmin();

    const content = `
        <div class="section">
            <div class="section-title">⚙️ 管理员个人设置</div>

            <div class="detail-section">
                <h3>👤 基本信息</h3>
                <div class="form-group">
                    <label class="form-label">用户名</label>
                    <input id="admin-username" class="form-control" value="${admin.username}" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label">姓名</label>
                    <input id="admin-name" class="form-control" value="${admin.name}">
                </div>
                <div class="form-group">
                    <label class="form-label">角色</label>
                    <input class="form-control" value="${admin.role === 'super' ? '超级管理员' : '内容管理员'}" disabled>
                </div>
                <button class="btn btn-primary" onclick="saveAdminProfile()">💾 保存修改</button>
            </div>

            <div class="detail-section">
                <h3>🔑 修改密码</h3>
                <div class="form-group">
                    <label class="form-label">原密码</label>
                    <input id="admin-oldpwd" class="form-control" type="password">
                </div>
                <div class="form-group">
                    <label class="form-label">新密码</label>
                    <input id="admin-newpwd" class="form-control" type="password">
                </div>
                <button class="btn btn-primary" onclick="changeAdminPwd()">🔄 修改密码</button>
            </div>

            <div class="detail-section" style="border-left:4px solid var(--danger)">
                <h3>⚠️ 注销管理员账号</h3>
                <p class="text-muted" style="font-size:0.85rem;margin-bottom:12px">注销后将无法再登录管理后台</p>
                <button class="btn btn-danger" onclick="cancelAdminAccount()">注销账号</button>
            </div>
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/settings');

    window.saveAdminProfile = () => {
        const name = document.getElementById('admin-name').value.trim();
        Auth.adminUpdateProfile({ name });
        UI.toast('资料已保存', 'success');
    };

    window.changeAdminPwd = () => {
        const oldPwd = document.getElementById('admin-oldpwd').value;
        const newPwd = document.getElementById('admin-newpwd').value;
        if (!oldPwd || !newPwd) { UI.toast('请填写完整', 'warning'); return; }
        if (newPwd.length < 6) { UI.toast('密码至少6位', 'warning'); return; }
        const result = Auth.adminChangePassword(oldPwd, newPwd);
        UI.toast(result.message || (result.success ? '密码已修改' : ''), result.success ? 'success' : 'error');
    };

    window.cancelAdminAccount = () => {
        UI.openModal('⚠️ 注销管理员账号',
            '<p>确定要注销账号吗？此操作不可恢复。</p>' +
            '<input id="admin-cancel-pwd" class="form-control" type="password" placeholder="请输入密码确认">',
            `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-danger" onclick="confirmCancelAdmin()">确认注销</button>`);
    };

    window.confirmCancelAdmin = () => {
        const pwd = document.getElementById('admin-cancel-pwd').value;
        const admins = DB.get(STORAGE_KEYS.ADMINS);
        const current = Query.getCurrentAdmin();
        if (pwd !== current.password) { UI.toast('密码错误', 'error'); return; }
        Auth.adminCancelAccount();
        UI.closeModal();
        UI.toast('已注销', 'info');
        Router.navigate('/admin/login');
    };
};

/* ===== 首页轮播图管理 ===== */
Router.adminPages['/home'] = (app) => {
    const banners = DB.get(STORAGE_KEYS.HOME_BANNERS).sort((a, b) => (a.sort || 0) - (b.sort || 0));
    const hero = DB.get(STORAGE_KEYS.HERO_BANNER) || { title: '', subtitle: '', bg: 'linear-gradient(135deg, #2d9b7a, #4db896)', bgImage: '' };

    const renderList = () => {
        const bs = DB.get(STORAGE_KEYS.HOME_BANNERS).sort((a, b) => (a.sort || 0) - (b.sort || 0));
        return bs.map(b => `
            <div class="banner-edit-card" style="border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:16px;background:var(--card-bg)">
                <div style="display:flex;gap:16px;align-items:flex-start">
                    <div style="width:240px;height:140px;border-radius:10px;background:${b.bg};position:relative;overflow:hidden;flex-shrink:0">
                        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.25);display:flex;flex-direction:column;justify-content:center;padding:12px;color:white">
                            <div style="font-size:0.95rem;font-weight:700">${b.title}</div>
                            <div style="font-size:0.78rem;opacity:0.9;margin-top:4px">${b.subtitle}</div>
                        </div>
                    </div>
                    <div style="flex:1">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
                            <div>
                                <label class="form-label">标题</label>
                                <input class="form-control" id="b-title-${b.id}" value="${b.title}" placeholder="如：🏫 探索校园之美">
                            </div>
                            <div>
                                <label class="form-label">排序</label>
                                <input class="form-control" id="b-sort-${b.id}" value="${b.sort || 1}" type="number" min="1">
                            </div>
                        </div>
                        <div style="margin-bottom:10px">
                            <label class="form-label">副标题</label>
                            <input class="form-control" id="b-sub-${b.id}" value="${b.subtitle}" placeholder="如：发现身边的每一处风景">
                        </div>
                        <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
                            <label class="form-label" style="min-width:80px">背景样式</label>
                            <select class="form-control" id="b-bg-${b.id}" style="max-width:280px">
                                <option value="linear-gradient(135deg, #2d9b7a, #4db896)" ${b.bg.includes('2d9b7a')?'selected':''}>🌿 清新青绿渐变</option>
                                <option value="linear-gradient(135deg, #e8a87c, #c17f59)" ${b.bg.includes('e8a87c')?'selected':''}>🍁 暖橙渐变</option>
                                <option value="linear-gradient(135deg, #5b86e5, #36d1dc)" ${b.bg.includes('5b86e5')?'selected':''}>💠 蓝青渐变</option>
                                <option value="linear-gradient(135deg, #f093fb, #f5576c)" ${b.bg.includes('f093fb')?'selected':''}>🌸 粉红渐变</option>
                                <option value="linear-gradient(135deg, #4facfe, #00f2fe)" ${b.bg.includes('4facfe')?'selected':''}>💎 天蓝渐变</option>
                                <option value="linear-gradient(135deg, #43e97b, #38f9d7)" ${b.bg.includes('43e97b')?'selected':''}>🌲 翠绿渐变</option>
                                <option value="#ffffff" ${b.bg === '#ffffff'?'selected':''}>⬜ 纯白（上传图片用）</option>
                            </select>
                            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px 12px;background:var(--secondary);border-radius:6px;font-size:0.85rem">
                                📷 上传图片
                                <input type="file" accept="image/*" onchange="uploadBannerImg(${b.id}, this)" style="display:none">
                            </label>
                        </div>
                        <div style="display:flex;gap:10px">
                            <button class="btn btn-primary btn-sm" onclick="saveBanner(${b.id})">💾 保存修改</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteBanner(${b.id})">🗑️ 删除</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        app.querySelector('.banner-list').innerHTML = renderList();
    };

    const contentHTML = `
        <div class="admin-page">
            <div class="page-header">
                <h2>🏠 首页轮播图管理</h2>
                <p class="text-muted">管理用户端首页的轮播图标题、副标题、背景样式。修改后前端刷新即可看到。</p>
            </div>

            <div class="banner-list">
                ${banners.map(b => `
                    <div class="banner-edit-card" style="border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:16px;background:var(--card-bg)">
                        <div style="display:flex;gap:16px;align-items:flex-start">
                            <div style="width:240px;height:140px;border-radius:10px;background:${b.bg};position:relative;overflow:hidden;flex-shrink:0">
                                <div style="position:absolute;inset:0;background:rgba(0,0,0,0.25);display:flex;flex-direction:column;justify-content:center;padding:12px;color:white">
                                    <div style="font-size:0.95rem;font-weight:700">${b.title}</div>
                                    <div style="font-size:0.78rem;opacity:0.9;margin-top:4px">${b.subtitle}</div>
                                </div>
                            </div>
                            <div style="flex:1">
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
                                    <div>
                                        <label class="form-label">标题</label>
                                        <input class="form-control" id="b-title-${b.id}" value="${b.title}">
                                    </div>
                                    <div>
                                        <label class="form-label">排序</label>
                                        <input class="form-control" id="b-sort-${b.id}" value="${b.sort || 1}" type="number" min="1">
                                    </div>
                                </div>
                                <div style="margin-bottom:10px">
                                    <label class="form-label">副标题</label>
                                    <input class="form-control" id="b-sub-${b.id}" value="${b.subtitle}">
                                </div>
                                <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
                                    <label class="form-label" style="min-width:80px">背景样式</label>
                                    <select class="form-control" id="b-bg-${b.id}" style="max-width:280px">
                                        <option value="linear-gradient(135deg, #2d9b7a, #4db896)" ${b.bg.includes('2d9b7a')?'selected':''}>🌿 清新青绿渐变</option>
                                        <option value="linear-gradient(135deg, #e8a87c, #c17f59)" ${b.bg.includes('e8a87c')?'selected':''}>🍁 暖橙渐变</option>
                                        <option value="linear-gradient(135deg, #5b86e5, #36d1dc)" ${b.bg.includes('5b86e5')?'selected':''}>💠 蓝青渐变</option>
                                        <option value="linear-gradient(135deg, #f093fb, #f5576c)" ${b.bg.includes('f093fb')?'selected':''}>🌸 粉红渐变</option>
                                        <option value="linear-gradient(135deg, #4facfe, #00f2fe)" ${b.bg.includes('4facfe')?'selected':''}>💎 天蓝渐变</option>
                                        <option value="linear-gradient(135deg, #43e97b, #38f9d7)" ${b.bg.includes('43e97b')?'selected':''}>🌲 翠绿渐变</option>
                                        <option value="#ffffff" ${b.bg === '#ffffff'?'selected':''}>⬜ 纯白（上传图片用）</option>
                                    </select>
                                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px 12px;background:var(--secondary);border-radius:6px;font-size:0.85rem">
                                        📷 上传图片
                                        <input type="file" accept="image/*" onchange="uploadBannerImg(${b.id}, this)" style="display:none">
                                    </label>
                                </div>
                                <div style="display:flex;gap:10px">
                                    <button class="btn btn-primary btn-sm" onclick="saveBanner(${b.id})">💾 保存修改</button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteBanner(${b.id})">🗑️ 删除</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div style="margin-top:20px;display:flex;gap:10px">
                <button class="btn btn-primary" onclick="addBanner()">➕ 新增一张轮播图</button>
                <button class="btn btn-outline" onclick="previewHome()">👁️ 预览首页效果</button>
            </div>

            <!-- Hero 横幅编辑 -->
            <div class="page-header" style="margin-top:32px">
                <h2>🎨 首页 Hero 标语横幅</h2>
                <p class="text-muted">轮播图下方的搜索标语区，可修改标题、副标题和背景。</p>
            </div>

            <div style="border:1px solid var(--border);border-radius:12px;padding:20px;background:var(--card-bg)">
                <!-- 实时预览 -->
                <div style="margin-bottom:16px">
                    <label class="form-label">👁️ 实时预览</label>
                    <div style="background:${hero.bgImage ? `url(${hero.bgImage}) center/cover no-repeat` : hero.bg};border-radius:10px;padding:32px;color:white;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,0.15)">
                        <h2 style="font-size:1.8rem;margin-bottom:8px;text-shadow:0 2px 4px rgba(0,0,0,0.3)">${hero.title || '标题预览'}</h2>
                        ${hero.subtitle ? `<p style="opacity:0.95;margin-bottom:16px">${hero.subtitle}</p>` : ''}
                        <div style="display:flex;gap:8px;justify-content:center">
                            <input style="padding:10px 16px;border-radius:20px;border:none;width:280px" placeholder="🔍 搜索景点、游记、校园故事...">
                            <button style="padding:10px 20px;border-radius:20px;border:none;background:rgba(255,255,255,0.25);color:white;font-weight:600">搜索</button>
                        </div>
                    </div>
                </div>

                <!-- 表单 -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px">
                    <div class="form-group">
                        <label class="form-label">大标题</label>
                        <input id="hero-title" class="form-control" value="${hero.title}" placeholder="如：探索属于你的校园" oninput="updateHeroPreview()">
                    </div>
                    <div class="form-group">
                        <label class="form-label">副标题（可选）</label>
                        <input id="hero-subtitle" class="form-control" value="${hero.subtitle}" placeholder="如：发现校园地标 · 记录游览足迹" oninput="updateHeroPreview()">
                    </div>
                </div>

                <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
                    <label class="form-label" style="min-width:80px">背景样式</label>
                    <select id="hero-bg" class="form-control" style="max-width:320px" onchange="updateHeroPreview()">
                        <option value="linear-gradient(135deg, #2d9b7a, #4db896)" ${hero.bg.includes('2d9b7a')?'selected':''}>🌿 清新青绿渐变</option>
                        <option value="linear-gradient(135deg, #e8a87c, #c17f59)" ${hero.bg.includes('e8a87c')?'selected':''}>🍁 暖橙渐变</option>
                        <option value="linear-gradient(135deg, #5b86e5, #36d1dc)" ${hero.bg.includes('5b86e5')?'selected':''}>💠 蓝青渐变</option>
                        <option value="linear-gradient(135deg, #f093fb, #f5576c)" ${hero.bg.includes('f093fb')?'selected':''}>🌸 粉红渐变</option>
                        <option value="linear-gradient(135deg, #4facfe, #00f2fe)" ${hero.bg.includes('4facfe')?'selected':''}>💎 天蓝渐变</option>
                        <option value="linear-gradient(135deg, #43e97b, #38f9d7)" ${hero.bg.includes('43e97b')?'selected':''}>🌲 翠绿渐变</option>
                        <option value="#1a1a2e" ${hero.bg === '#1a1a2e'?'selected':''}>🌙 深色模式</option>
                    </select>
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px 12px;background:var(--secondary);border-radius:6px;font-size:0.85rem">
                        📷 上传背景图
                        <input type="file" accept="image/*" onchange="uploadHeroBg(this)" style="display:none">
                    </label>
                    ${hero.bgImage ? '<button class="btn btn-outline btn-sm" onclick="clearHeroBg()">🗑️ 清除背景图（恢复渐变）</button>' : ''}
                </div>

                <div style="display:flex;gap:10px">
                    <button class="btn btn-primary" onclick="saveHero()">💾 保存 Hero 横幅</button>
                    <span class="text-muted" style="font-size:0.8rem;align-self:center">保存后用户端首页刷新即可看到效果</span>
                </div>
            </div>

            <div id="banner-edit-container"></div>
        </div>
    `;

    // Hero 编辑相关状态（用于 updateHeroPreview 共享）
    let heroState = {
        title: hero.title,
        subtitle: hero.subtitle,
        bg: hero.bg,
        bgImage: hero.bgImage
    };

    window.updateHeroPreview = () => {
        const t = document.getElementById('hero-title')?.value || '';
        const s = document.getElementById('hero-subtitle')?.value || '';
        const b = document.getElementById('hero-bg')?.value || '';
        heroState = { ...heroState, title: t, subtitle: s, bg: b };
    };

    window.uploadHeroBg = (input) => {
        if (!input.files || !input.files[0]) return;
        UI.cropImage(input.files[0], { aspectRatio: 3.33 }, (base64) => {
            heroState.bgImage = base64;
            heroState.bg = '#2d9b7a';
            // 立即存 DB，确保 Router.handleRoute 读的是新值
            DB.set(STORAGE_KEYS.HERO_BANNER, {
                title: heroState.title,
                subtitle: heroState.subtitle,
                bg: heroState.bg,
                bgImage: heroState.bgImage
            });
            UI.toast('背景图已裁剪并保存', 'success');
            Router.handleRoute();
        });
        input.value = '';
    };

    window.clearHeroBg = () => {
        heroState.bgImage = '';
        heroState.bg = document.getElementById('hero-bg')?.value || heroState.bg;
        DB.set(STORAGE_KEYS.HERO_BANNER, {
            title: heroState.title,
            subtitle: heroState.subtitle,
            bg: heroState.bg,
            bgImage: heroState.bgImage
        });
        UI.toast('背景图已清除', 'success');
        Router.handleRoute();
    };

    window.saveHero = () => {
        const title = document.getElementById('hero-title').value.trim();
        const subtitle = document.getElementById('hero-subtitle').value.trim();
        const bg = document.getElementById('hero-bg').value;
        if (!title) { UI.toast('标题不能为空', 'warning'); return; }
        const data = { title, subtitle, bg, bgImage: heroState.bgImage };
        DB.set(STORAGE_KEYS.HERO_BANNER, data);
        UI.toast('Hero 横幅已保存', 'success');
    };

    app.innerHTML = wrapAdminLayout(contentHTML, '/home');

    // 把 banner-list 里加一个空壳供 renderList 使用（但实际上上面已经渲染了，留着也行）
    window.saveBanner = (id) => {
        const title = document.getElementById(`b-title-${id}`).value.trim();
        const subtitle = document.getElementById(`b-sub-${id}`).value.trim();
        const bg = document.getElementById(`b-bg-${id}`).value;
        const sort = parseInt(document.getElementById(`b-sort-${id}`).value) || 1;
        if (!title) { UI.toast('标题不能为空', 'warning'); return; }
        const banners = DB.get(STORAGE_KEYS.HOME_BANNERS);
        const idx = banners.findIndex(b => b.id === id);
        if (idx >= 0) {
            banners[idx] = { ...banners[idx], title, subtitle, bg, sort };
            DB.set(STORAGE_KEYS.HOME_BANNERS, banners);
            UI.toast('保存成功', 'success');
            renderList();
        }
    };

    window.deleteBanner = (id) => {
        UI.openModal('⚠️ 确认删除',
            '<p>确定要删除这张轮播图吗？</p>',
            `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-danger" onclick="confirmDeleteBanner(${id})">确认删除</button>`);
    };

    window.confirmDeleteBanner = (id) => {
        let banners = DB.get(STORAGE_KEYS.HOME_BANNERS);
        banners = banners.filter(b => b.id !== id);
        DB.set(STORAGE_KEYS.HOME_BANNERS, banners);
        UI.closeModal();
        UI.toast('已删除', 'info');
        Router.navigate('/admin/home'); // 重渲染
    };

    window.addBanner = () => {
        UI.openModal('➕ 新增轮播图',
            `
            <div class="form-group"><label class="form-label">标题</label><input id="nb-title" class="form-control" placeholder="如：🏫 探索校园之美"></div>
            <div class="form-group"><label class="form-label">副标题</label><input id="nb-sub" class="form-control" placeholder="如：发现身边的每一处风景"></div>
            <div class="form-group"><label class="form-label">排序</label><input id="nb-sort" class="form-control" type="number" value="1"></div>
            <div class="form-group">
                <label class="form-label">背景样式</label>
                <select id="nb-bg" class="form-control">
                    <option value="linear-gradient(135deg, #2d9b7a, #4db896)">🌿 清新青绿渐变</option>
                    <option value="linear-gradient(135deg, #e8a87c, #c17f59)">🍁 暖橙渐变</option>
                    <option value="linear-gradient(135deg, #5b86e5, #36d1dc)">💠 蓝青渐变</option>
                    <option value="linear-gradient(135deg, #f093fb, #f5576c)">🌸 粉红渐变</option>
                    <option value="linear-gradient(135deg, #4facfe, #00f2fe)">💎 天蓝渐变</option>
                    <option value="linear-gradient(135deg, #43e97b, #38f9d7)">🌲 翠绿渐变</option>
                </select>
            </div>`,
            `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-primary" onclick="confirmAddBanner()">创建</button>`);
    };

    window.confirmAddBanner = () => {
        const title = document.getElementById('nb-title').value.trim();
        const subtitle = document.getElementById('nb-sub').value.trim();
        const bg = document.getElementById('nb-bg').value;
        const sort = parseInt(document.getElementById('nb-sort').value) || 1;
        if (!title) { UI.toast('标题不能为空', 'warning'); return; }
        const banners = DB.get(STORAGE_KEYS.HOME_BANNERS);
        const newId = banners.length ? Math.max(...banners.map(b => b.id)) + 1 : 1;
        banners.push({ id: newId, title, subtitle, bg, sort });
        DB.set(STORAGE_KEYS.HOME_BANNERS, banners);
        UI.closeModal();
        UI.toast('新增成功', 'success');
        Router.navigate('/admin/home');
    };

    window.uploadBannerImg = (id, input) => {
        const file = input.files[0];
        if (!file) return;
        UI.cropImage(file, { aspectRatio: 3.33 }, (imgBase64) => {
            const banners = DB.get(STORAGE_KEYS.HOME_BANNERS);
            const idx = banners.findIndex(b => b.id === id);
            if (idx >= 0) {
                banners[idx].bg = `url(${imgBase64}) center/cover no-repeat`;
                DB.set(STORAGE_KEYS.HOME_BANNERS, banners);
                UI.toast('图片裁剪并保存成功', 'success');
                Router.navigate('/admin/home');
            }
        });
        input.value = '';
    };

    window.previewHome = () => {
        UI.openModal('👁️ 首页轮播图预览',
            `<div id="banner-preview" style="display:flex;flex-direction:column;gap:12px">
                ${DB.get(STORAGE_KEYS.HOME_BANNERS).sort((a,b)=>(a.sort||0)-(b.sort||0)).map(b => `
                    <div style="height:100px;border-radius:10px;background:${b.bg};display:flex;align-items:center;padding:0 20px;color:white;position:relative;overflow:hidden">
                        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.2)"></div>
                        <div style="position:relative;z-index:1">
                            <div style="font-size:1rem;font-weight:700">${b.title}</div>
                            <div style="font-size:0.8rem;opacity:0.9;margin-top:2px">${b.subtitle}</div>
                        </div>
                    </div>
                `).join('')}
            </div>`,
            `<button class="btn btn-primary" onclick="UI.closeModal()">关闭</button>`);
    };
};
