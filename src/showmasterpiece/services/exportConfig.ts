/**
 * ShowMasterpiece 模块 - 导出配置
 * 
 * 定义预订信息的导出字段配置
 */

import type { ExportField } from '@/universalExport';

/**
 * 预订信息导出字段定义
 */
export const BOOKING_EXPORT_FIELDS: ExportField[] = [
  {
    key: 'id',
    label: '预订ID',
    type: 'number',
    enabled: true,
    required: true,
    description: '预订记录的唯一标识',
    alignment: 'center',
  },
  {
    key: 'collectionId',
    label: '画集ID',
    type: 'number',
    enabled: true,
    required: true,
    description: '画集的唯一标识',
    alignment: 'center',
  },
  {
    key: 'qqNumber',
    label: 'QQ号',
    type: 'string',
    enabled: true,
    required: false,
    description: '用户的QQ号码',
    alignment: 'left',
  },
  {
    key: 'phoneNumber',
    label: '手机号',
    type: 'string',
    enabled: true,
    required: false,
    description: '用户的手机号码',
    alignment: 'left',
  },

  {
    key: 'collectionTitle',
    label: '画集标题',
    type: 'string',
    enabled: true,
    required: true,
    description: '预订的画集标题',
    alignment: 'left',
  },
  {
    key: 'collectionNumber',
    label: '画集编号',
    type: 'string',
    enabled: true,
    required: true,
    description: '画集的编号',
    alignment: 'left',
  },
  {
    key: 'collectionPrice',
    label: '画集价格',
    type: 'number',
    enabled: true,
    required: true,
    description: '画集的价格',
    alignment: 'right',
    formatter: (value: any) => `¥${Number(value).toFixed(2)}`,
  },
  {
    key: 'status',
    label: '预订状态',
    type: 'string',
    enabled: true,
    required: true,
    description: '预订的当前状态',
    alignment: 'center',
    formatter: (value: any) => {
      const statusMap: Record<string, string> = {
        pending: '待确认',
        confirmed: '已确认',
        completed: '已完成',
        cancelled: '已取消',
      };
      return statusMap[value] || value;
    },
  },
  {
    key: 'quantity',
    label: '预订数量',
    type: 'number',
    enabled: true,
    required: true,
    description: '预订的数量',
    alignment: 'center',
  },
  {
    key: 'price',
    label: '单价',
    type: 'number',
    enabled: true,
    required: true,
    description: '单个画集的价格',
    alignment: 'right',
    formatter: (value: any) => `¥${Number(value).toFixed(2)}`,
  },
  {
    key: 'totalPrice',
    label: '总价格',
    type: 'number',
    enabled: true,
    required: true,
    description: '总价格（单价 × 数量）',
    alignment: 'right',
    formatter: (value: any) => `¥${Number(value).toFixed(2)}`,
  },
  {
    key: 'notes',
    label: '用户备注',
    type: 'string',
    enabled: true,
    required: false,
    description: '用户提交的备注信息',
    alignment: 'left',
  },
  {
    key: 'pickupMethod',
    label: '领取方式',
    type: 'string',
    enabled: true,
    required: false,
    description: '用户选择的领取方式',
    alignment: 'left',
  },
  {
    key: 'adminNotes',
    label: '管理员备注',
    type: 'string',
    enabled: true,
    required: false,
    description: '管理员添加的备注信息',
    alignment: 'left',
  },

  {
    key: 'createdAt',
    label: '创建时间',
    type: 'date',
    enabled: true,
    required: true,
    description: '预订创建的时间',
    alignment: 'center',
    formatter: (value: any) => {
      if (!value) return '';
      const date = new Date(value);
      return date.toLocaleString('zh-CN');
    },
  },
  {
    key: 'updatedAt',
    label: '更新时间',
    type: 'date',
    enabled: true,
    required: true,
    description: '预订最后更新的时间',
    alignment: 'center',
    formatter: (value: any) => {
      if (!value) return '';
      const date = new Date(value);
      return date.toLocaleString('zh-CN');
    },
  },
  {
    key: 'confirmedAt',
    label: '确认时间',
    type: 'date',
    enabled: true,
    required: false,
    description: '预订确认的时间',
    alignment: 'center',
    formatter: (value: any) => {
      if (!value) return '';
      const date = new Date(value);
      return date.toLocaleString('zh-CN');
    },
  },
  {
    key: 'completedAt',
    label: '完成时间',
    type: 'date',
    enabled: true,
    required: false,
    description: '预订完成的时间',
    alignment: 'center',
    formatter: (value: any) => {
      if (!value) return '';
      const date = new Date(value);
      return date.toLocaleString('zh-CN');
    },
  },
  {
    key: 'cancelledAt',
    label: '取消时间',
    type: 'date',
    enabled: true,
    required: false,
    description: '预订取消的时间',
    alignment: 'center',
    formatter: (value: any) => {
      if (!value) return '';
      const date = new Date(value);
      return date.toLocaleString('zh-CN');
    },
  },
  {
    key: 'userTotalPrice',
    label: '用户总价',
    type: 'number',
    enabled: false, // 默认不启用，需要勾选才启用
    required: false,
    description: '根据QQ号和手机号统一匹配的该用户所有预订商品的总价格',
    alignment: 'right',
    formatter: (value: any) => `¥${Number(value || 0).toFixed(2)}`,
  },
];

/**
 * 默认导出配置
 */
export const DEFAULT_BOOKING_EXPORT_CONFIG = {
  id: 'default_booking_export',
  name: '预订信息导出',
  description: '导出所有预订信息为Excel格式，支持QQ号和手机号合并单元格',
  format: 'excel' as const,
  fields: BOOKING_EXPORT_FIELDS,
  grouping: {
    enabled: true,
    fields: [
      {
        key: 'phoneNumber',
        label: '手机号',
        mode: 'merge' as const,
        valueProcessing: 'first' as const,
        showGroupHeader: false,
        mergeCells: true
      },
      {
        key: 'qqNumber',
        label: 'QQ号',
        mode: 'merge' as const,
        valueProcessing: 'first' as const,
        showGroupHeader: false,
        mergeCells: true
      },
      {
        key: 'userTotalPrice',
        label: '用户总价',
        mode: 'merge' as const,
        valueProcessing: 'first' as const,
        showGroupHeader: false,
        mergeCells: true
      }
    ],
    preserveOrder: true,
    nullValueHandling: 'separate' as const,
  },
  fileNameTemplate: '预订信息_{date}',
  includeHeader: true,
  delimiter: ',',
  encoding: 'utf-8',
  addBOM: true,
  maxRows: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  moduleId: 'showmasterpiece',
  businessId: 'bookings',
}; 
