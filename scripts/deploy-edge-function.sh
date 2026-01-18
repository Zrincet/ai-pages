#!/bin/bash

# 阿里云 ESA 边缘函数部署辅助脚本
# 用途：格式化显示边缘函数代码，方便手动复制到 ESA 控制台

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 边缘函数文件路径
EDGE_FUNCTION_FILE="edge-functions/html-storage.js"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  阿里云 ESA 边缘函数部署辅助工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查文件是否存在
if [ ! -f "$EDGE_FUNCTION_FILE" ]; then
    echo -e "${RED}错误：找不到边缘函数文件 $EDGE_FUNCTION_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 找到边缘函数文件${NC}"
echo ""

# 显示文件信息
FILE_SIZE=$(wc -c < "$EDGE_FUNCTION_FILE" | tr -d ' ')
LINE_COUNT=$(wc -l < "$EDGE_FUNCTION_FILE" | tr -d ' ')

echo -e "${YELLOW}文件信息：${NC}"
echo -e "  路径: $EDGE_FUNCTION_FILE"
echo -e "  大小: $FILE_SIZE 字节"
echo -e "  行数: $LINE_COUNT 行"
echo ""

# 显示部署步骤
echo -e "${YELLOW}部署步骤：${NC}"
echo ""
echo -e "1. ${GREEN}登录阿里云 ESA 控制台${NC}"
echo -e "   https://esa.console.aliyun.com/"
echo ""
echo -e "2. ${GREEN}创建或编辑边缘函数${NC}"
echo -e "   - 左侧菜单：边缘计算 → 函数和 Pages"
echo -e "   - 点击"创建函数"或选择已有函数"
echo ""
echo -e "3. ${GREEN}复制以下代码${NC}"
echo -e "   - 完整复制下方显示的代码"
echo -e "   - 粘贴到 ESA 控制台的代码编辑器中"
echo ""
echo -e "4. ${GREEN}保存并发布${NC}"
echo -e "   - 点击"保存""
echo -e "   - 点击"发布到测试环境""
echo -e "   - 测试通过后"发布到生产环境""
echo ""

# 询问是否显示代码
echo -e "${YELLOW}是否显示边缘函数代码？(y/n)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  边缘函数代码 (开始)${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # 显示代码（带行号）
    cat -n "$EDGE_FUNCTION_FILE"
    
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  边缘函数代码 (结束)${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
fi

# 提供复制命令
echo -e "${YELLOW}快捷操作：${NC}"
echo ""
echo -e "1. ${GREEN}复制代码到剪贴板 (macOS)：${NC}"
echo -e "   cat $EDGE_FUNCTION_FILE | pbcopy"
echo ""
echo -e "2. ${GREEN}复制代码到剪贴板 (Linux with xclip)：${NC}"
echo -e "   cat $EDGE_FUNCTION_FILE | xclip -selection clipboard"
echo ""
echo -e "3. ${GREEN}直接查看代码：${NC}"
echo -e "   cat $EDGE_FUNCTION_FILE"
echo ""

# 重要提示
echo -e "${RED}重要提示：${NC}"
echo ""
echo -e "1. ${YELLOW}确保已在 ESA 控制台创建 EdgeKV Namespace: ${GREEN}html_pages${NC}"
echo -e "2. ${YELLOW}确保代码中的 NAMESPACE 常量与实际创建的一致${NC}"
echo -e "3. ${YELLOW}配置路由规则：${NC}"
echo -e "   - /api/storage → 存储 HTML"
echo -e "   - /pages/* → 访问 HTML"
echo -e "4. ${YELLOW}测试边缘函数：${NC}"
echo -e "   - 使用 curl 或 Postman 测试 API"
echo -e "   - 查看边缘函数日志确认运行状态"
echo ""

# 检查是否有 pbcopy（macOS）
if command -v pbcopy &> /dev/null; then
    echo -e "${YELLOW}检测到 macOS 系统，是否自动复制代码到剪贴板？(y/n)${NC}"
    read -r copy_response
    
    if [[ "$copy_response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        cat "$EDGE_FUNCTION_FILE" | pbcopy
        echo -e "${GREEN}✓ 代码已复制到剪贴板！${NC}"
        echo -e "${GREEN}  直接在 ESA 控制台粘贴即可 (Cmd+V)${NC}"
        echo ""
    fi
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  准备就绪！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "详细部署文档: ${BLUE}docs/DEPLOYMENT.md${NC}"
echo -e "ESA 配置指南: ${BLUE}docs/ESA_SETUP.md${NC}"
echo ""
