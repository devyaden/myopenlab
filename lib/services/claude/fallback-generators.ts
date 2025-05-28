import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";
import { getColorPalette, getTextColorForBackground } from "./prompts";
import { CanvasData, NodeData } from "./types";

// Add a type definition for language translations
type LabelTranslations = {
  [key in LanguageType]: {
    [key: string]: string;
  };
};

// Common translations for all diagram types
const commonTranslations: LabelTranslations = {
  [LanguageType.ENGLISH]: {
    // General terms
    start: "Start",
    end: "End",
    main: "Main",
    process: "Process",
    decision: "Decision",
    data: "Data",
    entrance: "Entrance",
    registration: "Registration",
    exit: "Exit",
    yes: "Yes",
    no: "No",
    // Event visitor experience terms
    hall: "Hall",
    area: "Area",
    space: "Space",
    booth: "Booth",
    tech: "Tech",
    networking: "Networking",
    refreshment: "Refreshment",
    workshop: "Workshop",
    visitor: "Visitor",
    business: "Business",
    technical: "Technical",
    // Hierarchy terms
    ceo: "CEO",
    cto: "CTO",
    cfo: "CFO",
    coo: "COO",
    lead: "Lead",
    manager: "Manager",
    engineering: "Engineering",
    product: "Product",
    finance: "Finance",
    operations: "Operations",
    // Website wireframe terms
    header: "Header",
    footer: "Footer",
    navigation: "Navigation",
    content: "Content",
    section: "Section",
    button: "Button",
    search: "Search",
    logo: "Logo",
    // Workflow terms
    receive: "Receive",
    validate: "Validate",
    request: "Request",
    send: "Send",
    notification: "Notification",
    wait: "Wait",
    response: "Response",
    approve: "Approve",
    generate: "Generate",
    report: "Report",
    confirmation: "Confirmation",
    log: "Log",
    activity: "Activity",
    topic: "Topic",
    subtopic: "Subtopic",
    central: "Central",
    idea: "Idea",
  },
  [LanguageType.SPANISH]: {
    // General terms
    start: "Inicio",
    end: "Fin",
    main: "Principal",
    process: "Proceso",
    decision: "Decisión",
    data: "Datos",
    entrance: "Entrada",
    registration: "Registro",
    exit: "Salida",
    yes: "Sí",
    no: "No",
    // Event visitor experience terms
    hall: "Salón",
    area: "Área",
    space: "Espacio",
    booth: "Stand",
    tech: "Tecnología",
    networking: "Networking",
    refreshment: "Refrigerio",
    workshop: "Taller",
    visitor: "Visitante",
    business: "Negocios",
    technical: "Técnico",
    // Hierarchy terms
    ceo: "Director General",
    cto: "Director Técnico",
    cfo: "Director Financiero",
    coo: "Director de Operaciones",
    lead: "Líder",
    manager: "Gerente",
    engineering: "Ingeniería",
    product: "Producto",
    finance: "Finanzas",
    operations: "Operaciones",
    // Website wireframe terms
    header: "Encabezado",
    footer: "Pie de página",
    navigation: "Navegación",
    content: "Contenido",
    section: "Sección",
    button: "Botón",
    search: "Búsqueda",
    logo: "Logo",
    // Workflow terms
    receive: "Recibir",
    validate: "Validar",
    request: "Solicitar",
    send: "Enviar",
    notification: "Notificación",
    wait: "Esperar",
    response: "Respuesta",
    approve: "Aprobar",
    generate: "Generar",
    report: "Informe",
    confirmation: "Confirmación",
    log: "Registro",
    activity: "Actividad",
    topic: "Tema",
    subtopic: "Subtema",
    central: "Central",
    idea: "Idea",
  },
  [LanguageType.FRENCH]: {
    // General terms
    start: "Début",
    end: "Fin",
    main: "Principal",
    process: "Processus",
    decision: "Décision",
    data: "Données",
    entrance: "Entrée",
    registration: "Inscription",
    exit: "Sortie",
    yes: "Oui",
    no: "Non",
    // Event visitor experience terms
    hall: "Salle",
    area: "Zone",
    space: "Espace",
    booth: "Stand",
    tech: "Tech",
    networking: "Réseautage",
    refreshment: "Rafraîchissement",
    workshop: "Atelier",
    visitor: "Visiteur",
    business: "Affaires",
    technical: "Technique",
    // Add other translations...
    ceo: "PDG",
    cto: "Directeur Technique",
    cfo: "Directeur Financier",
    coo: "Directeur des Opérations",
    lead: "Responsable",
    manager: "Gestionnaire",
    engineering: "Ingénierie",
    product: "Produit",
    finance: "Finance",
    operations: "Opérations",
    // Website wireframe terms
    header: "En-tête",
    footer: "Pied de page",
    navigation: "Navigation",
    content: "Contenu",
    section: "Section",
    button: "Bouton",
    search: "Recherche",
    logo: "Logo",
    // Workflow terms
    receive: "Recevoir",
    validate: "Valider",
    request: "Demander",
    send: "Envoyer",
    notification: "Notification",
    wait: "Attendre",
    response: "Réponse",
    approve: "Approuver",
    generate: "Générer",
    report: "Rapport",
    confirmation: "Confirmation",
    log: "Journal",
    activity: "Activité",
    topic: "Sujet",
    subtopic: "Sous-sujet",
    central: "Central",
    idea: "Idée",
  },
  [LanguageType.GERMAN]: {
    // General terms
    start: "Start",
    end: "Ende",
    main: "Haupt",
    process: "Prozess",
    decision: "Entscheidung",
    data: "Daten",
    entrance: "Eingang",
    registration: "Anmeldung",
    exit: "Ausgang",
    yes: "Ja",
    no: "Nein",
    // Event visitor experience terms
    hall: "Halle",
    area: "Bereich",
    space: "Raum",
    booth: "Stand",
    tech: "Technik",
    networking: "Netzwerken",
    refreshment: "Erfrischung",
    workshop: "Workshop",
    visitor: "Besucher",
    business: "Geschäft",
    technical: "Technisch",
    // Add other terms as needed...
    ceo: "Geschäftsführer",
    cto: "Technischer Direktor",
    cfo: "Finanzdirektor",
    coo: "Betriebsleiter",
    lead: "Leiter",
    manager: "Manager",
    engineering: "Technik",
    product: "Produkt",
    finance: "Finanzen",
    operations: "Betrieb",
    // Website wireframe terms
    header: "Kopfzeile",
    footer: "Fußzeile",
    navigation: "Navigation",
    content: "Inhalt",
    section: "Abschnitt",
    button: "Knopf",
    search: "Suche",
    logo: "Logo",
    // Workflow terms
    receive: "Empfangen",
    validate: "Validieren",
    request: "Anfragen",
    send: "Senden",
    notification: "Benachrichtigung",
    wait: "Warten",
    response: "Antwort",
    approve: "Genehmigen",
    generate: "Generieren",
    report: "Bericht",
    confirmation: "Bestätigung",
    log: "Protokoll",
    activity: "Aktivität",
    topic: "Thema",
    subtopic: "Unterthema",
    central: "Zentral",
    idea: "Idee",
  },
  [LanguageType.PORTUGUESE]: {
    // General terms
    start: "Início",
    end: "Fim",
    main: "Principal",
    process: "Processo",
    decision: "Decisão",
    data: "Dados",
    entrance: "Entrada",
    registration: "Registro",
    exit: "Saída",
    yes: "Sim",
    no: "Não",
    // Event visitor experience terms
    hall: "Salão",
    area: "Área",
    space: "Espaço",
    booth: "Estande",
    tech: "Tecnologia",
    networking: "Networking",
    refreshment: "Refrescos",
    workshop: "Oficina",
    visitor: "Visitante",
    business: "Negócios",
    technical: "Técnico",
    // Add other terms...
    ceo: "Diretor Executivo",
    cto: "Diretor de Tecnologia",
    cfo: "Diretor Financeiro",
    coo: "Diretor de Operações",
    lead: "Líder",
    manager: "Gerente",
    engineering: "Engenharia",
    product: "Produto",
    finance: "Finanças",
    operations: "Operações",
    // Website wireframe terms
    header: "Cabeçalho",
    footer: "Rodapé",
    navigation: "Navegação",
    content: "Conteúdo",
    section: "Seção",
    button: "Botão",
    search: "Pesquisa",
    logo: "Logo",
    // Workflow terms
    receive: "Receber",
    validate: "Validar",
    request: "Solicitar",
    send: "Enviar",
    notification: "Notificação",
    wait: "Aguardar",
    response: "Resposta",
    approve: "Aprovar",
    generate: "Gerar",
    report: "Relatório",
    confirmation: "Confirmação",
    log: "Registro",
    activity: "Atividade",
    topic: "Tópico",
    subtopic: "Subtópico",
    central: "Central",
    idea: "Ideia",
  },
  [LanguageType.JAPANESE]: {
    // General terms
    start: "開始",
    end: "終了",
    main: "メイン",
    process: "プロセス",
    decision: "判断",
    data: "データ",
    entrance: "入口",
    registration: "登録",
    exit: "出口",
    yes: "はい",
    no: "いいえ",
    // Event visitor experience terms
    hall: "ホール",
    area: "エリア",
    space: "スペース",
    booth: "ブース",
    tech: "技術",
    networking: "ネットワーキング",
    refreshment: "軽食",
    workshop: "ワークショップ",
    visitor: "訪問者",
    business: "ビジネス",
    technical: "技術的",
    // Add other terms...
    ceo: "最高経営責任者",
    cto: "最高技術責任者",
    cfo: "最高財務責任者",
    coo: "最高執行責任者",
    lead: "リーダー",
    manager: "マネージャー",
    engineering: "エンジニアリング",
    product: "製品",
    finance: "財務",
    operations: "運営",
    // Website wireframe terms
    header: "ヘッダー",
    footer: "フッター",
    navigation: "ナビゲーション",
    content: "コンテンツ",
    section: "セクション",
    button: "ボタン",
    search: "検索",
    logo: "ロゴ",
    // Workflow terms
    receive: "受け取る",
    validate: "検証する",
    request: "リクエスト",
    send: "送信する",
    notification: "通知",
    wait: "待機",
    response: "応答",
    approve: "承認",
    generate: "生成",
    report: "レポート",
    confirmation: "確認",
    log: "ログ",
    activity: "活動",
    topic: "トピック",
    subtopic: "サブトピック",
    central: "中心",
    idea: "アイデア",
  },
  [LanguageType.CHINESE]: {
    // General terms
    start: "开始",
    end: "结束",
    main: "主要",
    process: "流程",
    decision: "决策",
    data: "数据",
    entrance: "入口",
    registration: "注册",
    exit: "出口",
    yes: "是",
    no: "否",
    // Event visitor experience terms
    hall: "大厅",
    area: "区域",
    space: "空间",
    booth: "展台",
    tech: "技术",
    networking: "社交",
    refreshment: "茶点",
    workshop: "工作坊",
    visitor: "访客",
    business: "商务",
    technical: "技术",
    // Add other terms...
    ceo: "首席执行官",
    cto: "首席技术官",
    cfo: "首席财务官",
    coo: "首席运营官",
    lead: "主管",
    manager: "经理",
    engineering: "工程",
    product: "产品",
    finance: "财务",
    operations: "运营",
    // Website wireframe terms
    header: "页眉",
    footer: "页脚",
    navigation: "导航",
    content: "内容",
    section: "部分",
    button: "按钮",
    search: "搜索",
    logo: "标志",
    // Workflow terms
    receive: "接收",
    validate: "验证",
    request: "请求",
    send: "发送",
    notification: "通知",
    wait: "等待",
    response: "响应",
    approve: "批准",
    generate: "生成",
    report: "报告",
    confirmation: "确认",
    log: "日志",
    activity: "活动",
    topic: "主题",
    subtopic: "子主题",
    central: "中心",
    idea: "想法",
  },
  [LanguageType.ARABIC]: {
    // General terms
    start: "بداية",
    end: "نهاية",
    main: "رئيسي",
    process: "عملية",
    decision: "قرار",
    data: "بيانات",
    entrance: "مدخل",
    registration: "تسجيل",
    exit: "مخرج",
    yes: "نعم",
    no: "لا",
    // Event visitor experience terms
    hall: "قاعة",
    area: "منطقة",
    space: "مساحة",
    booth: "جناح",
    tech: "تقنية",
    networking: "تواصل",
    refreshment: "مرطبات",
    workshop: "ورشة عمل",
    visitor: "زائر",
    business: "أعمال",
    technical: "تقني",
    // Add other terms...
    ceo: "الرئيس التنفيذي",
    cto: "مدير التكنولوجيا",
    cfo: "المدير المالي",
    coo: "مدير العمليات",
    lead: "قائد",
    manager: "مدير",
    engineering: "هندسة",
    product: "منتج",
    finance: "مالية",
    operations: "عمليات",
    // Website wireframe terms
    header: "رأس الصفحة",
    footer: "تذييل الصفحة",
    navigation: "تنقل",
    content: "محتوى",
    section: "قسم",
    button: "زر",
    search: "بحث",
    logo: "شعار",
    // Workflow terms
    receive: "استلام",
    validate: "تحقق",
    request: "طلب",
    send: "إرسال",
    notification: "إشعار",
    wait: "انتظار",
    response: "استجابة",
    approve: "موافقة",
    generate: "إنشاء",
    report: "تقرير",
    confirmation: "تأكيد",
    log: "سجل",
    activity: "نشاط",
    topic: "موضوع",
    subtopic: "موضوع فرعي",
    central: "مركزي",
    idea: "فكرة",
  },
};

// Helper function to get a translated label
function getTranslatedLabel(key: string, language: LanguageType): string {
  // Default to English if the language is not supported
  if (!commonTranslations[language]) {
    return key;
  }

  // Return the translated term if available, or English version, or the key itself
  if (commonTranslations[language][key]) {
    return commonTranslations[language][key];
  } else if (commonTranslations[LanguageType.ENGLISH][key]) {
    return commonTranslations[LanguageType.ENGLISH][key];
  } else {
    return key;
  }
}

/**
 * Generates fallback data when Claude fails to produce valid diagram data
 */
export function generateFallbackData(
  diagramType: DiagramType,
  industry: IndustryType,
  prompt: string,
  language: LanguageType = LanguageType.ENGLISH
): CanvasData {
  console.log("Generating fallback data for prompt:", prompt);

  const title =
    prompt && prompt.length > 3
      ? prompt.slice(0, 30)
      : `Default ${diagramType} Diagram`;

  // Create a timestamp-based unique ID
  const timestamp = Date.now();

  // Base fallback nodes and edges based on diagram type
  let nodes: any[] = [];
  let edges: any[] = [];
  let nodeStyles: Record<string, any> = {};

  // Generate nodes based on diagram type
  switch (diagramType) {
    case DiagramType.WORKFLOW:
      nodes = generateWorkflowNodes(title, timestamp);

      // For RTL languages like Arabic, mirror the workflow layout
      if (language === LanguageType.ARABIC) {
        // Find the maximum x position to calculate mirroring
        const maxX = nodes.reduce(
          (max, node) => Math.max(max, node.position.x + (node.width || 150)),
          0
        );

        // Reverse the horizontal position for RTL
        nodes = nodes.map((node) => ({
          ...node,
          position: {
            ...node.position,
            x: maxX - node.position.x - (node.width || 150),
          },
          data: {
            ...node.data,
            label: getTranslatedLabel(node.data.label.toLowerCase(), language),
          },
        }));
      }
      break;
    case DiagramType.WEBSITE_WIREFRAME:
      nodes = generateWireframeNodes(title, timestamp);
      break;
    case DiagramType.EVENT_VISITOR_EXPERIENCE:
      nodes = generateEventExperienceNodes(title, timestamp, language);
      break;
    case DiagramType.HIERARCHY:
      nodes = generateHierarchyNodes(title, timestamp, language);
      break;
    case DiagramType.MINDMAP:
      nodes = generateMindMapNodes(title, timestamp, language);
      break;
    default:
      nodes = generateWorkflowNodes(title, timestamp);
  }

  // Generate edges between nodes
  edges = generateEdgesForNodes(nodes, diagramType, language);

  // Generate node styles
  nodeStyles = generateNodeStyles(nodes, industry);

  return {
    nodes,
    edges,
    nodeStyles,
    diagramType,
    industry,
    language,
  };
}

/**
 * Generates edges between nodes based on diagram type and relative node positions
 */
export function generateEdgesForNodes(
  nodes: any[],
  diagramType: DiagramType,
  language: LanguageType = LanguageType.ENGLISH
) {
  const edges: any[] = [];
  const isRTL = language === LanguageType.ARABIC;

  // Skip edge generation for wireframes
  if (diagramType === DiagramType.WEBSITE_WIREFRAME) {
    return edges;
  }

  // For event visitor experience, use specialized edge generator
  if (diagramType === DiagramType.EVENT_VISITOR_EXPERIENCE) {
    return generateEventVisitorEdges(nodes);
  }

  // For mind maps, connect from center to other nodes
  if (diagramType === DiagramType.MINDMAP && nodes.length > 1) {
    const centerNode = nodes[0];

    for (let i = 1; i < nodes.length; i++) {
      const targetNode = nodes[i];

      // Determine appropriate handles based on relative positions
      let sourceHandle = isRTL ? "h" : "g"; // Default to right side in LTR, left side in RTL
      let targetHandle = isRTL ? "c" : "d"; // Default to left side in LTR, right side in RTL

      // Check if target is to the left of center
      if (
        (targetNode.position.x < centerNode.position.x && !isRTL) ||
        (targetNode.position.x > centerNode.position.x && isRTL)
      ) {
        sourceHandle = isRTL ? "g" : "h"; // Left side of source
        targetHandle = isRTL ? "d" : "c"; // Right side of target
      }

      edges.push({
        id: `edge-${centerNode.id}-${targetNode.id}`,
        source: centerNode.id,
        target: targetNode.id,
        sourceHandle,
        targetHandle,
        type: "smoothstep",
        style: {
          strokeWidth: 2,
        },
      });
    }

    return edges;
  }

  // For workflows, connect subsequent nodes
  if (diagramType === DiagramType.WORKFLOW && nodes.length > 1) {
    // Sort nodes by x and y position to determine flow
    // For RTL languages, we sort in reverse for x position
    const sortedNodes = [...nodes].sort((a, b) => {
      // For RTL direction, we want right to left (higher x to lower x)
      const xComparison = isRTL
        ? b.position.x - a.position.x
        : a.position.x - b.position.x;

      // If nodes are roughly in the same column, sort by y position
      if (Math.abs(a.position.x - b.position.x) < 50) {
        return a.position.y - b.position.y;
      }
      return xComparison;
    });

    // Create main workflow edges
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const sourceNode = sortedNodes[i];
      const targetNode = sortedNodes[i + 1];

      // Skip if this is a decision branch (target is below source)
      if (targetNode.position.y > sourceNode.position.y + 100) {
        continue;
      }

      edges.push({
        id: `edge-main-${sourceNode.id}-${targetNode.id}`,
        source: sourceNode.id,
        target: targetNode.id,
        sourceHandle: isRTL ? "h" : "g", // Left in RTL, right in LTR
        targetHandle: isRTL ? "c" : "d", // Right in RTL, left in LTR
        type: "smoothstep",
        style: {
          strokeWidth: 2,
          stroke: "#1E40AF",
          opacity: 1.0,
        },
        animated: true,
        markerEnd: {
          type: "arrowclosed",
        },
      });
    }

    // Create decision branches
    const decisionNodes = nodes.filter((node) => node.data.shape === "diamond");

    for (const decisionNode of decisionNodes) {
      // Find nodes below this decision node (for "No" path)
      const branchNodes = nodes.filter(
        (node) =>
          node.position.y > decisionNode.position.y + 100 &&
          Math.abs(node.position.x - decisionNode.position.x) < 200
      );

      if (branchNodes.length > 0) {
        const closestBranch = branchNodes.reduce((closest, current) =>
          Math.abs(current.position.x - decisionNode.position.x) <
          Math.abs(closest.position.x - decisionNode.position.x)
            ? current
            : closest
        );

        edges.push({
          id: `edge-branch-${decisionNode.id}-${closestBranch.id}`,
          source: decisionNode.id,
          target: closestBranch.id,
          sourceHandle: "f", // Bottom
          targetHandle: "a", // Top
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: "#DC2626",
            strokeDasharray: "5,5",
            opacity: 1.0,
          },
          animated: true,
          markerEnd: {
            type: "arrowclosed",
          },
        });

        // Connect branch back to main flow if possible
        const mainFlowNodes = nodes.filter(
          (node) =>
            Math.abs(node.position.y - decisionNode.position.y) < 50 &&
            node.position.x > decisionNode.position.x + 200
        );

        if (mainFlowNodes.length > 0) {
          const returnTarget = mainFlowNodes[0];
          edges.push({
            id: `edge-return-${closestBranch.id}-${returnTarget.id}`,
            source: closestBranch.id,
            target: returnTarget.id,
            sourceHandle: isRTL ? "h" : "g",
            targetHandle: isRTL ? "c" : "d",
            type: "smoothstep",
            style: {
              strokeWidth: 2,
              stroke: "#059669",
              opacity: 1.0,
            },
            animated: true,
            markerEnd: {
              type: "arrowclosed",
            },
          });
        }
      }
    }

    return edges;
  }

  // For hierarchies, connect with proper handle positions respecting RTL if needed
  if (diagramType === DiagramType.HIERARCHY) {
    for (let i = 0; i < nodes.length - 1; i++) {
      // For hierarchical diagrams, find parent-child relationships based on vertical positioning
      const sourceNode = nodes[i];

      // Find all children (nodes that are below this node)
      const childNodes = nodes.filter(
        (node) =>
          node.position.y > sourceNode.position.y + sourceNode.height &&
          Math.abs(node.position.x - sourceNode.position.x) < 300 // Within reasonable horizontal distance
      );

      for (const childNode of childNodes) {
        // For hierarchy diagrams, we primarily use vertical connections
        // but may adjust horizontal handles based on RTL setting
        let sourceHandle = "f"; // Bottom of source
        let targetHandle = "a"; // Top of target

        // For nodes significantly offset horizontally, add RTL awareness
        if (Math.abs(childNode.position.x - sourceNode.position.x) > 100) {
          if (
            (childNode.position.x > sourceNode.position.x && !isRTL) ||
            (childNode.position.x < sourceNode.position.x && isRTL)
          ) {
            // Child is to the right in LTR or to the left in RTL
            sourceHandle = isRTL ? "h" : "g";
            targetHandle = isRTL ? "c" : "d";
          } else {
            // Child is to the left in LTR or to the right in RTL
            sourceHandle = isRTL ? "g" : "h";
            targetHandle = isRTL ? "d" : "c";
          }
        }

        edges.push({
          id: `edge-${sourceNode.id}-${childNode.id}`,
          source: sourceNode.id,
          target: childNode.id,
          sourceHandle,
          targetHandle,
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            opacity: 1.0,
          },
          markerEnd: {
            type: "arrowclosed",
          },
        });
      }
    }

    // If no edges were created, fall back to sequential connections
    if (edges.length === 0) {
      for (let i = 0; i < nodes.length - 1; i++) {
        const sourceNode = nodes[i];
        const targetNode = nodes[i + 1];

        edges.push({
          id: `edge-${sourceNode.id}-${targetNode.id}`,
          source: sourceNode.id,
          target: targetNode.id,
          sourceHandle: "f", // bottom of source
          targetHandle: "a", // top of target
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            opacity: 1.0,
          },
          markerEnd: {
            type: "arrowclosed",
          },
        });
      }
    }

    return edges;
  }

  return edges;
}

/**
 * Generates workflow nodes for fallback
 */
export function generateWorkflowNodes(
  title: string,
  timestamp: number
): NodeData[] {
  // Create a professional workflow with better spacing and layout
  return [
    {
      id: `node-${timestamp}-1`,
      type: "genericNode",
      position: { x: 50, y: 50 },
      data: { label: "Project Initiation", shape: "rounded" },
      width: 180,
      height: 90,
    },
    {
      id: `node-${timestamp}-2`,
      type: "genericNode",
      position: { x: 300, y: 50 },
      data: { label: "Requirements Analysis", shape: "rectangle" },
      width: 180,
      height: 90,
    },
    {
      id: `node-${timestamp}-3`,
      type: "genericNode",
      position: { x: 550, y: 50 },
      data: { label: "Design Documentation", shape: "document" },
      width: 180,
      height: 90,
    },
    {
      id: `node-${timestamp}-4`,
      type: "genericNode",
      position: { x: 800, y: 50 },
      data: { label: "Approval Required?", shape: "diamond" },
      width: 180,
      height: 120,
    },
    {
      id: `node-${timestamp}-5`,
      type: "genericNode",
      position: { x: 800, y: 220 },
      data: { label: "Revision Management", shape: "rectangle" },
      width: 180,
      height: 90,
    },
    {
      id: `node-${timestamp}-6`,
      type: "genericNode",
      position: { x: 1050, y: 50 },
      data: { label: "Development Phase", shape: "rectangle" },
      width: 180,
      height: 90,
    },
    {
      id: `node-${timestamp}-7`,
      type: "genericNode",
      position: { x: 1300, y: 50 },
      data: { label: "Quality Assurance", shape: "hexagon" },
      width: 180,
      height: 90,
    },
    {
      id: `node-${timestamp}-8`,
      type: "genericNode",
      position: { x: 1550, y: 50 },
      data: { label: "Testing Complete?", shape: "diamond" },
      width: 180,
      height: 120,
    },
    {
      id: `node-${timestamp}-9`,
      type: "genericNode",
      position: { x: 1550, y: 220 },
      data: { label: "Bug Fixes & Retesting", shape: "rectangle" },
      width: 180,
      height: 90,
    },
    {
      id: `node-${timestamp}-10`,
      type: "genericNode",
      position: { x: 1800, y: 50 },
      data: { label: "Deployment Preparation", shape: "rectangle" },
      width: 180,
      height: 90,
    },
    {
      id: `node-${timestamp}-11`,
      type: "genericNode",
      position: { x: 2050, y: 50 },
      data: { label: "Production Database", shape: "cylinder" },
      width: 180,
      height: 120,
    },
    {
      id: `node-${timestamp}-12`,
      type: "genericNode",
      position: { x: 2300, y: 50 },
      data: { label: "Go-Live Decision", shape: "diamond" },
      width: 180,
      height: 120,
    },
    {
      id: `node-${timestamp}-13`,
      type: "genericNode",
      position: { x: 2300, y: 220 },
      data: { label: "Rollback Procedure", shape: "rectangle" },
      width: 180,
      height: 90,
    },
    {
      id: `node-${timestamp}-14`,
      type: "genericNode",
      position: { x: 2550, y: 50 },
      data: { label: "Production Deployment", shape: "rectangle" },
      width: 180,
      height: 90,
    },
    {
      id: `node-${timestamp}-15`,
      type: "genericNode",
      position: { x: 2800, y: 50 },
      data: { label: "Monitoring & Support", shape: "hexagon" },
      width: 180,
      height: 90,
    },
    {
      id: `node-${timestamp}-16`,
      type: "genericNode",
      position: { x: 3050, y: 50 },
      data: { label: "Project Completion", shape: "rounded" },
      width: 180,
      height: 90,
    },
  ];
}

/**
 * Generates website wireframe nodes for fallback
 */
export function generateWireframeNodes(
  title: string,
  timestamp: number
): NodeData[] {
  return [
    // Page container
    {
      id: `node-${timestamp}-page`,
      type: "genericNode",
      position: { x: 250, y: 50 },
      data: { label: "", shape: "rectangle" },
      width: 800,
      height: 900,
      style: { backgroundColor: "#FFFFFF", borderColor: "#E2E2E2" },
    },
    // Header
    {
      id: `node-${timestamp}-header`,
      type: "genericNode",
      position: { x: 250, y: 50 },
      data: { label: "Website Header", shape: "rectangle" },
      width: 800,
      height: 80,
    },
    // Logo
    {
      id: `node-${timestamp}-logo`,
      type: "genericNode",
      position: { x: 280, y: 65 },
      data: { label: "Logo", shape: "rectangle" },
      width: 120,
      height: 50,
    },
    // Navigation
    {
      id: `node-${timestamp}-nav`,
      type: "genericNode",
      position: { x: 430, y: 65 },
      data: { label: "Main Navigation", shape: "rectangle" },
      width: 450,
      height: 50,
    },
    // Hero section
    {
      id: `node-${timestamp}-hero`,
      type: "genericNode",
      position: { x: 250, y: 150 },
      data: { label: "Hero Banner / Slider", shape: "rectangle" },
      width: 800,
      height: 200,
    },
    // Main content section
    {
      id: `node-${timestamp}-content`,
      type: "genericNode",
      position: { x: 250, y: 370 },
      data: { label: "Main Content Area", shape: "rectangle" },
      width: 800,
      height: 400,
    },
    // Content left column
    {
      id: `node-${timestamp}-content-left`,
      type: "genericNode",
      position: { x: 270, y: 400 },
      data: { label: "Content Section 1", shape: "rectangle" },
      width: 360,
      height: 150,
    },
    // Content right column
    {
      id: `node-${timestamp}-content-right`,
      type: "genericNode",
      position: { x: 650, y: 400 },
      data: { label: "Content Section 2", shape: "rectangle" },
      width: 380,
      height: 150,
    },
    // Call to action
    {
      id: `node-${timestamp}-cta`,
      type: "genericNode",
      position: { x: 270, y: 570 },
      data: { label: "Call to Action", shape: "rectangle" },
      width: 760,
      height: 100,
    },
    // CTA Button
    {
      id: `node-${timestamp}-cta-button`,
      type: "genericNode",
      position: { x: 550, y: 605 },
      data: { label: "Button", shape: "capsule" },
      width: 200,
      height: 40,
    },
    // Footer
    {
      id: `node-${timestamp}-footer`,
      type: "genericNode",
      position: { x: 250, y: 790 },
      data: { label: "Footer", shape: "rectangle" },
      width: 800,
      height: 150,
    },
    // Footer columns
    {
      id: `node-${timestamp}-footer-1`,
      type: "genericNode",
      position: { x: 280, y: 820 },
      data: { label: "Footer Column 1", shape: "rectangle" },
      width: 180,
      height: 100,
    },
    {
      id: `node-${timestamp}-footer-2`,
      type: "genericNode",
      position: { x: 480, y: 820 },
      data: { label: "Footer Column 2", shape: "rectangle" },
      width: 180,
      height: 100,
    },
    {
      id: `node-${timestamp}-footer-3`,
      type: "genericNode",
      position: { x: 680, y: 820 },
      data: { label: "Footer Column 3", shape: "rectangle" },
      width: 180,
      height: 100,
    },
    // Search box
    {
      id: `node-${timestamp}-search`,
      type: "genericNode",
      position: { x: 750, y: 118 },
      data: { label: "Search", shape: "rectangle" },
      width: 250,
      height: 40,
    },
  ];
}

/**
 * Generates event experience nodes for fallback with proper language handling
 */
export function generateEventExperienceNodes(
  title: string,
  timestamp: number,
  language: LanguageType = LanguageType.ENGLISH
): NodeData[] {
  // Create translated labels
  const entranceLabel =
    getTranslatedLabel("entrance", language) +
    " " +
    getTranslatedLabel("main", language);
  const registrationLabel =
    getTranslatedLabel("registration", language) +
    " " +
    getTranslatedLabel("area", language);
  const mainHallLabel =
    getTranslatedLabel("main", language) +
    " " +
    getTranslatedLabel("hall", language);
  const techBoothLabel =
    getTranslatedLabel("tech", language) +
    " " +
    getTranslatedLabel("booth", language);
  const networkingLabel =
    getTranslatedLabel("networking", language) +
    " " +
    getTranslatedLabel("area", language);
  const refreshmentLabel =
    getTranslatedLabel("refreshment", language) +
    " " +
    getTranslatedLabel("area", language);
  const workshopLabel =
    getTranslatedLabel("workshop", language) +
    " " +
    getTranslatedLabel("space", language);
  const businessVisitorLabel =
    getTranslatedLabel("business", language) +
    " " +
    getTranslatedLabel("visitor", language);
  const technicalVisitorLabel =
    getTranslatedLabel("technical", language) +
    " " +
    getTranslatedLabel("visitor", language);

  return [
    // Main layout areas - improved positioning
    {
      id: `node-${timestamp}-1`,
      type: "genericNode",
      position: { x: 100, y: 100 },
      data: { label: entranceLabel, shape: "rectangle" },
      width: 160,
      height: 80,
    },
    {
      id: `node-${timestamp}-2`,
      type: "genericNode",
      position: { x: 100, y: 260 },
      data: { label: registrationLabel, shape: "rectangle" },
      width: 160,
      height: 80,
    },
    {
      id: `node-${timestamp}-3`,
      type: "genericNode",
      position: { x: 400, y: 150 },
      data: { label: mainHallLabel, shape: "hexagon" },
      width: 180,
      height: 150,
    },
    {
      id: `node-${timestamp}-4`,
      type: "genericNode",
      position: { x: 400, y: 400 },
      data: { label: techBoothLabel + " 1", shape: "rectangle" },
      width: 160,
      height: 100,
    },
    {
      id: `node-${timestamp}-5`,
      type: "genericNode",
      position: { x: 650, y: 180 },
      data: { label: techBoothLabel + " 2", shape: "rectangle" },
      width: 160,
      height: 100,
    },
    {
      id: `node-${timestamp}-6`,
      type: "genericNode",
      position: { x: 650, y: 400 },
      data: { label: networkingLabel, shape: "rounded" },
      width: 180,
      height: 120,
    },
    {
      id: `node-${timestamp}-7`,
      type: "genericNode",
      position: { x: 900, y: 400 },
      data: { label: refreshmentLabel, shape: "rounded" },
      width: 160,
      height: 100,
    },
    {
      id: `node-${timestamp}-8`,
      type: "genericNode",
      position: { x: 650, y: 600 },
      data: { label: workshopLabel, shape: "hexagon" },
      width: 180,
      height: 150,
    },

    // Visitor personas - better positioned
    {
      id: `node-${timestamp}-visitor1`,
      type: "genericNode",
      position: { x: 220, y: 180 },
      data: { label: businessVisitorLabel, shape: "actor" },
      width: 80,
      height: 120,
    },
    {
      id: `node-${timestamp}-visitor2`,
      type: "genericNode",
      position: { x: 520, y: 270 },
      data: { label: technicalVisitorLabel, shape: "actor" },
      width: 80,
      height: 120,
    },
  ];
}

/**
 * Generates edges between nodes for Event Visitor Experience diagrams
 * This is a specialized function for visitor journeys
 */
export function generateEventVisitorEdges(nodes: any[]): any[] {
  const edges: any[] = [];
  const usedEdgeIds = new Set(); // Track used edge IDs to avoid duplicates

  // Helper to create unique edge IDs
  const createUniqueEdgeId = (
    source: string,
    target: string,
    prefix = ""
  ): string => {
    let baseId = `${prefix}edge-${source}-to-${target}`;
    let uniqueId = baseId;
    let counter = 1;

    // If this ID is already used, add a counter suffix
    while (usedEdgeIds.has(uniqueId)) {
      uniqueId = `${baseId}-${counter}`;
      counter++;
    }

    usedEdgeIds.add(uniqueId);
    return uniqueId;
  };

  // Find actor nodes (visitors)
  const visitorNodes = nodes.filter(
    (node) => node.data.shape === "actor" || node.id.includes("visitor")
  );

  if (visitorNodes.length === 0) return edges;

  // For each visitor, create a journey path
  visitorNodes.forEach((visitor, index) => {
    // Determine which areas this visitor will visit
    const allAreas = nodes.filter(
      (node) => node.data.shape !== "actor" && !node.id.includes("visitor")
    );

    // Each visitor visits different areas
    const visitorJourney = [];

    // All visitors start at entrance and registration
    const entrance = allAreas.find((node) =>
      node.data.label.toLowerCase().includes("entrance")
    );

    const registration = allAreas.find((node) =>
      node.data.label.toLowerCase().includes("registration")
    );

    if (entrance) visitorJourney.push(entrance);
    if (registration) visitorJourney.push(registration);

    // For business visitor
    if (visitor.data.label.includes("Business")) {
      // Find relevant areas for business visitors
      const networkingArea = allAreas.find((node) =>
        node.data.label.toLowerCase().includes("networking")
      );

      const refreshmentArea = allAreas.find((node) =>
        node.data.label.toLowerCase().includes("refreshment")
      );

      if (networkingArea) visitorJourney.push(networkingArea);
      if (refreshmentArea) visitorJourney.push(refreshmentArea);
    }

    // For technical visitor
    if (visitor.data.label.includes("Technical")) {
      // Find technical booths
      const technicalAreas = allAreas.filter(
        (node) =>
          node.data.label.toLowerCase().includes("tech") ||
          node.data.label.toLowerCase().includes("workshop")
      );

      // Add technical areas to journey in a logical order
      // Sort by X position to ensure a logical flow from left to right
      const sortedTechnicalAreas = [...technicalAreas].sort(
        (a, b) => a.position.x - b.position.x
      );

      visitorJourney.push(...sortedTechnicalAreas);
    }

    // Create edges connecting visitor to each area in their journey
    // And connect areas in sequence to show the complete journey
    for (let i = 0; i < visitorJourney.length; i++) {
      const area = visitorJourney[i];

      // Connect visitor to first area with a unique ID
      if (i === 0) {
        edges.push({
          id: createUniqueEdgeId(visitor.id, area.id, `visitor-${index}-`),
          source: visitor.id,
          target: area.id,
          sourceHandle: determineBestHandle(visitor, area, "source"),
          targetHandle: determineBestHandle(visitor, area, "target"),
          animated: true,
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: index === 0 ? "#3B82F6" : "#10B981", // Different colors for different visitors
          },
          markerEnd: { type: "arrowclosed" },
        });
      }

      // Connect areas in sequence to show visitor journey with unique IDs
      if (i < visitorJourney.length - 1) {
        const nextArea = visitorJourney[i + 1];

        edges.push({
          id: createUniqueEdgeId(
            area.id,
            nextArea.id,
            `journey-${index}-${i}-`
          ),
          source: area.id,
          target: nextArea.id,
          sourceHandle: determineBestHandle(area, nextArea, "source"),
          targetHandle: determineBestHandle(area, nextArea, "target"),
          animated: true,
          type: "smoothstep",
          style: {
            strokeWidth: 2,
            stroke: index === 0 ? "#3B82F6" : "#10B981", // Different colors for different visitors
            strokeDasharray: "5 5", // Dashed line for journey paths
          },
          markerEnd: { type: "arrowclosed" },
        });
      }
    }
  });

  return edges;
}

/**
 * Helper function to determine the best handle for connecting nodes
 * Based on their relative positions
 */
function determineBestHandle(
  sourceNode: any,
  targetNode: any,
  handleType: "source" | "target"
): string {
  // Calculate center points
  const sourceCenter = {
    x: sourceNode.position.x + sourceNode.width / 2,
    y: sourceNode.position.y + sourceNode.height / 2,
  };

  const targetCenter = {
    x: targetNode.position.x + targetNode.width / 2,
    y: targetNode.position.y + targetNode.height / 2,
  };

  // Determine predominant direction (horizontal or vertical)
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal movement is predominant
    if (handleType === "source") {
      return dx > 0 ? "g" : "h"; // g = right, h = left
    } else {
      return dx > 0 ? "d" : "c"; // d = left, c = right
    }
  } else {
    // Vertical movement is predominant
    if (handleType === "source") {
      return dy > 0 ? "f" : "e"; // f = bottom, e = top
    } else {
      return dy > 0 ? "a" : "b"; // a = top, b = bottom
    }
  }
}

/**
 * Generates hierarchy nodes for fallback
 */
export function generateHierarchyNodes(
  title: string,
  timestamp: number,
  language: LanguageType = LanguageType.ENGLISH
): NodeData[] {
  return [
    {
      id: `node-${timestamp}-1`,
      type: "genericNode",
      position: { x: 600, y: 100 },
      data: { label: getTranslatedLabel("ceo", language), shape: "rectangle" },
      width: 180,
      height: 80,
    },
    {
      id: `node-${timestamp}-2`,
      type: "genericNode",
      position: { x: 400, y: 250 },
      data: { label: getTranslatedLabel("cto", language), shape: "rectangle" },
      width: 150,
      height: 80,
    },
    {
      id: `node-${timestamp}-3`,
      type: "genericNode",
      position: { x: 600, y: 250 },
      data: { label: getTranslatedLabel("cfo", language), shape: "rectangle" },
      width: 150,
      height: 80,
    },
    {
      id: `node-${timestamp}-4`,
      type: "genericNode",
      position: { x: 800, y: 250 },
      data: { label: getTranslatedLabel("coo", language), shape: "rectangle" },
      width: 150,
      height: 80,
    },
    {
      id: `node-${timestamp}-5`,
      type: "genericNode",
      position: { x: 300, y: 400 },
      data: {
        label:
          getTranslatedLabel("engineering", language) +
          " " +
          getTranslatedLabel("lead", language),
        shape: "rectangle",
      },
      width: 150,
      height: 80,
    },
    {
      id: `node-${timestamp}-6`,
      type: "genericNode",
      position: { x: 500, y: 400 },
      data: {
        label:
          getTranslatedLabel("product", language) +
          " " +
          getTranslatedLabel("lead", language),
        shape: "rectangle",
      },
      width: 150,
      height: 80,
    },
    {
      id: `node-${timestamp}-7`,
      type: "genericNode",
      position: { x: 700, y: 400 },
      data: {
        label:
          getTranslatedLabel("finance", language) +
          " " +
          getTranslatedLabel("manager", language),
        shape: "rectangle",
      },
      width: 150,
      height: 80,
    },
    {
      id: `node-${timestamp}-8`,
      type: "genericNode",
      position: { x: 900, y: 400 },
      data: {
        label:
          getTranslatedLabel("operations", language) +
          " " +
          getTranslatedLabel("manager", language),
        shape: "rectangle",
      },
      width: 150,
      height: 80,
    },
  ];
}

/**
 * Generates mind map nodes for fallback
 */
export function generateMindMapNodes(
  title: string,
  timestamp: number,
  language: LanguageType = LanguageType.ENGLISH
): NodeData[] {
  // Use title or translate "Central Idea"
  const centralLabel =
    title ||
    getTranslatedLabel("central", language) +
      " " +
      getTranslatedLabel("idea", language);

  return [
    {
      id: `node-${timestamp}-1`,
      type: "genericNode",
      position: { x: 600, y: 300 },
      data: { label: centralLabel, shape: "capsule" },
      width: 180,
      height: 100,
    },
    {
      id: `node-${timestamp}-2`,
      type: "genericNode",
      position: { x: 400, y: 150 },
      data: {
        label: getTranslatedLabel("topic", language) + " 1",
        shape: "capsule",
      },
      width: 150,
      height: 80,
    },
    {
      id: `node-${timestamp}-3`,
      type: "genericNode",
      position: { x: 800, y: 150 },
      data: {
        label: getTranslatedLabel("topic", language) + " 2",
        shape: "capsule",
      },
      width: 150,
      height: 80,
    },
    {
      id: `node-${timestamp}-4`,
      type: "genericNode",
      position: { x: 400, y: 450 },
      data: {
        label: getTranslatedLabel("topic", language) + " 3",
        shape: "capsule",
      },
      width: 150,
      height: 80,
    },
    {
      id: `node-${timestamp}-5`,
      type: "genericNode",
      position: { x: 800, y: 450 },
      data: {
        label: getTranslatedLabel("topic", language) + " 4",
        shape: "capsule",
      },
      width: 150,
      height: 80,
    },
    {
      id: `node-${timestamp}-6`,
      type: "genericNode",
      position: { x: 200, y: 150 },
      data: {
        label: getTranslatedLabel("subtopic", language) + " 1.1",
        shape: "capsule",
      },
      width: 150,
      height: 80,
    },
    {
      id: `node-${timestamp}-7`,
      type: "genericNode",
      position: { x: 1000, y: 150 },
      data: {
        label: getTranslatedLabel("subtopic", language) + " 2.1",
        shape: "capsule",
      },
      width: 150,
      height: 80,
    },
    {
      id: `node-${timestamp}-8`,
      type: "genericNode",
      position: { x: 200, y: 450 },
      data: {
        label: getTranslatedLabel("subtopic", language) + " 3.1",
        shape: "capsule",
      },
      width: 150,
      height: 80,
    },
    {
      id: `node-${timestamp}-9`,
      type: "genericNode",
      position: { x: 1000, y: 450 },
      data: {
        label: getTranslatedLabel("subtopic", language) + " 4.1",
        shape: "capsule",
      },
      width: 150,
      height: 80,
    },
  ];
}

/**
 * Generates node styles based on industry
 */
export function generateNodeStyles(nodes: any[], industry: IndustryType) {
  const nodeStyles: Record<string, any> = {};

  // Get color palette for the industry
  const palette = getColorPalette(industry);

  nodes.forEach((node: any, index: number) => {
    const colorIndex = index % palette.length;

    // Determine special styling based on shape
    let backgroundColor = palette[colorIndex];
    let borderColor = palette[(colorIndex + 1) % palette.length];
    let textColor = getTextColorForBackground(backgroundColor);

    // Special styling for different shapes
    if (node.data.shape === "diamond") {
      // Decision points - use warning/attention colors
      backgroundColor = "#FEF3C7"; // Light yellow
      borderColor = "#F59E0B"; // Amber
      textColor = "#92400E"; // Dark amber
    } else if (node.data.shape === "cylinder") {
      // Data stores - use neutral colors
      backgroundColor = "#F3F4F6"; // Light gray
      borderColor = "#6B7280"; // Gray
      textColor = "#374151"; // Dark gray
    } else if (node.data.shape === "document") {
      // Documents - use blue tones
      backgroundColor = "#EFF6FF"; // Light blue
      borderColor = "#3B82F6"; // Blue
      textColor = "#1E40AF"; // Dark blue
    } else if (node.data.shape === "actor") {
      // People/actors - use green tones
      backgroundColor = "#F0FDF4"; // Light green
      borderColor = "#22C55E"; // Green
      textColor = "#15803D"; // Dark green
    } else if (node.data.shape === "hexagon") {
      // Quality gates/processes - use purple tones
      backgroundColor = "#FAF5FF"; // Light purple
      borderColor = "#A855F7"; // Purple
      textColor = "#7C3AED"; // Dark purple
    }

    nodeStyles[node.id] = {
      fontFamily:
        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: node.data.label?.length > 25 ? 12 : 14,
      isBold: node.data.shape === "diamond" || index === 0, // Bold for decisions and first node
      isItalic: false,
      isUnderline: false,
      textAlign: "center",
      verticalAlign: "middle",
      shape: node.data.shape,
      locked: false,
      isVertical: true,
      borderStyle: "solid",
      borderWidth: 2,
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      textColor: textColor,
      lineHeight: 1.4,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    };
  });

  return nodeStyles;
}
