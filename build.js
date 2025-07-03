import fs from 'fs';
import { mkdir, rm } from 'fs/promises';
import path from 'path';
import esbuild from 'esbuild';
import archiver from 'archiver';

async function clearDir(path) {
    try {
        await rm(path, { recursive: true, force: true });
        await mkdir(path, { recursive: true });
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }
}

async function createZip(tempDir, zipPath) {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // 显示压缩进度
    archive.on('progress', (progress) => {
        console.log(`压缩中: ${progress.entries.processed} 个文件已处理`);
    });

    return new Promise((resolve, reject) => {
        output.on('close', () => {
            console.log(`压缩完成，总共 ${archive.pointer()} 字节`);
            resolve(void 0);
        });
        archive.on('error', (err) => {
            console.error('压缩失败:', err);
            reject(err);
        });
        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.warn('警告:', err);
            } else {
                console.error('压缩警告:', err);
                reject(err);
            }
        });
        archive.pipe(output);

        // 添加manifest.json
        archive.file('manifest.json', { name: 'manifest.json' });

        // 添加编译后的JS文件
        archive.file(path.join(tempDir, 'background.js'), { name: 'background.js' });
        archive.file(path.join(tempDir, 'popup.js'), { name: 'popup.js' });

        // 添加CSS文件
        archive.file('style.css', { name: 'style.css' });

        // 添加HTML文件
        archive.file('index.html', { name: 'index.html' });

        // 添加整个icons目录
        archive.directory('icons', 'icons');

        // 添加_locales目录
        archive.directory('_locales', '_locales');

        archive.finalize();
    });
}

async function buildExtension() {
    const tempDir = 'temp';
    const distDir = 'dist';
    try {
        // 清理目录
        clearDir(tempDir);
        clearDir(distDir);

        // 编译TypeScript文件
        await esbuild.build({
            entryPoints: ['background.ts', 'popup.ts'],
            bundle: true,
            outdir: tempDir,
            platform: 'browser',
            format: 'iife',
            target: ['chrome90', 'firefox90', 'safari14', 'edge90'],
            globalName: 'browser'
        });

        await createZip(tempDir, path.join(distDir, 'extension.zip'));
        console.log('构建完成！扩展已打包为extension.zip');
    } catch (err) {
        console.error('构建失败:', err);
        process.exit(1);
    }
}

buildExtension();
