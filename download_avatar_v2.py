#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
明日方舟干员头像批量下载器 v2
使用 MediaWiki API
"""

import requests
import os
import time
import re
from urllib.parse import unquote
from concurrent.futures import ThreadPoolExecutor, as_completed

class AvatarCrawlerV2:
    def __init__(self, save_dir="operator_avatars"):
        self.save_dir = save_dir
        self.api_url = "https://prts.wiki/api.php"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        os.makedirs(save_dir, exist_ok=True)
    
    def get_category_members(self, category, limit=500):
        """
        获取分类中的所有文件
        """
        print(f"正在获取分类 '{category}' 中的文件...")
        
        params = {
            'action': 'query',
            'list': 'categorymembers',
            'cmtitle': f'Category:{category}',
            'cmlimit': limit,
            'cmtype': 'file',
            'format': 'json'
        }
        
        try:
            response = self.session.get(self.api_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            members = data.get('query', {}).get('categorymembers', [])
            return members
        except Exception as e:
            print(f"✗ API请求失败: {e}")
            return []
    
    def get_file_url(self, filename):
        """
        获取文件的实际下载URL
        """
        params = {
            'action': 'query',
            'titles': filename,
            'prop': 'imageinfo',
            'iiprop': 'url',
            'format': 'json'
        }
        
        try:
            response = self.session.get(self.api_url, params=params, timeout=30)
            data = response.json()
            pages = data.get('query', {}).get('pages', {})
            
            for page in pages.values():
                imageinfo = page.get('imageinfo', [])
                if imageinfo:
                    return imageinfo[0].get('url')
        except Exception as e:
            print(f"✗ 获取文件URL失败: {e}")
        
        return None
    
    def download_image(self, url, filename):
        """
        下载单张图片
        """
        try:
            filepath = os.path.join(self.save_dir, filename)
            
            if os.path.exists(filepath):
                print(f"⊙ 已存在: {filename}")
                return True
            
            print(f"📥 下载中: {filename}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            size_kb = len(response.content) / 1024
            print(f"✓ 成功: {filename} ({size_kb:.1f} KB)")
            return True
            
        except Exception as e:
            print(f"✗ 失败: {filename} - {e}")
            return False
    
    def download_all_avatars(self, max_workers=5):
        """
        下载所有干员头像
        """
        print("=" * 60)
        print("明日方舟干员头像批量下载器 v2")
        print("=" * 60)
        print()
        
        # 获取分类中的所有文件
        members = self.get_category_members('干员头像')
        
        if not members:
            print("\n⚠️  未找到文件，尝试搜索所有包含'头像'的文件...")
            members = self.search_avatar_files()
        
        if not members:
            print("✗ 未找到任何头像文件")
            return
        
        print(f"\n找到 {len(members)} 个头像文件")
        print(f"保存目录: {os.path.abspath(self.save_dir)}\n")
        
        # 获取文件URL并下载
        tasks = []
        for member in members:
            title = member.get('title', '')
            if title.startswith('File:') or title.startswith('文件:'):
                tasks.append(title)
        
        print(f"准备下载 {len(members)} 个文件...\n")
        
        success_count = 0
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {}
            
            for member in members:
                # 如果member中已有URL，直接使用
                if 'url' in member:
                    url = member['url']
                    filename = member.get('name', '')
                else:
                    # 否则通过API获取
                    title = member.get('title', '')
                    if not (title.startswith('File:') or title.startswith('文件:')):
                        continue
                    url = self.get_file_url(title)
                    filename = title.replace('File:', '').replace('文件:', '')
                
                if url and filename:
                    # 清理文件名
                    filename = unquote(filename)
                    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
                    
                    future = executor.submit(self.download_image, url, filename)
                    futures[future] = filename
            
            # 等待完成
            for future in as_completed(futures):
                if future.result():
                    success_count += 1
        
        print("\n" + "=" * 60)
        print(f"下载完成！成功: {success_count}/{len(tasks)}")
        print("=" * 60)
    
    def search_avatar_files(self):
        """
        搜索包含'头像'的文件（支持分页）
        """
        print("正在搜索所有头像文件...")
        
        avatar_images = []
        continue_token = None
        
        while True:
            params = {
                'action': 'query',
                'list': 'allimages',
                'aifrom': '头像',
                'ailimit': 500,
                'format': 'json'
            }
            
            if continue_token:
                params['aicontinue'] = continue_token
            
            try:
                response = self.session.get(self.api_url, params=params, timeout=30)
                data = response.json()
                
                all_images = data.get('query', {}).get('allimages', [])
                
                # 收集所有包含"头像"的图片
                for img in all_images:
                    name = img.get('name', '')
                    url = img.get('url', '')
                    
                    # 只获取以"头像_"开头的文件
                    if name.startswith('头像_'):
                        avatar_images.append({
                            'title': f"File:{name}",
                            'name': name,
                            'url': url,
                            'ns': 6
                        })
                    elif not name.startswith('头像'):
                        # 如果遇到不是以"头像"开头的文件，说明已经超出范围
                        return avatar_images
                
                # 检查是否有更多结果
                if 'continue' in data and 'aicontinue' in data['continue']:
                    continue_token = data['continue']['aicontinue']
                    print(f"已找到 {len(avatar_images)} 个头像，继续获取...")
                else:
                    break
                    
            except Exception as e:
                print(f"搜索失败: {e}")
                break
        
        return avatar_images


def main():
    crawler = AvatarCrawlerV2(save_dir="operator_avatars")
    crawler.download_all_avatars(max_workers=5)


if __name__ == "__main__":
    main()






