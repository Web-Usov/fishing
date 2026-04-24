module.exports = {
  docsSidebar: [
    'index',
    {
      type: 'category',
      label: 'Product',
      items: ['product-start', 'product-overview', 'mvp-scope', 'delivery/roadmap']
    },
    {
      type: 'category',
      label: 'Develop',
      items: [
    'develop-start',
    'architecture',
    'shared-code-plan',
    {
      type: 'category',
      label: 'Сервисы',
      items: ['services/api', 'services/web', 'services/mobile', 'services/admin', 'services/docs', 'services/postgres']
    },
    {
      type: 'category',
      label: 'Планирование и delivery',
      items: ['delivery/backlog', 'delivery/task-state']
    }
      ]
    }
  ]
};
