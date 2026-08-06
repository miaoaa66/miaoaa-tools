/**
 * 常用模板配置
 * 每个模板包含名称和字段定义列表
 * 字段定义：{ name, type, rules }
 */
export const templates = [
  {
    name: '用户',
    fields: [
      { name: 'id', type: 'id', rules: {} },
      { name: 'name', type: 'name', rules: {} },
      { name: 'email', type: 'email', rules: {} },
      { name: 'phone', type: 'phone', rules: {} },
      { name: 'gender', type: 'enum', rules: { options: ['男', '女'] } },
      { name: 'age', type: 'number', rules: { min: 18, max: 60 } },
      { name: 'address', type: 'address', rules: {} },
      { name: 'createdAt', type: 'date', rules: { format: 'YYYY-MM-DD' } },
    ],
  },
  {
    name: '订单',
    fields: [
      { name: 'id', type: 'id', rules: {} },
      { name: 'orderNo', type: 'orderNo', rules: {} },
      { name: 'userId', type: 'number', rules: { min: 1001, max: 9999 } },
      { name: 'userName', type: 'name', rules: {} },
      {
        name: 'totalAmount',
        type: 'number',
        rules: { min: 10, max: 9999, decimal: 2 },
      },
      {
        name: 'status',
        type: 'enum',
        rules: { options: ['待支付', '已支付', '已发货', '已完成', '已取消'] },
      },
      { name: 'createdAt', type: 'date', rules: { format: 'YYYY-MM-DD HH:mm:ss' } },
    ],
  },
  {
    name: '文章',
    fields: [
      { name: 'id', type: 'id', rules: {} },
      { name: 'title', type: 'title', rules: {} },
      { name: 'summary', type: 'text', rules: { min: 20, max: 100 } },
      { name: 'author', type: 'name', rules: {} },
      { name: 'tags', type: 'tags', rules: {} },
      {
        name: 'category',
        type: 'enum',
        rules: { options: ['前端', '后端', 'AI', '运维', '产品'] },
      },
      { name: 'views', type: 'number', rules: { min: 10, max: 99999 } },
      { name: 'likes', type: 'number', rules: { min: 0, max: 9999 } },
      { name: 'createdAt', type: 'date', rules: { format: 'YYYY-MM-DD' } },
    ],
  },
  {
    name: '课程',
    fields: [
      { name: 'id', type: 'id', rules: {} },
      { name: 'title', type: 'title', rules: {} },
      { name: 'description', type: 'text', rules: { min: 30, max: 200 } },
      { name: 'teacher', type: 'name', rules: {} },
      { name: 'duration', type: 'number', rules: { min: 1, max: 200, decimal: 1 } },
      { name: 'price', type: 'number', rules: { min: 0, max: 999, decimal: 2 } },
      { name: 'students', type: 'number', rules: { min: 0, max: 9999 } },
      {
        name: 'level',
        type: 'enum',
        rules: { options: ['初级', '中级', '高级'] },
      },
    ],
  },
  {
    name: '通知',
    fields: [
      { name: 'id', type: 'id', rules: {} },
      { name: 'title', type: 'title', rules: {} },
      { name: 'content', type: 'text', rules: { min: 20, max: 150 } },
      {
        name: 'type',
        type: 'enum',
        rules: { options: ['系统通知', '活动通知', '安全提醒', '更新通知'] },
      },
      { name: 'sender', type: 'name', rules: {} },
      {
        name: 'priority',
        type: 'enum',
        rules: { options: ['低', '中', '高', '紧急'] },
      },
      { name: 'isRead', type: 'boolean', rules: {} },
      { name: 'createdAt', type: 'date', rules: { format: 'YYYY-MM-DD HH:mm:ss' } },
    ],
  },
  {
    name: '日志',
    fields: [
      { name: 'id', type: 'id', rules: {} },
      { name: 'timestamp', type: 'date', rules: { format: 'YYYY-MM-DD HH:mm:ss' } },
      {
        name: 'level',
        type: 'enum',
        rules: { options: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] },
      },
      { name: 'module', type: 'module', rules: {} },
      { name: 'message', type: 'text', rules: { min: 10, max: 100 } },
      { name: 'userId', type: 'number', rules: { min: 1001, max: 9999 } },
      { name: 'ip', type: 'ip', rules: {} },
      { name: 'duration', type: 'number', rules: { min: 1, max: 5000 } },
    ],
  },
]