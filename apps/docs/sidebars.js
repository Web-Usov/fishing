module.exports = {
  docsSidebar: [
    'index',
    {
      type: 'category',
      label: 'Product',
      items: ['product-start', 'product-overview', 'mvp-scope', 'domain-model', 'bite-forecast-model', 'catch-journal']
    },
    {
      type: 'category',
      label: 'Develop',
      items: [
    'develop-start',
    'architecture',
    'shared-code-plan',
    'agent-workflow/omo-playbook',
    'agent-workflow/clean-code',
    'agent-workflow/clean-architecture',
    {
      type: 'category',
      label: 'Сервисы',
      items: ['services/api', 'services/web', 'services/mobile', 'services/admin', 'services/docs', 'services/postgres']
    },
    {
      type: 'category',
      label: 'Планирование и delivery',
      items: [
        'delivery/roadmap',
        'delivery/plans/index',
        'delivery/plans/templates',
        {
          type: 'category',
          label: 'Текущие планы',
          items: [
            'delivery/plans/2026-05-clean-standards-remediation/PLAN',
            'delivery/plans/2026-05-clean-standards-remediation/REVIEW',
            'delivery/plans/2026-05-forecast-production-hardening/PLAN',
            'delivery/plans/2026-05-forecast-production-hardening/REVIEW'
          ]
        }
      ]
    }
      ]
    }
  ]
};
