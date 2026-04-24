module.exports = {
  docsSidebar: [
    'index',
    'product-overview',
    'mvp-scope',
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
      items: ['delivery/roadmap', 'delivery/backlog', 'delivery/task-state']
    }
  ]
};
