import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "SpecV Automations",
  description: "Web Platform Engineering Handbook",
  base: "/handbook/",
  cleanUrls: true,
  appearance: 'force-dark',

  themeConfig: {
    siteTitle: "SPECV // DOCS-02",

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: 'On This Page'
    },

    sidebar: [
      {
        text: 'System Architecture',
        items: [
          { text: 'A. Perimeter Topology', link: '/part-a' },
          { text: 'B. Stack Lexicon', link: '/part-b' },
          { text: 'C. Policy and Rules', link: '/part-c' }
        ]
      },
      {
        text: 'Workspace & Pipeline',
        items: [
          { text: 'D. Workspace Setup', link: '/part-d' },
          { text: 'E. Git & PR Lifecycle', link: '/part-e' },
          { text: 'F. Project Contract', link: '/part-f' },
          { text: 'G. Secrets & Variables', link: '/part-g' }
        ]
      },
      {
        text: 'Runtime & Data',
        items: [
          { text: 'H. Database Operations', link: '/part-h' },
          { text: 'I. Memory & Performance', link: '/part-i' },
          { text: 'J. Security Baseline', link: '/part-j' }
        ]
      },
      {
        text: 'Engineering Operations',
        items: [
          { text: 'K. Daily Workflow', link: '/part-k' },
          { text: 'L. Verification & Testing', link: '/part-l' },
          { text: 'M. Diagnostic Matrix', link: '/part-m' },
          { text: 'N. DevOps Requests', link: '/part-n' },
          { text: 'O. Reference Cheat Sheets', link: '/part-o' }
        ]
      }
    ]
  }
})