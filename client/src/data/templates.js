/**
 * ============================================================================
 * PRE-BUILT TEMPLATE LIBRARY
 * ============================================================================
 * Ready-to-use frameworks for agile teams, system architecture,
 * mind mapping, and UX user research.
 */

export const TEMPLATES = [
  {
    id: 'agile-retro',
    name: 'Agile Sprint Retrospective',
    category: 'Agile & Planning',
    description: 'Start / Stop / Continue sprint ceremony with structured sticky note columns.',
    icon: 'MessageSquare',
    generateElements: (startX = 100, startY = 100) => [
      // Column 1: What Went Well
      {
        id: 'col-1-bg',
        type: 'rectangle',
        x: startX,
        y: startY,
        width: 320,
        height: 480,
        fillColor: 'rgba(187, 247, 208, 0.25)',
        strokeColor: '#10b981',
        strokeWidth: 2,
        borderRadius: 8
      },
      {
        id: 'col-1-header',
        type: 'text',
        x: startX + 16,
        y: startY + 16,
        text: '🟢 WHAT WENT WELL',
        fontSize: 18,
        textColor: '#065f46'
      },
      {
        id: 'note-1-1',
        type: 'sticky',
        x: startX + 24,
        y: startY + 64,
        width: 270,
        height: 120,
        fillColor: '#bbf7d0',
        text: 'Shipped real-time canvas engine ahead of sprint schedule!',
        textColor: '#064e3b',
        fontSize: 16
      },
      {
        id: 'note-1-2',
        type: 'sticky',
        x: startX + 24,
        y: startY + 200,
        width: 270,
        height: 120,
        fillColor: '#bbf7d0',
        text: 'Great pair programming on WebSocket protocol.',
        textColor: '#064e3b',
        fontSize: 16
      },

      // Column 2: What Didn't Go Well
      {
        id: 'col-2-bg',
        type: 'rectangle',
        x: startX + 360,
        y: startY,
        width: 320,
        height: 480,
        fillColor: 'rgba(254, 202, 202, 0.25)',
        strokeColor: '#ef4444',
        strokeWidth: 2,
        borderRadius: 8
      },
      {
        id: 'col-2-header',
        type: 'text',
        x: startX + 376,
        y: startY + 16,
        text: '🔴 WHAT COULD IMPROVE',
        fontSize: 18,
        textColor: '#991b1b'
      },
      {
        id: 'note-2-1',
        type: 'sticky',
        x: startX + 384,
        y: startY + 64,
        width: 270,
        height: 120,
        fillColor: '#fecaca',
        text: 'Need clearer schema freezing between front & back.',
        textColor: '#7f1d1d',
        fontSize: 16
      },

      // Column 3: Action Items
      {
        id: 'col-3-bg',
        type: 'rectangle',
        x: startX + 720,
        y: startY,
        width: 320,
        height: 480,
        fillColor: 'rgba(191, 219, 254, 0.25)',
        strokeColor: '#3b82f6',
        strokeWidth: 2,
        borderRadius: 8
      },
      {
        id: 'col-3-header',
        type: 'text',
        x: startX + 736,
        y: startY + 16,
        text: '🔵 ACTION ITEMS',
        fontSize: 18,
        textColor: '#1e40af'
      },
      {
        id: 'note-3-1',
        type: 'sticky',
        x: startX + 744,
        y: startY + 64,
        width: 270,
        height: 120,
        fillColor: '#bfdbfe',
        text: 'Automate Docker compose health checks in CI.',
        textColor: '#1e3a8a',
        fontSize: 16
      }
    ]
  },
  {
    id: 'kanban-flow',
    name: 'Kanban Workflow Board',
    category: 'Agile & Planning',
    description: 'Backlog, In Progress, Review, and Done lanes for sprint task delivery.',
    icon: 'Kanban',
    generateElements: (startX = 100, startY = 100) => {
      const lanes = ['Backlog', 'In Progress', 'Code Review', 'Done'];
      const elements = [];
      lanes.forEach((lane, i) => {
        const laneX = startX + i * 290;
        elements.push({
          id: `kanban-lane-${i}`,
          type: 'rectangle',
          x: laneX,
          y: startY,
          width: 270,
          height: 520,
          fillColor: 'rgba(241, 245, 249, 0.5)',
          strokeColor: '#94a3b8',
          strokeWidth: 2,
          borderRadius: 8
        });
        elements.push({
          id: `kanban-title-${i}`,
          type: 'text',
          x: laneX + 16,
          y: startY + 16,
          text: lane.toUpperCase(),
          fontSize: 16,
          textColor: '#334155'
        });
      });
      // Initial tasks
      elements.push({
        id: 'kanban-task-1',
        type: 'sticky',
        x: startX + 16,
        y: startY + 60,
        width: 238,
        height: 100,
        fillColor: '#fef08a',
        text: 'Set up JWT Token Rotation with HttpOnly cookies',
        textColor: '#713f12',
        fontSize: 15
      });
      elements.push({
        id: 'kanban-task-2',
        type: 'sticky',
        x: startX + 306,
        y: startY + 60,
        width: 238,
        height: 100,
        fillColor: '#bfdbfe',
        text: 'Implement 60fps pan/zoom matrix renderer',
        textColor: '#1e3a8a',
        fontSize: 15
      });
      return elements;
    }
  },
  {
    id: 'system-arch',
    name: 'Cloud Microservices Architecture',
    category: 'Engineering & Diagrams',
    description: 'Client browser, API Gateway, Auth Microservice, Redis Cache, and Database.',
    icon: 'Network',
    generateElements: (startX = 100, startY = 150) => [
      // Client
      {
        id: 'arch-client',
        type: 'rectangle',
        x: startX,
        y: startY + 60,
        width: 180,
        height: 80,
        fillColor: '#e0f2fe',
        strokeColor: '#0284c7',
        strokeWidth: 2,
        borderRadius: 8,
        text: 'Client App (React)'
      },
      // API Gateway
      {
        id: 'arch-gateway',
        type: 'diamond',
        x: startX + 260,
        y: startY + 40,
        width: 140,
        height: 120,
        fillColor: '#fef3c7',
        strokeColor: '#d97706',
        strokeWidth: 2,
        text: 'API Gateway'
      },
      // Backend API
      {
        id: 'arch-backend',
        type: 'rectangle',
        x: startX + 480,
        y: startY + 60,
        width: 200,
        height: 80,
        fillColor: '#ede9fe',
        strokeColor: '#7c3aed',
        strokeWidth: 2,
        borderRadius: 8,
        text: 'Express + Socket.io'
      },
      // Redis Cache
      {
        id: 'arch-redis',
        type: 'ellipse',
        x: startX + 480,
        y: startY - 90,
        width: 200,
        height: 70,
        fillColor: '#fee2e2',
        strokeColor: '#dc2626',
        strokeWidth: 2,
        text: 'Redis Pub/Sub Cache'
      },
      // Database
      {
        id: 'arch-db',
        type: 'ellipse',
        x: startX + 480,
        y: startY + 210,
        width: 200,
        height: 70,
        fillColor: '#dcfce7',
        strokeColor: '#16a34a',
        strokeWidth: 2,
        text: 'MongoDB Persistence'
      },
      // Connectors
      {
        id: 'conn-1',
        type: 'connector',
        startX: startX + 180,
        startY: startY + 100,
        endX: startX + 260,
        endY: startY + 100,
        strokeColor: '#0284c7',
        strokeWidth: 2
      },
      {
        id: 'conn-2',
        type: 'connector',
        startX: startX + 400,
        startY: startY + 100,
        endX: startX + 480,
        endY: startY + 100,
        strokeColor: '#7c3aed',
        strokeWidth: 2
      },
      {
        id: 'conn-3',
        type: 'connector',
        startX: startX + 580,
        startY: startY + 60,
        endX: startX + 580,
        endY: startY - 20,
        strokeColor: '#dc2626',
        strokeWidth: 2
      },
      {
        id: 'conn-4',
        type: 'connector',
        startX: startX + 580,
        startY: startY + 140,
        endX: startX + 580,
        endY: startY + 210,
        strokeColor: '#16a34a',
        strokeWidth: 2
      }
    ]
  },
  {
    id: 'user-journey',
    name: 'UX Customer Journey Map',
    category: 'Product & Design',
    description: 'Track user stages: Discover, Evaluate, Onboard, and Retain with pain points & sticky notes.',
    icon: 'MessageSquare',
    generateElements: (startX = 100, startY = 100) => {
      const stages = ['1. Discover', '2. Evaluate', '3. Onboard', '4. Retain'];
      const elements = [];
      stages.forEach((stage, i) => {
        const laneX = startX + i * 280;
        elements.push({
          id: `stage-${i}`,
          type: 'rectangle',
          x: laneX,
          y: startY,
          width: 260,
          height: 480,
          fillColor: 'rgba(238, 242, 255, 0.4)',
          strokeColor: '#6366f1',
          strokeWidth: 2,
          borderRadius: 8
        });
        elements.push({
          id: `stage-title-${i}`,
          type: 'text',
          x: laneX + 16,
          y: startY + 16,
          text: stage,
          fontSize: 16,
          textColor: '#3730a3'
        });
      });
      // User pain points
      elements.push({
        id: 'uj-note-1',
        type: 'sticky',
        x: startX + 16,
        y: startY + 64,
        width: 228,
        height: 100,
        fillColor: '#bfdbfe',
        text: 'User lands on marketing page via search.',
        textColor: '#1e3a8a',
        fontSize: 15
      });
      elements.push({
        id: 'uj-note-2',
        type: 'sticky',
        x: startX + 296,
        y: startY + 64,
        width: 228,
        height: 100,
        fillColor: '#fef08a',
        text: 'Tries interactive demo canvas with 0 signup.',
        textColor: '#713f12',
        fontSize: 15
      });
      elements.push({
        id: 'uj-note-3',
        type: 'sticky',
        x: startX + 576,
        y: startY + 64,
        width: 228,
        height: 100,
        fillColor: '#bbf7d0',
        text: 'Invites 3 teammates to collaborative whiteboard.',
        textColor: '#064e3b',
        fontSize: 15
      });
      return elements;
    }
  },
  {
    id: 'mind-map',
    name: 'Radial Brainstorming Mind Map',
    category: 'Brainstorming & Strategy',
    description: 'Central concept with radiating dynamic connectors and color-coded ideas.',
    icon: 'Network',
    generateElements: (startX = 300, startY = 250) => [
      // Central Node
      {
        id: 'mm-center',
        type: 'ellipse',
        x: startX,
        y: startY,
        width: 220,
        height: 100,
        fillColor: '#e0e7ff',
        strokeColor: '#4f46e5',
        strokeWidth: 3,
        text: 'Product Strategy'
      },
      // Branch 1: Growth
      {
        id: 'mm-branch-1',
        type: 'rectangle',
        x: startX + 320,
        y: startY - 100,
        width: 170,
        height: 60,
        fillColor: '#dcfce7',
        strokeColor: '#16a34a',
        strokeWidth: 2,
        borderRadius: 8,
        text: 'Viral Growth Loops'
      },
      // Branch 2: Monetization
      {
        id: 'mm-branch-2',
        type: 'rectangle',
        x: startX + 320,
        y: startY + 120,
        width: 170,
        height: 60,
        fillColor: '#fef3c7',
        strokeColor: '#d97706',
        strokeWidth: 2,
        borderRadius: 8,
        text: 'Enterprise Tiers'
      },
      // Branch 3: Performance
      {
        id: 'mm-branch-3',
        type: 'rectangle',
        x: startX - 280,
        y: startY,
        width: 180,
        height: 60,
        fillColor: '#fee2e2',
        strokeColor: '#dc2626',
        strokeWidth: 2,
        borderRadius: 8,
        text: 'Sub-50ms Latency'
      },
      // Connectors
      {
        id: 'mm-conn-1',
        type: 'connector',
        startX: startX + 220,
        startY: startY + 50,
        endX: startX + 320,
        endY: startY - 70,
        strokeColor: '#16a34a',
        strokeWidth: 2
      },
      {
        id: 'mm-conn-2',
        type: 'connector',
        startX: startX + 220,
        startY: startY + 50,
        endX: startX + 320,
        endY: startY + 150,
        strokeColor: '#d97706',
        strokeWidth: 2
      },
      {
        id: 'mm-conn-3',
        type: 'connector',
        startX: startX,
        startY: startY + 50,
        endX: startX - 100,
        endY: startY + 30,
        strokeColor: '#dc2626',
        strokeWidth: 2
      }
    ]
  }
];

