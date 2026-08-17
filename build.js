const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function buildDirectory(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    let folders = [];
    let files = [];

    items.forEach(item => {
        if (item.name === 'index.html' || item.name.startsWith('.')) return;
        
        const itemPath = path.join(dirPath, item.name);
        // Correct path concatenation for the web
        const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
        const stat = fs.statSync(itemPath);

        if (item.isDirectory()) {
            folders.push({
                name: item.name,
                path: `/${itemRelativePath}`
            });
            // Recursively build subdirectories
            buildDirectory(itemPath, itemRelativePath);
        } else {
            const ext = path.extname(item.name).toLowerCase();
            const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico'].includes(ext);
            const isVideo = ['.mp4', '.webm', '.ogg'].includes(ext);
            
            files.push({
                name: item.name,
                path: `/${itemRelativePath}`,
                size: formatBytes(stat.size),
                isImage,
                isVideo,
                ext
            });
        }
    });

    generateHtml(dirPath, relativePath, folders, files);
}

function generateHtml(dirPath, relativePath, folders, files) {
    const parentPath = relativePath ? '/' + relativePath.split('/').slice(0, -1).join('/') : null;
    const displayPath = relativePath ? `/${relativePath}` : '/';

    let breadcrumbsHtml = '';
    if (relativePath) {
        breadcrumbsHtml = '<span>/</span> ' + relativePath.split('/').map((part, i, arr) => {
            return `<a href="/${arr.slice(0, i+1).join('/')}">${part}</a>`;
        }).join(' <span>/</span> ');
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assets - ${displayPath}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0f172a;
            --surface: #1e293b;
            --surface-hover: #334155;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent: #3b82f6;
            --accent-hover: #60a5fa;
            --border: #334155;
        }
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background-color: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border);
            padding: 1.25rem 2rem;
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .breadcrumb {
            font-size: 1.15rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        .breadcrumb a {
            color: var(--accent);
            text-decoration: none;
            transition: color 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
        }
        .breadcrumb a:hover {
            color: var(--accent-hover);
            text-decoration: underline;
        }
        .breadcrumb span {
            color: var(--text-muted);
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            flex: 1;
            width: 100%;
            box-sizing: border-box;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 1.5rem;
        }
        .card {
            background-color: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
            display: flex;
            flex-direction: column;
            text-decoration: none;
            color: inherit;
            position: relative;
        }
        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            border-color: var(--accent);
        }
        .preview {
            height: 180px;
            background-color: #0b1121;
            display: flex;
            align-items: center;
            justify-content: center;
            border-bottom: 1px solid var(--border);
            overflow: hidden;
            position: relative;
            background-image: radial-gradient(var(--border) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        .preview img, .preview video {
            width: 100%;
            height: 100%;
            object-fit: contain;
            transition: transform 0.3s ease;
        }
        .card:hover .preview img {
            transform: scale(1.05);
        }
        .preview svg {
            width: 56px;
            height: 56px;
            color: var(--text-muted);
        }
        .info {
            padding: 1.25rem;
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .name {
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 0.5rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--text-main);
        }
        .meta {
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-top: auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0,0,0,0.2);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
        }
        .actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 1.25rem;
        }
        .btn {
            padding: 0.6rem 0.75rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            flex: 1;
            text-align: center;
            text-decoration: none;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
        }
        .btn-primary {
            background-color: var(--accent);
            color: white;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }
        .btn-primary:hover {
            background-color: var(--accent-hover);
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
        }
        .btn-copy {
            background-color: var(--surface-hover);
            color: var(--text-main);
        }
        .btn-copy:hover {
            background-color: #475569;
        }
        .section-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin: 2rem 0 1.25rem 0;
            color: var(--text-main);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .section-title:first-child {
            margin-top: 0;
        }
        
        .toast {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: var(--accent);
            color: white;
            padding: 14px 28px;
            border-radius: 50px;
            box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            font-weight: 600;
            z-index: 100;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        
        .empty-state {
            text-align: center;
            padding: 5rem 2rem;
            color: var(--text-muted);
            background: var(--surface);
            border-radius: 16px;
            border: 1px dashed var(--border);
        }
        
        /* Badges */
        .badge {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(4px);
            color: white;
            font-size: 0.7rem;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border: 1px solid rgba(255,255,255,0.1);
        }

        .folder-card {
            background: linear-gradient(145deg, var(--surface), var(--bg-color));
        }
        .folder-card:hover {
            background: linear-gradient(145deg, var(--surface-hover), var(--surface));
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="breadcrumb">
            <a href="/">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                assets.emberquest.in
            </a>
            ${breadcrumbsHtml}
        </div>
        <div>
            <div style="background: rgba(16, 185, 129, 0.1); color: #34d399; padding: 6px 12px; border-radius: 50px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(16, 185, 129, 0.2);">
                <div style="width: 6px; height: 6px; background: #34d399; border-radius: 50%; box-shadow: 0 0 8px #34d399;"></div>
                Global CDN Edge
            </div>
        </div>
    </div>

    <div class="container">
        ${parentPath !== null ? `
            <a href="${parentPath === '' ? '/' : parentPath}" style="display: inline-flex; align-items: center; gap: 0.5rem; color: var(--text-muted); text-decoration: none; margin-bottom: 2rem; font-weight: 500; background: var(--surface); padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); transition: all 0.2s;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back to parent folder
            </a>
        ` : ''}

        ${folders.length === 0 && files.length === 0 ? `
            <div class="empty-state">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; opacity: 0.5;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; color: var(--text-main);">Folder is empty</h3>
                <p style="margin: 0;">Add files to this directory to see them rendered instantly worldwide.</p>
            </div>
        ` : ''}

        ${folders.length > 0 ? `
            <div class="section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                Folders (${folders.length})
            </div>
            <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                ${folders.map(folder => `
                    <a href="${folder.path}" class="card folder-card" style="flex-direction: row; align-items: center; padding: 1.25rem;">
                        <div style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 10px; margin-right: 1rem;">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <div class="name" style="margin:0; font-size: 1.1rem;">${folder.name}</div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: auto;"><path d="M9 18l6-6-6-6"/></svg>
                    </a>
                `).join('')}
            </div>
        ` : ''}

        ${files.length > 0 ? `
            <div class="section-title" style="${folders.length > 0 ? 'margin-top: 3.5rem;' : ''}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                Assets (${files.length})
            </div>
            <div class="grid">
                ${files.map(file => `
                    <div class="card">
                        <a href="${file.path}" target="_blank" class="preview">
                            <div class="badge">${file.ext.replace('.', '') || 'FILE'}</div>
                            ${file.isImage 
                                ? `<img src="${file.path}" alt="${file.name}" loading="lazy">`
                                : file.isVideo
                                    ? `<video src="${file.path}" style="max-height: 100%; max-width: 100%;" muted playsinline></video>`
                                    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`
                            }
                        </a>
                        <div class="info">
                            <div class="name" title="${file.name}">${file.name}</div>
                            <div class="meta">
                                <span>${file.size}</span>
                                <a href="${file.path}" download="${file.name}" style="color: var(--accent); text-decoration: none;" title="Download">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                </a>
                            </div>
                            <div class="actions">
                                <a href="${file.path}" target="_blank" class="btn btn-primary">
                                    Open
                                </a>
                                <button class="btn btn-copy" onclick="copyUrl('${file.path}')">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                    Copy URL
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    </div>

    <div class="toast" id="toast">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        URL Copied!
    </div>

    <script>
        function copyUrl(path) {
            const url = window.location.origin + path;
            navigator.clipboard.writeText(url).then(() => {
                const toast = document.getElementById('toast');
                toast.classList.add('show');
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 3000);
            });
        }
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(dirPath, 'index.html'), html);
}

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

console.log('Building static assets interface...');
buildDirectory(publicDir);
console.log('Build complete! Your CDN interface is ready.');
