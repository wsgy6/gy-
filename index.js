const MODULE_NAME = 'npcAutonomyDirector';
const PANEL_ID = 'npc-autonomy-director-panel';
const FLOAT_PANEL_ID = 'npc-autonomy-director-float';
const FLOAT_MODAL_ID = 'npc-autonomy-director-modal';
const PROMPT_KEY = '3_npc_autonomy_director';
const HISTORY_LIMIT_MAX = 24;
const DRAWER_STATE_KEY = 'npcAutonomyDirector.drawerOpen';
const FLOAT_COLLAPSED_KEY = 'npcAutonomyDirector.floatCollapsed';
const FLOAT_POSITION_KEY = 'npcAutonomyDirector.floatPosition';
const ACTION_BLOCK_OPEN = '<npcad-actions>';
const ACTION_BLOCK_CLOSE = '</npcad-actions>';
const GOAL_AI_TASKS = new Map();

const LONG_TERM_DRIVES = [
  '想逐步取得更多局面掌控权，并避免再次被轻视。',
  '想让关系朝更亲近、更可信赖的方向自然发展。',
  '想证明自己的能力与判断值得被重视。',
  '想从被动应对转向主动塑造局势。',
  '想建立更鲜明、更不容易被忽视的个人存在感。',
  '想在保护自身安全的同时，稳步扩展影响力。',
];

const APPEARANCE_ARCS = [
  {
    id: 'practical-refined',
    label: '实用 → 精致',
    stages: [
      '穿搭偏实用与克制，以耐用、低调、方便行动为主。',
      '开始加入更合身的剪裁与更统一的配色，整体显得利落。',
      '逐步出现更明确的层次感、材质区分与细节装饰。',
      '外在形象已经明显精致起来，会主动挑选能凸显身份与心情的服饰。',
    ],
  },
  {
    id: 'reserved-bold',
    label: '克制 → 张扬',
    stages: [
      '颜色与款式都比较保守，尽量不让自己过于显眼。',
      '开始尝试更鲜明的配色点缀或更有存在感的配件。',
      '会在关键场合用更醒目的款式来表达态度与立场。',
      '穿搭已经具备强烈的个人主张，能够主动利用外表制造印象。',
    ],
  },
  {
    id: 'soft-commanding',
    label: '柔和 → 强势',
    stages: [
      '轮廓与材质偏柔和，给人的感觉较温顺、低压。',
      '开始引入更利落的线条和更明确的结构感。',
      '整体风格在保留气质的同时，逐渐强化了威慑力与控制感。',
      '穿搭与姿态都会主动传达“我知道自己要什么”的气场。',
    ],
  },
];

const BEHAVIOR_ARCS = [
  {
    id: 'guarded-warm',
    label: '戒备 → 温热',
    stages: [
      '表达谨慎，常先观察、试探，再决定是否表露真实态度。',
      '开始在安全时机透露更多想法，偶尔给出更柔软的回应。',
      '会更自然地主动接话、延长互动，并给出带情绪温度的反馈。',
      '面对在意的人时明显更温热，也更愿意主动维系关系。',
    ],
  },
  {
    id: 'passive-assertive',
    label: '被动 → 主动',
    stages: [
      '更多是对局势作出回应，很少主动提出自己的安排。',
      '会开始在小事上做选择、给建议、推动话题方向。',
      '能较明确地主导节奏，并让自己的偏好进入共同决策。',
      '会主动布局、主动试探、主动索取自己想要的结果。',
    ],
  },
  {
    id: 'formal-intimate',
    label: '正式 → 亲密',
    stages: [
      '语气克制有分寸，会保持相对安全的社交距离。',
      '开始用更贴近私人关系的称呼、玩笑或暗示。',
      '会在对话中加入更多只有双方能理解的默契与偏爱。',
      '语言和行为都明显更亲密，愿意通过细节表达占有欲、关心或依赖。',
    ],
  },
];

const GOAL_TEMPLATES = {
  early: [
    '确认当前局势中谁最值得信任，并建立一个只属于自己的安全支点。',
    '通过一次低风险试探，判断{user}会如何回应自己的主动表达。',
    '在不引人警觉的前提下，让别人开始注意到自己的判断力。',
    '先为自己争取一个更有利的位置、话语权或行动空间。',
  ],
  middle: [
    '把一次普通互动悄悄导向更有利于自己的结果。',
    '让{user}更依赖自己的观点、审美或安排。',
    '借一次细节变化测试周围人对自己新形象的反应。',
    '为下一步更大胆的表态铺垫气氛与理由。',
  ],
  late: [
    '把已经积累的影响力转化为更明确的主动权。',
    '让自己的外在与态度形成一致的强烈个人印象。',
    '通过一次关键选择，证明自己不再只是被动跟随。',
    '在关系推进与自我表达之间找到一个更有掌控感的平衡点。',
  ],
};

const GOAL_PHASE_LABELS = {
  early: '前期目标',
  middle: '中期目标',
  late: '后期目标',
};

const GOAL_PHASE_ORDER = ['early', 'middle', 'late'];

const GOAL_LOCK_RULES = {
  early: {
    progressThreshold: 1,
    completionLabel: '完成一个现实小问题后即可更新',
    cadenceLabel: '较快',
  },
  middle: {
    progressThreshold: 2,
    completionLabel: '形成实际改变后才更新',
    cadenceLabel: '一般',
  },
  late: {
    progressThreshold: 3,
    completionLabel: '除非完成宏大阶段目标，否则几乎不变',
    cadenceLabel: '极慢',
  },
};
const DEFAULT_SETTINGS = {
  enabled: true,
  promptDepth: 2,
  historyLimit: 10,
  actionReportEnabled: true,
  hideActionBlockFromMessage: true,
  floatingWindowEnabled: true,
  floatingWindowItems: 5,
  floatingWindowWidth: 360,
  floatingWindowMaxHeight: 50,
  globalExtraInstruction: '',
  autoCollapseOutsideCharacterChat: true,
  defaultAutonomyIntensity: 72,
  defaultGoalTurnInterval: 3,
  defaultAppearanceStep: 16,
  defaultBehaviorStep: 14,
  defaultAppearanceKeywords: '低调,利落,层次,配饰',
  defaultBehaviorKeywords: '观察,试探,靠近,主导',
  // 外部 AI 分析 API 配置（OpenAI 兼容格式）
  externalAiBaseUrl: '',
  externalAiApiKey: '',
  externalAiModel: 'qwen-turbo',
  externalAiEnabled: false,
};

function getContextSafe() {
  if (!window.SillyTavern?.getContext) {
    throw new Error('未检测到 SillyTavern 上下文接口');
  }
  return window.SillyTavern.getContext();
}

function getSettings() {
  const ctx = getContextSafe();
  const settings = ctx.extensionSettings[MODULE_NAME] || {};
  return { ...DEFAULT_SETTINGS, ...settings };
}

function saveSettings(patch) {
  const ctx = getContextSafe();
  const next = { ...getSettings(), ...patch };
  ctx.extensionSettings[MODULE_NAME] = next;
  ctx.saveSettingsDebounced?.();
  return next;
}

function persistMetadata() {
  const ctx = getContextSafe();
  ctx.saveMetadataDebounced?.();
  if (!ctx.saveMetadataDebounced && typeof ctx.saveMetadata === 'function') {
    void ctx.saveMetadata();
  }
}

function persistChat() {
  const ctx = getContextSafe();
  ctx.saveChatDebounced?.();
  if (!ctx.saveChatDebounced && typeof ctx.saveChat === 'function') {
    void ctx.saveChat();
  }
}

function hashString(input) {
  let hash = 0;
  const text = String(input || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegex(input) {
  return String(input || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitKeywords(text) {
  return String(text || '')
    .split(/[，,\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function splitLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

function joinLines(items) {
  return (Array.isArray(items) ? items : [])
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .join('\n');
}

function pickDeterministic(list, seed, offset = 0) {
  if (!list.length) {
    return '';
  }
  const normalizedOffset = Number(offset) || 0;
  const index = hashString(`${seed}::${normalizedOffset}`) % list.length;
  return list[index];
}

function createRoleId(name) {
  return `role-${Date.now()}-${hashString(`${name}-${Math.random()}`)}`;
}

function getCurrentIdentifiers() {
  const ctx = getContextSafe();
  return {
    chatId: ctx.getCurrentChatId?.() || 'no-chat',
    userName: ctx.name1 || '用户',
    charName: ctx.name2 || '角色',
    groupId: ctx.groupId || '',
    characterId: ctx.characterId,
  };
}

function hasActiveCharacterContext(ctx = getContextSafe()) {
  const characterId = ctx.characterId;
  return characterId !== undefined && characterId !== null && characterId !== -1;
}

function hasActiveGroupContext(ctx = getContextSafe()) {
  const groupId = ctx.groupId;
  return groupId !== undefined && groupId !== null && String(groupId).trim() !== '';
}

function isInteractionContextActive() {
  const ctx = getContextSafe();
  const hasChat = Boolean(ctx.getCurrentChatId?.());
  return hasChat && (hasActiveCharacterContext(ctx) || hasActiveGroupContext(ctx));
}

function getAppearanceArcById(arcId) {
  return APPEARANCE_ARCS.find(item => item.id === arcId) || APPEARANCE_ARCS[0];
}

function getBehaviorArcById(arcId) {
  return BEHAVIOR_ARCS.find(item => item.id === arcId) || BEHAVIOR_ARCS[0];
}

function cloneGoalTemplates(inputTemplates) {
  const source = inputTemplates || GOAL_TEMPLATES;
  return {
    early: [...(source.early || GOAL_TEMPLATES.early)],
    middle: [...(source.middle || GOAL_TEMPLATES.middle)],
    late: [...(source.late || GOAL_TEMPLATES.late)],
  };
}

function normalizeStageList(list, fallback) {
  const source = Array.isArray(list) ? list : splitLines(list);
  const base = Array.isArray(fallback) && fallback.length ? fallback : ['', '', '', ''];
  const next = [];
  for (let index = 0; index < 4; index += 1) {
    next.push(String(source[index] || base[index] || '').trim());
  }
  return next;
}

function buildDefaultRole(name, seedHint = '') {
  const settings = getSettings();
  const ids = getCurrentIdentifiers();
  const safeName = String(name || '').trim() || `角色 ${Date.now()}`;
  const seed = `${ids.chatId}:${seedHint || safeName}`;
  const appearanceArc = pickDeterministic(APPEARANCE_ARCS, `${seed}:appearance`);
  const behaviorArc = pickDeterministic(BEHAVIOR_ARCS, `${seed}:behavior`);
  return normalizeRole({
    id: createRoleId(safeName),
    name: safeName,
    enabled: true,
    seed,
    longTermDrive: pickDeterministic(LONG_TERM_DRIVES, `${seed}:drive`),
    currentGoal: '',
    turnCounter: 0,
    turnsSinceGoal: 0,
    appearanceProgress: 0,
    behaviorProgress: 0,
    appearanceArcId: appearanceArc.id,
    behaviorArcId: behaviorArc.id,
    autonomyIntensity: settings.defaultAutonomyIntensity,
    goalTurnInterval: settings.defaultGoalTurnInterval,
    appearanceStep: settings.defaultAppearanceStep,
    behaviorStep: settings.defaultBehaviorStep,
    appearanceKeywords: settings.defaultAppearanceKeywords,
    behaviorKeywords: settings.defaultBehaviorKeywords,
    appearanceStages: [...appearanceArc.stages],
    behaviorStages: [...behaviorArc.stages],
    goalTemplates: cloneGoalTemplates(GOAL_TEMPLATES),
    goalChain: createGoalChainState(),
    customLongTermDrive: '',
    manualAppearanceNote: '',
    manualBehaviorNote: '',
    extraInstruction: '',
    currentAction: '',
    currentActionSource: '',
    lastActionAt: '',
    history: [],
    updatedAt: new Date().toISOString(),
  });
}

function normalizeRole(role) {
  const settings = getSettings();
  const baseAppearanceArc = getAppearanceArcById(role?.appearanceArcId);
  const baseBehaviorArc = getBehaviorArcById(role?.behaviorArcId);
  const name = String(role?.name || '').trim() || '未命名角色';
  const seed = role?.seed || `${getCurrentIdentifiers().chatId}:${name}`;
  const goalTemplates = cloneGoalTemplates(role?.goalTemplates);
  return {
    id: String(role?.id || createRoleId(name)),
    name,
    enabled: role?.enabled !== false,
    seed,
    longTermDrive: String(role?.longTermDrive || pickDeterministic(LONG_TERM_DRIVES, `${seed}:drive`)),
    currentGoal: String(role?.currentGoal || ''),
    turnCounter: Number(role?.turnCounter || 0),
    turnsSinceGoal: Number(role?.turnsSinceGoal || 0),
    appearanceProgress: clamp(Number(role?.appearanceProgress || 0), 0, 100),
    behaviorProgress: clamp(Number(role?.behaviorProgress || 0), 0, 100),
    appearanceArcId: baseAppearanceArc.id,
    behaviorArcId: baseBehaviorArc.id,
    autonomyIntensity: clamp(Number(role?.autonomyIntensity || settings.defaultAutonomyIntensity), 0, 100),
    goalTurnInterval: clamp(Number(role?.goalTurnInterval || settings.defaultGoalTurnInterval), 1, 99),
    appearanceStep: clamp(Number(role?.appearanceStep || settings.defaultAppearanceStep), 1, 30),
    behaviorStep: clamp(Number(role?.behaviorStep || settings.defaultBehaviorStep), 1, 30),
    appearanceKeywords: String(role?.appearanceKeywords ?? settings.defaultAppearanceKeywords),
    behaviorKeywords: String(role?.behaviorKeywords ?? settings.defaultBehaviorKeywords),
    appearanceStages: normalizeStageList(role?.appearanceStages, baseAppearanceArc.stages),
    behaviorStages: normalizeStageList(role?.behaviorStages, baseBehaviorArc.stages),
    goalTemplates,
    goalChain: createGoalChainState(role?.goalChain),
    customLongTermDrive: String(role?.customLongTermDrive || ''),
    manualAppearanceNote: String(role?.manualAppearanceNote || ''),
    manualBehaviorNote: String(role?.manualBehaviorNote || ''),
    extraInstruction: String(role?.extraInstruction || ''),
    currentAction: String(role?.currentAction || ''),
    currentActionSource: String(role?.currentActionSource || ''),
    lastActionAt: String(role?.lastActionAt || ''),
    history: Array.isArray(role?.history) ? role.history : [],
    updatedAt: String(role?.updatedAt || ''),
  };
}

function migrateLegacyState(rawState) {
  if (!rawState || Array.isArray(rawState.roles)) {
    return rawState;
  }
  if (!Object.keys(rawState).length) {
    return rawState;
  }
  const ids = getCurrentIdentifiers();
  const appearanceArc = getAppearanceArcById(rawState.appearanceArcId);
  const behaviorArc = getBehaviorArcById(rawState.behaviorArcId);
  const legacyRole = normalizeRole({
    id: createRoleId(ids.charName),
    name: ids.charName || '角色',
    seed: rawState.seed || `${ids.chatId}:${ids.charName}`,
    longTermDrive: rawState.longTermDrive,
    currentGoal: rawState.currentGoal,
    turnCounter: rawState.turnCounter,
    turnsSinceGoal: rawState.turnsSinceGoal,
    appearanceProgress: rawState.appearanceProgress,
    behaviorProgress: rawState.behaviorProgress,
    appearanceArcId: appearanceArc.id,
    behaviorArcId: behaviorArc.id,
    appearanceStages: appearanceArc.stages,
    behaviorStages: behaviorArc.stages,
    appearanceKeywords: getSettings().defaultAppearanceKeywords,
    behaviorKeywords: getSettings().defaultBehaviorKeywords,
    manualAppearanceNote: rawState.manualAppearanceNote,
    manualBehaviorNote: rawState.manualBehaviorNote,
    goalChain: createGoalChainState({
      early: { goal: rawState.currentGoal },
      middle: createGoalLayerState(),
      late: createGoalLayerState(),
    }),
    history: rawState.history,
    updatedAt: rawState.updatedAt,
  });
  return {
    version: 2,
    selectedRoleId: legacyRole.id,
    roles: [legacyRole],
    updatedAt: rawState.updatedAt || new Date().toISOString(),
  };
}

function getRawChatState() {
  const ctx = getContextSafe();
  return ctx.chatMetadata[MODULE_NAME] || {};
}

function normalizeChatState(inputState) {
  const rawState = migrateLegacyState(inputState || {});
  const ids = getCurrentIdentifiers();
  const rawRoles = Array.isArray(rawState.roles) ? rawState.roles : [];
  const roles = rawRoles.length
    ? rawRoles.map(normalizeRole)
    : [buildDefaultRole(ids.charName || '角色', ids.charName || '默认角色')];
  const selectedRoleId = roles.some(role => role.id === rawState.selectedRoleId) ? rawState.selectedRoleId : roles[0].id;
  return {
    version: 2,
    selectedRoleId,
    roles,
    updatedAt: String(rawState.updatedAt || ''),
  };
}

function saveChatState(nextState) {
  const ctx = getContextSafe();
  const normalized = normalizeChatState(nextState);
  ctx.chatMetadata[MODULE_NAME] = normalized;
  persistMetadata();
  return normalized;
}

function ensureState() {
  const raw = getRawChatState();
  const normalized = normalizeChatState(raw);
  const needsPersist = !Array.isArray(raw.roles)
    || !raw.roles?.length
    || raw.selectedRoleId !== normalized.selectedRoleId
    || Number(raw.version || 0) !== 2;
  if (needsPersist) {
    return saveChatState({ ...normalized, updatedAt: new Date().toISOString() });
  }
  return normalized;
}

function getSelectedRole(state = ensureState()) {
  return state.roles.find(role => role.id === state.selectedRoleId) || state.roles[0];
}

let updateQueue = Promise.resolve();

async function updateState(updater) {
  const current = ensureState();
  const resolved = typeof updater === 'function' ? await updater(current) : updater;
  const next = normalizeChatState(resolved);
  next.updatedAt = new Date().toISOString();
  // 将保存操作放入队列
  const task = async () => saveChatState(next);
  updateQueue = updateQueue.then(task);
  return updateQueue;
}
`nasync function updateRole(roleId, updater) {
  return updateState(async state => ({
    ...state,
    roles: await Promise.all(state.roles.map(async role => (role.id === roleId ? normalizeRole(await updater(role)) : role))),
  }));
}

function addHistory(role, title, detail, turn) {
  const settings = getSettings();
  const historyLimit = clamp(Number(settings.historyLimit) || DEFAULT_SETTINGS.historyLimit, 1, HISTORY_LIMIT_MAX);
  const history = Array.isArray(role.history) ? [...role.history] : [];
  history.unshift({
    title,
    detail,
    turn: Number((turn ?? role.turnCounter) || 0),
    at: new Date().toLocaleString(),
  });
  return history.slice(0, historyLimit);
}

function getStageIndex(progress) {
  if (progress >= 75) return 3;
  if (progress >= 50) return 2;
  if (progress >= 25) return 1;
  return 0;
}

function getGoalBucket(progressValue) {
  if (progressValue < 34) return 'early';
  if (progressValue < 68) return 'middle';
  return 'late';
}

function formatGoal(template, ids, roleName) {
  return String(template || '')
    .replace(/\{user\}/g, ids.userName)
    .replace(/\{char\}/g, roleName || ids.charName);
}

function createGoalLayerState() {
  return {
    goal: '',
    completed: false,
    progressSignals: 0,
    lastUpdatedAt: '',
    completionLockedAt: '',
  };
}

function normalizeGoalLayerState(layer) {
  const base = createGoalLayerState();
  return {
    goal: String(layer?.goal || base.goal),
    completed: layer?.completed === true,
    progressSignals: clamp(Number(layer?.progressSignals || base.progressSignals), 0, 99),
    lastUpdatedAt: String(layer?.lastUpdatedAt || base.lastUpdatedAt),
    completionLockedAt: String(layer?.completionLockedAt || base.completionLockedAt),
  };
}

function createGoalChainState(input) {
  return {
    early: normalizeGoalLayerState(input?.early),
    middle: normalizeGoalLayerState(input?.middle),
    late: normalizeGoalLayerState(input?.late),
  };
}

function getGoalLayer(role, phase) {
  return normalizeGoalLayerState(role?.goalChain?.[phase]);
}

function getCurrentShortGoal(role) {
  return getGoalLayer(role, 'early').goal || role.currentGoal || '';
}

function getGoalChainSummary(role) {
  return GOAL_PHASE_ORDER.map(phase => {
    const layer = getGoalLayer(role, phase);
    const label = GOAL_PHASE_LABELS[phase];
    const status = layer.completed ? '已完成' : '锁定中';
    return `${label}：${layer.goal || '暂无'}（${status}，推进信号 ${layer.progressSignals}）`;
  }).join('\n');
}

function findGuidingGoal(role, fromPhase) {
  const startIndex = GOAL_PHASE_ORDER.indexOf(fromPhase);
  for (let index = startIndex + 1; index < GOAL_PHASE_ORDER.length; index += 1) {
    const layer = getGoalLayer(role, GOAL_PHASE_ORDER[index]);
    if (layer.goal) {
      return layer.goal;
    }
  }
  return role.customLongTermDrive?.trim() || role.longTermDrive || '';
}

function buildGoalFallback(role, ids, phase) {
  const combinedProgress = Math.round((Number(role.appearanceProgress || 0) + Number(role.behaviorProgress || 0)) / 2);
  const pool = role.goalTemplates?.[phase]?.length ? role.goalTemplates[phase] : GOAL_TEMPLATES[phase];
  const offset = Number(role.turnCounter || 0) + Math.floor(combinedProgress / 10);
  const template = pickDeterministic(pool, `${role.seed}:${phase}`, offset);
  const baseGoal = formatGoal(template, ids, role.name);
  const guidingGoal = findGuidingGoal(role, phase);

  if (phase === 'early' && guidingGoal) {
    return `${baseGoal} 这一步要服务于中后期方向：${guidingGoal}`;
  }
  if (phase === 'middle' && guidingGoal) {
    return `${baseGoal} 这一阶段要为最终想达成的局面铺路：${guidingGoal}`;
  }
  if (phase === 'late') {
    return `${baseGoal} 这是角色现阶段不轻易动摇的宏大目标。`;
  }
  return baseGoal;
}

function sanitizeGoalText(text) {
  if (!text) return '';
  let cleaned = String(text).trim();

  // 去除思维链标记：<think>、思考：、解析：、分析：等
  cleaned = cleaned.replace(/(?:^|\n)\s*<\?xml[^>]*>\s*(?:\n|$)/g, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*<\?[^>]*\?>/g, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*<think>[\s\S]*?<\/\?>(?:\n|$)/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*<thinking>[\s\S]*?<\/thinking>(?:\n|$)/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*思考[:：][^\n]*/g, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*解析[:：][^\n]*/g, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*分析[:：][^\n]*/g, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*我认为[:：][^\n]*/g, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*答案是[:：][^\n]*/g, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*目标[:：][^\n]*/g, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*答[:：][^\n]*/g, '');

  // 去除开头的项目符号、编号
  cleaned = cleaned.replace(/^[-*\d.\s]+/, '');

  // 取第一个完整句子（以中文句号/问号/叹号/分号为界）
  const sentenceMatch = cleaned.match(/^([^\n。？！；]*[。？！；])/);
  if (sentenceMatch) {
    cleaned = sentenceMatch[1];
  } else {
    // 无标点则截断
    const noNewline = cleaned.split('\n')[0].trim();
    cleaned = noNewline.length > 0 ? noNewline.slice(0, 80) : cleaned.slice(0, 80);
  }

  cleaned = cleaned.trim();

  // 长度校验：至少 3 个非空白字符，最多 100 字符
  if (cleaned.replace(/\s/g, '').length < 3) return '';
  if (cleaned.length > 100) cleaned = cleaned.slice(0, 100).replace(/[^\w\u4e00-\u9fff]$/, '');

  return cleaned;
}

// 外部 AI 分析 API 调用（OpenAI 兼容格式）
async function callExternalAi(role, ids, phase, settings) {
  const baseUrl = (settings.externalAiBaseUrl || '').replace(/\/$/, '');
  const apiKey = settings.externalAiApiKey || '';
  const model = settings.externalAiModel || 'qwen-turbo';
  if (!baseUrl) return '';

  const guidingGoal = findGuidingGoal(role, phase);
  const lockRule = GOAL_LOCK_RULES[phase];
  const phaseLabel = GOAL_PHASE_LABELS[phase];

  const systemPrompt = `你是一个 NPC 目标规划器。你的任务是给每个 NPC 角色生成简洁的中文短期/中期/长期目标。

【硬性要求】
- 只输出一句中文目标，不超过 50 个字
- 不要编号、不要解释、不要分析过程、不要额外文字
- 目标必须体现角色个性、长期驱动力和当前阶段的自主性
- 如果无法生成合格目标，输出空字符串`;

  const userPrompt = [`请为角色"${role.name}"生成一个${phaseLabel}。`,
    `长期驱动力：${role.customLongTermDrive.trim() || role.longTermDrive}`,
    `穿搭状态：${getAppearanceSummary(role)}`,
    `行为状态：${getBehaviorSummary(role)}`,
    `最近行动：${role.currentAction || '暂无记录'}`,
    `当前前期目标：${getGoalLayer(role, 'early').goal || '暂无'}`,
    `当前中期目标：${getGoalLayer(role, 'middle').goal || '暂无'}`,
    `当前后期目标：${getGoalLayer(role, 'late').goal || '暂无'}`,
    guidingGoal ? `该目标上层导向：${guidingGoal}` : '',
    phase === 'early' ? '要求：聚焦眼前可解决的小问题，完成后可以更换，但必须明显推动中期目标。' : '',
    phase === 'middle' ? '要求：要能统领多个前期目标，只有出现实际局势改变后才算完成。' : '',
    phase === 'late' ? '要求：目标必须宏大、稳定、带方向性，不要写成日常琐事，不要轻易改变。' : '',
    `该层更新节奏：${lockRule.cadenceLabel}。`,
  ].filter(Boolean).join('\n');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const url = `${baseUrl}/chat/completions`;
  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const body = JSON.stringify({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 80,
    stream: false,
  });

  try {
    console.debug('[NPC 导演] 调用外部 AI:', url, 'model:', model);
    const response = await fetch(url, { method: 'POST', headers, body });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn('[NPC 导演] 外部 AI 请求失败:', response.status, errText.slice(0, 200));
      return '';
    }
    const data = await response.json();
    const aiText = data?.choices?.[0]?.message?.content || '';
    const goal = sanitizeGoalText(aiText);
    if (goal && goal.length <= 100 && goal.length >= 3) {
      return goal;
    }
    console.warn('[NPC 导演] 外部 AI 返回目标不合格，使用模板回退。原始响应：', aiText);
    return '';
  } catch (error) {
    console.warn('[NPC 导演] 外部 AI 调用异常，使用模板回退。', error.message);
    return '';
  }
}

async function tryGenerateGoalWithAI(role, ids, phase) {
  const settings = getSettings();

  // 优先尝试外部 AI API
  if (settings.externalAiEnabled && settings.externalAiBaseUrl) {
    const result = await callExternalAi(role, ids, phase, settings);
    if (result) return result;
  }

  // 回退到 SillyTavern 内置 generateQuietPrompt
  const ctx = getContextSafe();
  if (typeof ctx.generateQuietPrompt !== 'function') {
    return '';
  }

  const guidingGoal = findGuidingGoal(role, phase);
  const lockRule = GOAL_LOCK_RULES[phase];
  const phaseLabel = GOAL_PHASE_LABELS[phase];
  const prompt = [
    '【硬性要求】你是一个NPC目标规划器，必须只输出一句中文目标，不要编号、不要解释、不要添加任何额外文字或标点。',
    `请为角色"${role.name}"生成一个${phaseLabel}。`,
    '只输出一句中文目标，不要解释，不要编号。',
    '目标必须体现角色个性、长期驱动力、当前阶段和自主性。',
    `长期驱动力：${role.customLongTermDrive.trim() || role.longTermDrive}`,
    `穿搭状态：${getAppearanceSummary(role)}`,
    `行为状态：${getBehaviorSummary(role)}`,
    `最近行动：${role.currentAction || '暂无记录'}`,
    `当前前期目标：${getGoalLayer(role, 'early').goal || '暂无'}`,
    `当前中期目标：${getGoalLayer(role, 'middle').goal || '暂无'}`,
    `当前后期目标：${getGoalLayer(role, 'late').goal || '暂无'}`,
    guidingGoal ? `该目标上层导向：${guidingGoal}` : '',
    phase === 'early' ? '要求：聚焦眼前可解决的小问题，完成后可以更换，但必须明显推动中期目标。' : '',
    phase === 'middle' ? '要求：要能统领多个前期目标，只有出现实际局势改变后才算完成。' : '',
    phase === 'late' ? '要求：目标必须宏大、稳定、带方向性，不要写成日常琐事，不要轻易改变。' : '',
    `该层更新节奏：${lockRule.cadenceLabel}。`,
  ].filter(Boolean).join('\n');

  try {
    const response = await ctx.generateQuietPrompt({ quietPrompt: prompt, trimToSentence: true, removeReasoning: true });
    const goal = sanitizeGoalText(response);

    if (goal && goal.length <= 100 && goal.length >= 3) {
      return goal;
    }
    console.warn('[NPC 导演] 内置 AI 返回目标不合格，使用模板回退。原始响应：', response);
    return '';
  } catch (error) {
    console.warn('[NPC 导演] 内置 AI 调用失败，使用模板回退。', error);
    return '';
  }
}

async function generateGoalForPhase(role, ids, phase) {
  const aiGoal = await tryGenerateGoalWithAI(role, ids, phase);
  if (aiGoal) {
    return aiGoal;
  }
  return buildGoalFallback(role, ids, phase);
}

async function assignGoalToPhase(role, ids, phase, force = false) {
  const currentLayer = getGoalLayer(role, phase);
  if (!force && currentLayer.goal && !currentLayer.completed) {
    return normalizeRole(role);
  }

  const taskKey = `${role.id}:${phase}`;
  if (GOAL_AI_TASKS.has(taskKey)) {
    return GOAL_AI_TASKS.get(taskKey);
  }

  const task = (async () => {
    const nextGoal = await generateGoalForPhase(role, ids, phase);
  const nextLayer = normalizeGoalLayerState({
    goal: nextGoal,
    completed: false,
    progressSignals: 0,
    lastUpdatedAt: new Date().toISOString(),
    completionLockedAt: '',
  });

  const nextGoalChain = createGoalChainState({
    ...role.goalChain,
    [phase]: nextLayer,
  });

  const nextRole = normalizeRole({
    ...role,
    goalChain: nextGoalChain,
    currentGoal: nextGoalChain.early.goal || role.currentGoal,
    turnsSinceGoal: 0,
    updatedAt: new Date().toISOString(),
  });

    return normalizeRole({
      ...nextRole,
      history: addHistory(nextRole, `${GOAL_PHASE_LABELS[phase]}刷新`, nextGoal, nextRole.turnCounter),
    });
  })();

  GOAL_AI_TASKS.set(taskKey, task);
  try {
    return await task;
  } finally {
    GOAL_AI_TASKS.delete(taskKey);
  }
}

function markGoalLayerProgress(role, phase, reason, skipHistory = false) {
  const layer = getGoalLayer(role, phase);
  if (!layer.goal || layer.completed) {
    return normalizeRole(role);
  }
  const rule = GOAL_LOCK_RULES[phase];
  const nextSignals = clamp(layer.progressSignals + 1, 0, 99);
  const reached = nextSignals >= rule.progressThreshold;
  const nextLayer = normalizeGoalLayerState({
    ...layer,
    progressSignals: nextSignals,
    completed: reached,
    completionLockedAt: reached ? new Date().toISOString() : layer.completionLockedAt,
  });
  const nextGoalChain = createGoalChainState({
    ...role.goalChain,
    [phase]: nextLayer,
  });
  const nextRole = normalizeRole({
    ...role,
    goalChain: nextGoalChain,
    updatedAt: new Date().toISOString(),
  });
  const statusText = reached
    ? `${GOAL_PHASE_LABELS[phase]}已完成，可进入下一次更新。`
    : `${GOAL_PHASE_LABELS[phase]}推进 +1：${reason}`;
  return normalizeRole({
    ...nextRole,
    history: skipHistory ? undefined : addHistory(nextRole, `${GOAL_PHASE_LABELS[phase]}推进`, statusText, nextRole.turnCounter),
  });
}

async function refreshGoalChain(role, ids, force = false) {
  let nextRole = normalizeRole(role);
  nextRole = await assignGoalToPhase(nextRole, ids, 'late', force || !getGoalLayer(nextRole, 'late').goal);
  nextRole = await assignGoalToPhase(nextRole, ids, 'middle', force || !getGoalLayer(nextRole, 'middle').goal);
  nextRole = await assignGoalToPhase(nextRole, ids, 'early', force || !getGoalLayer(nextRole, 'early').goal || getGoalLayer(nextRole, 'early').completed);
  return normalizeRole({
    ...nextRole,
    currentGoal: getGoalLayer(nextRole, 'early').goal || nextRole.currentGoal,
  });
}

async function updateGoalChainAfterAdvance(role, reason = 'auto') {
  let nextRole = normalizeRole(role);
  const shortGoal = getGoalLayer(nextRole, 'early');
  if (!shortGoal.goal) {
    return refreshGoalChain(nextRole, getCurrentIdentifiers(), true);
  }

  nextRole = markGoalLayerProgress(nextRole, 'early', reason === 'manual' ? '手动推进了一个现实小问题。' : '本轮行动继续朝短期问题施压。', true);

  if (getGoalLayer(nextRole, 'early').completed) {
    nextRole = markGoalLayerProgress(nextRole, 'middle', '前期目标被完成，正在积累阶段性改变。', true);
    if (getGoalLayer(nextRole, 'middle').completed) {
      nextRole = markGoalLayerProgress(nextRole, 'late', '中期阶段目标完成，宏大方向得到实质推进。', true);
      if (getGoalLayer(nextRole, 'late').completed) {
        nextRole = await assignGoalToPhase(nextRole, getCurrentIdentifiers(), 'late', true);
      }
      nextRole = await assignGoalToPhase(nextRole, getCurrentIdentifiers(), 'middle', true);
    }
    nextRole = await assignGoalToPhase(nextRole, getCurrentIdentifiers(), 'early', true);
  }

  return normalizeRole({
    ...nextRole,
    currentGoal: getGoalLayer(nextRole, 'early').goal || nextRole.currentGoal,
  });
}

function getAppearanceSummary(role) {
  const stageText = role.appearanceStages[getStageIndex(role.appearanceProgress)] || role.appearanceStages[0] || '';
  const keywords = splitKeywords(role.appearanceKeywords);
  const keywordText = keywords.length ? `关键词：${keywords.join('、')}。` : '';
  const manualText = role.manualAppearanceNote?.trim() ? `额外提示：${role.manualAppearanceNote.trim()}。` : '';
  const arcLabel = getAppearanceArcById(role.appearanceArcId).label;
  return `${arcLabel}｜${stageText}${keywordText ? ` ${keywordText}` : ''}${manualText ? ` ${manualText}` : ''}`.trim();
}

function getBehaviorSummary(role) {
  const stageText = role.behaviorStages[getStageIndex(role.behaviorProgress)] || role.behaviorStages[0] || '';
  const keywords = splitKeywords(role.behaviorKeywords);
  const keywordText = keywords.length ? `关键词：${keywords.join('、')}。` : '';
  const manualText = role.manualBehaviorNote?.trim() ? `额外提示：${role.manualBehaviorNote.trim()}。` : '';
  const arcLabel = getBehaviorArcById(role.behaviorArcId).label;
  return `${arcLabel}｜${stageText}${keywordText ? ` ${keywordText}` : ''}${manualText ? ` ${manualText}` : ''}`.trim();
}

async function rotateGoalForRole(role, ids, force = false) {
  return refreshGoalChain(role, ids, force);
}

async function ensureRoleInitialized(role) {
  const ids = getCurrentIdentifiers();
  let nextRole = normalizeRole(role);
  if (nextRole.customLongTermDrive.trim()) {
    nextRole.longTermDrive = nextRole.customLongTermDrive.trim();
  }
  if (!nextRole.longTermDrive) {
    nextRole.longTermDrive = pickDeterministic(LONG_TERM_DRIVES, `${nextRole.seed}:drive`);
  }
  if (!getGoalLayer(nextRole, 'late').goal || !getGoalLayer(nextRole, 'middle').goal || !getGoalLayer(nextRole, 'early').goal) {
    nextRole = await refreshGoalChain(nextRole, ids, false);
  }
  return normalizeRole({
    ...nextRole,
    currentGoal: getCurrentShortGoal(nextRole),
  });
}

async function ensureRolesInitialized(state = ensureState()) {
  let changed = false;
  const roles = [];
  for (const role of state.roles) {
    const nextRole = await ensureRoleInitialized(role);
    const roleChanged = JSON.stringify(role) !== JSON.stringify(nextRole);
    if (roleChanged) {
      changed = true;
    }
    roles.push(nextRole);
  }
  if (!changed) {
    return state;
  }
  return saveChatState({ ...state, roles, updatedAt: new Date().toISOString() });
}

async function syncPrompt() {
  const ctx = getContextSafe();
  const settings = getSettings();
  const state = await ensureRolesInitialized();
  const promptText = settings.enabled ? buildPrompt(state, settings) : '';
  if (typeof ctx.setExtensionPrompt !== 'function') {
    console.warn('[NPC 多角色自主性导演] setExtensionPrompt 不可用，已跳过提示词注入。');
    return promptText;
  }
  try {
    ctx.setExtensionPrompt(PROMPT_KEY, promptText, Number(settings.promptDepth) || DEFAULT_SETTINGS.promptDepth);
  } catch (error) {
    console.error('[NPC 多角色自主性导演] 提示词注入失败', error);
  }
  return promptText;
}
function buildPrompt(state = ensureState(), settings = getSettings()) {
  const ids = getCurrentIdentifiers();
  const enabledRoles = state.roles.filter(role => role.enabled);
  if (!enabledRoles.length) {
    return '';
  }
  const roleBlocks = enabledRoles.map(role => {
    const intensity = clamp(Number(role.autonomyIntensity) || 0, 0, 100);
    const lastAction = role.currentAction?.trim() ? `最近行动：${role.currentAction.trim()}` : '最近行动：暂无记录';
    const extra = role.extraInstruction?.trim() ? `附加限制：${role.extraInstruction.trim()}` : '';
    return [
      `【受控角色：${role.name}】`,
      `长期驱动力：${role.customLongTermDrive.trim() || role.longTermDrive}`,
      `当前前期目标：${getCurrentShortGoal(role) || '暂无'}`,
      `中期目标：${getGoalLayer(role, 'middle').goal || '暂无'}`,
      `后期目标：${getGoalLayer(role, 'late').goal || '暂无'}`,
      `外在穿搭变化：${getAppearanceSummary(role)}`,
      `行为表现变化：${getBehaviorSummary(role)}`,
      lastAction,
      `自主强度：${intensity}/100。`,
      extra,
    ].filter(Boolean).join('\n');
  });

  const actionInstruction = settings.actionReportEnabled
    ? [
        '每轮主回复结束后，必须额外追加一个结构化行动区块，列出所有已启用受控角色当前正在做什么。',
        '行动区块固定格式如下：',
        ACTION_BLOCK_OPEN,
        '角色名::一句话行动描述',
        ACTION_BLOCK_CLOSE,
        '要求：',
        '1. 区块内必须覆盖每一个已启用受控角色，一行一个角色。',
        '2. 行动描述应是“此刻正在进行或准备进行的动作/意图”，简洁具体。',
        '3. 如果角色暂未出场，也要写出其当前状态，例如“未出场，仍在观察局势”。',
        '4. 行动区块只能总结本轮正文里已经实际发生、明确表现或紧接着要执行的动作，绝不能额外虚构与正文冲突的剧情。',
        '5. 不要在行动区块外解释这个格式，也不要省略标签。',
      ].join('\n')
    : '';

  return [
    '[NPC 多角色自主性导演指令]',
    `你正在为同一轮主回复同时维护 ${enabledRoles.length} 个受控角色的连续行动与渐进变化。`,
    '正文写作要求：',
    '1. 始终让受控角色像“有自己打算的人”一样行动，而不是只被动回应。',
    '2. 每次回复只推进一小步，通过措辞、动作、关注点、穿搭细节和选择倾向体现变化。',
    '3. 不要突然 OOC 地宣布“进入下一阶段”；所有变化必须自然、连贯、渐进。',
    '4. 如果多个受控角色同时存在，必须让他们的行动彼此区分，避免同质化。',
    '5. 前期目标负责解决眼前小问题，中期目标负责统领方向，后期目标负责稳定宏大愿景。',
    '6. 三层目标都带锁：只有判定完成后才能变更，尤其后期目标除非发生重大完成或转变，否则不要轻易改写。',
    '7. 日常行动可以灵活，但必须主动服务于前期目标的完成，并与中后期目标保持一致。',
    '8. 角色应表现出为了完成目标而主动试探、推进、布局，而不是把目标系统当作摆设。',
    '9. 当前目标优先影响角色的主动性、提议、观察重点、欲望表达和风险选择。',
    '10. 穿搭变化通过材质、配色、剪裁、配饰、整理程度、气场等具体细节体现。',
    '11. 行为变化通过语气、主动程度、边界感、亲密度、控制欲或依赖感的细微变化体现。',
    settings.globalExtraInstruction?.trim() ? `全局附加限制：${settings.globalExtraInstruction.trim()}` : '',
    actionInstruction,
    roleBlocks.join('\n\n'),
    `主互动对象：${ids.userName}`,
  ].filter(Boolean).join('\n\n');
}

function getMessageText(message) {
  return String(message?.mes ?? message?.message ?? message?.text ?? '');
}

function setMessageText(message, text) {
  if (!message) return;
  if (Object.prototype.hasOwnProperty.call(message, 'mes')) {
    message.mes = text;
  }
  if (Object.prototype.hasOwnProperty.call(message, 'message')) {
    message.message = text;
  }
  if (Object.prototype.hasOwnProperty.call(message, 'text')) {
    message.text = text;
  }
}

function stripActionBlock(text) {
  const pattern = new RegExp(`${escapeRegex(ACTION_BLOCK_OPEN)}[\\s\\S]*?${escapeRegex(ACTION_BLOCK_CLOSE)}`, 'i');
  return String(text || '')
    .replace(pattern, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeNameKey(name) {
  return String(name || '').trim().toLowerCase();
}

function parseActionBlock(text, roles) {
  const match = String(text || '').match(new RegExp(`${escapeRegex(ACTION_BLOCK_OPEN)}([\\s\\S]*?)\\s*${escapeRegex(ACTION_BLOCK_CLOSE)}`, 'i'));
  if (!match) {
    return { actions: {}, hasBlock: false };
  }

  const lines = splitLines(match[1]);
  const roleMap = new Map(roles.map(role => [role.name.trim(), role]));
  const actions = {};

  for (const line of lines) {
    const cleaned = line.replace(/^[-*]\s*/, '');
    const partMatch = cleaned.match(/^\s*(.+?)\s*[:：]\s*(.+?)\s*$/);
    if (!partMatch) continue;
    const rawName = partMatch[1].trim();
    const actionText = partMatch[2].trim();
    const matchedRole = roleMap.get(rawName.trim());
    if (!matchedRole || !actionText) continue;
    actions[matchedRole.id] = actionText;
  }

  return { actions, hasBlock: true };
}

async function advanceRole(role, reason = 'auto') {
  if (!role.enabled) {
    return normalizeRole(role);
  }

  const previousAppearanceStage = getStageIndex(role.appearanceProgress);
  const previousBehaviorStage = getStageIndex(role.behaviorProgress);
  const intensityFactor = clamp(Number(role.autonomyIntensity || 0), 0, 100) / 100;
  const appearanceDelta = clamp(Math.max(1, Math.ceil(Number(role.appearanceStep || 0) * intensityFactor)), 1, 25);
  const behaviorDelta = clamp(Math.max(1, Math.ceil(Number(role.behaviorStep || 0) * intensityFactor)), 1, 25);

  let nextRole = normalizeRole({
    ...role,
    turnCounter: Number(role.turnCounter || 0) + 1,
    turnsSinceGoal: Number(role.turnsSinceGoal || 0) + 1,
    appearanceProgress: clamp(Number(role.appearanceProgress || 0) + appearanceDelta, 0, 100),
    behaviorProgress: clamp(Number(role.behaviorProgress || 0) + behaviorDelta, 0, 100),
    updatedAt: new Date().toISOString(),
  });

  const nextAppearanceStage = getStageIndex(nextRole.appearanceProgress);
  const nextBehaviorStage = getStageIndex(nextRole.behaviorProgress);

  // 根据 goalTurnInterval 控制目标刷新频率
  const goalInterval = Number(role.goalTurnInterval || 3);
  if (Number(nextRole.turnsSinceGoal || 0) >= goalInterval) {
    nextRole = normalizeRole({ ...nextRole, turnsSinceGoal: 0 });
    // 只强制刷新早期目标（它本就设计为高频更换）
    nextRole = await assignGoalToPhase(nextRole, getCurrentIdentifiers(), 'early', true);
    // 中/晚层仅当为空或已完成时刷新（自然推进）
    if (!getGoalLayer(nextRole, 'middle').goal || getGoalLayer(nextRole, 'middle').completed) {
        nextRole = await assignGoalToPhase(nextRole, getCurrentIdentifiers(), 'middle', false);
    }
    if (!getGoalLayer(nextRole, 'late').goal || getGoalLayer(nextRole, 'late').completed) {
        nextRole = await assignGoalToPhase(nextRole, getCurrentIdentifiers(), 'late', false);
    }
  }
  nextRole = await updateGoalChainAfterAdvance(nextRole, reason);

  // 统一添加综合历史摘要，替代多次分散添加
  if (reason === "auto" || reason === "manual") {
    const summaryParts = [];
    if (nextAppearanceStage !== previousAppearanceStage) {
      summaryParts.push(`穿搭：${getAppearanceSummary(nextRole)}`);
    }
    if (nextBehaviorStage !== previousBehaviorStage) {
      summaryParts.push(`行为：${getBehaviorSummary(nextRole)}`);
    }
    if (summaryParts.length > 0) {
      nextRole = normalizeRole({
        ...nextRole,
        history: addHistory(nextRole, "自主演化", summaryParts.join("；"), nextRole.turnCounter),
      });
    }
  }

  return nextRole;
}

function applyRoleAction(role, actionText, source = 'llm') {
  const detail = String(actionText || '').trim();
  if (!detail) {
    return normalizeRole(role);
  }

  const nextRole = normalizeRole({
    ...role,
    currentAction: detail,
    currentActionSource: source,
    lastActionAt: new Date().toLocaleString(),
    updatedAt: new Date().toISOString(),
  });

  return normalizeRole({
    ...nextRole,
    history: addHistory(nextRole, '行动更新', detail, nextRole.turnCounter),
  });
}

function getStatusSnapshot(state = ensureState()) {
  const settings = getSettings();
  const selectedRole = getSelectedRole(state);
  return {
    settings,
    state,
    selectedRole,
    appearanceStage: getStageIndex(selectedRole.appearanceProgress) + 1,
    behaviorStage: getStageIndex(selectedRole.behaviorProgress) + 1,
    appearanceSummary: getAppearanceSummary(selectedRole),
    behaviorSummary: getBehaviorSummary(selectedRole),
    goalChainSummary: getGoalChainSummary(selectedRole),
  };
}

function renderRoleTabs(roles, selectedRoleId) {
  return roles
    .map(
      role => `
        <button type="button" class="npcad-role-chip ${role.id === selectedRoleId ? 'is-active' : ''}" data-role-select="${escapeHtml(role.id)}">
          <span>${escapeHtml(role.name)}</span>
          <span class="npcad-role-chip-meta">${role.enabled ? '启用' : '停用'}</span>
        </button>
      `,
    )
    .join('');
}

function createPanelHtml(state = ensureState()) {
  const snapshot = getStatusSnapshot(state);
  const { settings, state: snapshotState, selectedRole, appearanceStage, behaviorStage, appearanceSummary, behaviorSummary, goalChainSummary } = snapshot;
  const enabledChecked = settings.enabled ? 'checked' : '';
  const floatingChecked = settings.floatingWindowEnabled ? 'checked' : '';
  const actionChecked = settings.actionReportEnabled ? 'checked' : '';
  const hideActionChecked = settings.hideActionBlockFromMessage ? 'checked' : '';
  const history = Array.isArray(selectedRole.history) ? selectedRole.history : [];

  return `
    <div class="inline-drawer npc-autonomy-director-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>NPC 多角色自主性导演</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
      </div>
      <div class="inline-drawer-content npc-autonomy-director-content">
        <div class="npcad-grid">
          <section class="npcad-card npcad-hero">
            <div class="npcad-card-title">总览</div>
            <div class="npcad-pill-row">
              <span class="npcad-pill ${settings.enabled ? 'is-on' : 'is-off'}">扩展：${settings.enabled ? '启用' : '停用'}</span>
              <span class="npcad-pill">受控角色：${snapshotState.roles.length}</span>
              <span class="npcad-pill">当前角色：${escapeHtml(selectedRole.name)}</span>
              <span class="npcad-pill">外在阶段：${appearanceStage}/4</span>
              <span class="npcad-pill">行为阶段：${behaviorStage}/4</span>
            </div>
            <div class="npcad-summary-grid">
              <div>
                <div class="npcad-summary-title">当前短期目标</div>
                <div class="npcad-summary-box npcad-goal">${escapeHtml(getCurrentShortGoal(selectedRole) || '暂无')}</div>
              </div>
              <div>
                <div class="npcad-summary-title">最近行动</div>
                <div class="npcad-summary-box">${escapeHtml(selectedRole.currentAction || '暂无记录')}</div>
              </div>
            </div>
            <div>
              <div class="npcad-summary-title">三层目标链</div>
              <div class="npcad-summary-box npcad-goal">${escapeHtml(goalChainSummary || '暂无')}</div>
            </div>
            <div class="npcad-progress-group">
              <div>
                <div class="npcad-progress-label">穿搭推进 ${escapeHtml(selectedRole.appearanceProgress)}%</div>
                <div class="npcad-progress"><span style="width:${escapeHtml(selectedRole.appearanceProgress)}%"></span></div>
              </div>
              <div>
                <div class="npcad-progress-label">行为推进 ${escapeHtml(selectedRole.behaviorProgress)}%</div>
                <div class="npcad-progress"><span style="width:${escapeHtml(selectedRole.behaviorProgress)}%"></span></div>
              </div>
            </div>
          </section>

          <section class="npcad-card">
            <div class="npcad-card-title">角色管理</div>
            <div class="npcad-role-tabs">${renderRoleTabs(snapshotState.roles, snapshotState.selectedRoleId)}</div>
            <div class="npcad-form-row">
              <label>新增受控角色</label>
              <div class="npcad-inline-input-row">
                <input type="text" id="npcad-new-role-name" placeholder="例如：女仆长、卫兵长、商会秘书" />
                <button type="button" class="menu_button" data-action="add-role">新增角色</button>
              </div>
            </div>
            <div class="npcad-button-row">
              <button type="button" class="menu_button" data-action="advance">推进当前角色</button>
              <button type="button" class="menu_button" data-action="goal">刷新当前角色目标</button>
              <button type="button" class="menu_button" data-action="sync">同步提示词</button>
              <button type="button" class="menu_button danger_button" data-action="reset-role">重置当前角色</button>
              <button type="button" class="menu_button danger_button" data-action="delete-role">删除当前角色</button>
            </div>
          </section>

          <section class="npcad-card">
            <div class="npcad-card-title">当前角色设置</div>
            <div class="npcad-form-row">
              <label>角色名称</label>
              <input type="text" data-role-field="name" value="${escapeHtml(selectedRole.name)}" />
            </div>
            <div class="npcad-form-row npcad-toggle-row">
              <label>启用该角色</label>
              <input type="checkbox" data-role-field="enabled" ${selectedRole.enabled ? 'checked' : ''} />
            </div>
            <div class="npcad-form-row">
              <label>自主强度</label>
              <input type="range" min="0" max="100" step="1" value="${escapeHtml(selectedRole.autonomyIntensity)}" data-role-field="autonomyIntensity" />
            </div>
            <div class="npcad-form-row">
              <label>目标刷新间隔（回合）</label>
              <input type="number" min="1" max="99" step="1" value="${escapeHtml(selectedRole.goalTurnInterval)}" data-role-field="goalTurnInterval" />
            </div>
            <div class="npcad-form-row">
              <label>穿搭推进速度</label>
              <input type="range" min="1" max="30" step="1" value="${escapeHtml(selectedRole.appearanceStep)}" data-role-field="appearanceStep" />
            </div>
            <div class="npcad-form-row">
              <label>行为推进速度</label>
              <input type="range" min="1" max="30" step="1" value="${escapeHtml(selectedRole.behaviorStep)}" data-role-field="behaviorStep" />
            </div>
            <div class="npcad-form-row">
              <label>自定义长期驱动力</label>
              <textarea rows="3" data-role-field="customLongTermDrive" placeholder="为空则自动生成">${escapeHtml(selectedRole.customLongTermDrive)}</textarea>
            </div>
            <div class="npcad-form-row">
              <label>当前目标（可手动覆盖）</label>
              <textarea rows="3" data-role-field="currentGoal" placeholder="例如：用一次安排试探对方是否愿意让出主导权。">${escapeHtml(selectedRole.currentGoal)}</textarea>
            </div>
            <div class="npcad-form-row">
              <label>当前行动（可手动修正）</label>
              <textarea rows="3" data-role-field="currentAction" placeholder="例如：正在观察门口动静，同时故意坐近用户半步。">${escapeHtml(selectedRole.currentAction)}</textarea>
            </div>
            <div class="npcad-form-row">
              <label>穿搭关键词（逗号分隔）</label>
              <input type="text" data-role-field="appearanceKeywords" value="${escapeHtml(selectedRole.appearanceKeywords)}" />
            </div>
            <div class="npcad-form-row">
              <label>行为关键词（逗号分隔）</label>
              <input type="text" data-role-field="behaviorKeywords" value="${escapeHtml(selectedRole.behaviorKeywords)}" />
            </div>
            <div class="npcad-form-row">
              <label>穿搭补充</label>
              <textarea rows="2" data-role-field="manualAppearanceNote">${escapeHtml(selectedRole.manualAppearanceNote)}</textarea>
            </div>
            <div class="npcad-form-row">
              <label>行为补充</label>
              <textarea rows="2" data-role-field="manualBehaviorNote">${escapeHtml(selectedRole.manualBehaviorNote)}</textarea>
            </div>
            <div class="npcad-form-row">
              <label>该角色附加限制</label>
              <textarea rows="3" data-role-field="extraInstruction">${escapeHtml(selectedRole.extraInstruction)}</textarea>
            </div>
          </section>

          <section class="npcad-card">
            <div class="npcad-card-title">阶段与目标池</div>
            <div class="npcad-form-row">
              <label>穿搭弧线</label>
              <select data-role-field="appearanceArcId">
                ${APPEARANCE_ARCS.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === selectedRole.appearanceArcId ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}
              </select>
            </div>
            <div class="npcad-form-row">
              <label>穿搭四阶段（每行一阶段）</label>
              <textarea rows="6" class="npcad-stage-textarea" data-role-field="appearanceStages">${escapeHtml(joinLines(selectedRole.appearanceStages))}</textarea>
            </div>
            <div class="npcad-form-row">
              <label>行为弧线</label>
              <select data-role-field="behaviorArcId">
                ${BEHAVIOR_ARCS.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === selectedRole.behaviorArcId ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}
              </select>
            </div>
            <div class="npcad-form-row">
              <label>行为四阶段（每行一阶段）</label>
              <textarea rows="6" class="npcad-stage-textarea" data-role-field="behaviorStages">${escapeHtml(joinLines(selectedRole.behaviorStages))}</textarea>
            </div>
            <div class="npcad-form-row">
              <label>早期目标池（每行一个目标）</label>
              <textarea rows="5" data-role-field="goalTemplates.early">${escapeHtml(joinLines(selectedRole.goalTemplates.early))}</textarea>
            </div>
            <div class="npcad-form-row">
              <label>中期目标池（每行一个目标）</label>
              <textarea rows="5" data-role-field="goalTemplates.middle">${escapeHtml(joinLines(selectedRole.goalTemplates.middle))}</textarea>
            </div>
            <div class="npcad-form-row">
              <label>后期目标池（每行一个目标）</label>
              <textarea rows="5" data-role-field="goalTemplates.late">${escapeHtml(joinLines(selectedRole.goalTemplates.late))}</textarea>
            </div>
            <div class="npcad-button-row">
              <button type="button" class="menu_button" data-action="reset-stages">重置当前角色阶段默认值</button>
            </div>
          </section>

          <section class="npcad-card">
            <div class="npcad-card-title">外部 AI 分析 API（可选）</div>
            <div class="npcad-form-row npcad-toggle-row">
              <label>启用外部 AI 分析</label>
              <input type="checkbox" data-setting="externalAiEnabled" ${settings.externalAiEnabled ? 'checked' : ''} />
            </div>
            <div class="npcad-form-row">
              <label>API Base URL</label>
              <input type="text" data-setting="externalAiBaseUrl" placeholder="例如：https://api.openai.com" value="${escapeHtml(settings.externalAiBaseUrl)}" />
              <small style="color:var(--grey70,#c5c5c5);font-size:11px;">支持 OpenAI 兼容格式的 API，如 OpenRouter、Ollama、LM Studio、本地服务等。</small>
            </div>
            <div class="npcad-form-row">
              <label>API Key</label>
              <input type="password" data-setting="externalAiApiKey" placeholder="sk-..." value="${escapeHtml(settings.externalAiApiKey)}" />
              <small style="color:var(--grey70,#c5c5c5);font-size:11px;">留空则跳过认证（部分本地服务不需要 Key）。</small>
            </div>
            <div class="npcad-form-row">
              <label>模型名称</label>
              <input type="text" data-setting="externalAiModel" placeholder="qwen-turbo" value="${escapeHtml(settings.externalAiModel)}" />
              <small style="color:var(--grey70,#c5c5c5);font-size:11px;">推荐使用参数量较小、速度快的模型，如 qwen-turbo、gpt-4o-mini、llama3 等。</small>
            </div>
            <div class="npcad-summary-box" style="margin-top:8px;font-size:12px;">
              <div style="color:var(--grey70,#c5c5c5);">此 API 仅用于生成 NPC 目标规划，不经过 SillyTavern 主对话模型，不会消耗主 API 的配额。请求为纯 JSON，无聊天界面。</div>
            </div>
          </section>

          <section class="npcad-card">
            <div class="npcad-card-title">全局设置与提示词</div>
            <div class="npcad-form-row npcad-toggle-row">
              <label>启用扩展</label>
              <input type="checkbox" data-setting="enabled" ${enabledChecked} />
            </div>
            <div class="npcad-form-row npcad-toggle-row">
              <label>要求主 AI 输出行动区块</label>
              <input type="checkbox" data-setting="actionReportEnabled" ${actionChecked} />
            </div>
            <div class="npcad-form-row npcad-toggle-row">
              <label>自动隐藏行动区块</label>
              <input type="checkbox" data-setting="hideActionBlockFromMessage" ${hideActionChecked} />
            </div>
            <div class="npcad-form-row npcad-toggle-row">
              <label>启用悬浮行动窗</label>
              <input type="checkbox" data-setting="floatingWindowEnabled" ${floatingChecked} />
            </div>
            <div class="npcad-form-row">
              <label>悬浮窗展示条数</label>
              <input type="number" min="1" max="12" step="1" value="${escapeHtml(settings.floatingWindowItems)}" data-setting="floatingWindowItems" />
            </div>
            <div class="npcad-form-row">
              <label>提示词注入深度</label>
              <input type="number" min="0" max="10" step="1" value="${escapeHtml(settings.promptDepth)}" data-setting="promptDepth" />
            </div>
            <div class="npcad-form-row">
              <label>历史记录条数</label>
              <input type="number" min="1" max="24" step="1" value="${escapeHtml(settings.historyLimit)}" data-setting="historyLimit" />
            </div>
            <div class="npcad-form-row">
              <label>全局附加限制</label>
              <textarea rows="4" data-setting="globalExtraInstruction" placeholder="例如：行动要更偏宫廷权谋；避免过快进入亲密表达。">${escapeHtml(settings.globalExtraInstruction)}</textarea>
            </div>
            <div class="npcad-summary-box npcad-action-format-box">
              <div class="npcad-summary-title">固定行动区块格式</div>
              <div>${escapeHtml(ACTION_BLOCK_OPEN)}</div>
              <div>角色名::一句话行动描述</div>
              <div>${escapeHtml(ACTION_BLOCK_CLOSE)}</div>
            </div>
          </section>

          <section class="npcad-card">
            <div class="npcad-card-title">当前角色摘要</div>
            <div class="npcad-summary-grid">
              <div>
                <div class="npcad-summary-title">穿搭摘要</div>
                <div class="npcad-summary-box">${escapeHtml(appearanceSummary)}</div>
              </div>
              <div>
                <div class="npcad-summary-title">行为摘要</div>
                <div class="npcad-summary-box">${escapeHtml(behaviorSummary)}</div>
              </div>
            </div>
          </section>

          <section class="npcad-card">
            <div class="npcad-card-title">当前角色历史</div>
            <div class="npcad-history">
              ${history.length
                ? history
                    .map(
                      item => `
                        <div class="npcad-history-item">
                          <div class="npcad-history-head">
                            <strong>${escapeHtml(item.title || '记录')}</strong>
                            <span>回合 ${escapeHtml(item.turn || 0)} · ${escapeHtml(item.at || '')}</span>
                          </div>
                          <div>${escapeHtml(item.detail || '')}</div>
                        </div>
                      `,
                    )
                    .join('')
                : '<div class="npcad-empty">当前角色还没有演化记录。</div>'}
            </div>
          </section>
        </div>
      </div>
    </div>
  `;
}

function isDrawerOpen() {
  try {
    return localStorage.getItem(DRAWER_STATE_KEY) === '1';
  } catch {
    return false;
  }
}

function setDrawerOpenState(isOpen) {
  try {
    localStorage.setItem(DRAWER_STATE_KEY, isOpen ? '1' : '0');
  } catch {
  }
}

function isFloatCollapsed() {
  try {
    return localStorage.getItem(FLOAT_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function setFloatCollapsed(isCollapsed) {
  try {
    localStorage.setItem(FLOAT_COLLAPSED_KEY, isCollapsed ? '1' : '0');
  } catch {
  }
}

function getFloatPosition() {
  try {
    const raw = localStorage.getItem(FLOAT_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.x !== 'number' || typeof parsed.y !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setFloatPosition(position) {
  try {
    if (!position) {
      localStorage.removeItem(FLOAT_POSITION_KEY);
      return;
    }
    localStorage.setItem(FLOAT_POSITION_KEY, JSON.stringify(position));
  } catch {
  }
}

function getFloatEffectiveState(settings = getSettings()) {
  const autoCollapsed = settings.autoCollapseOutsideCharacterChat && !isInteractionContextActive();
  return {
    collapsed: autoCollapsed || isFloatCollapsed(),
    autoCollapsed,
  };
}

function getFloatStyle(settings = getSettings()) {
  const width = clamp(Number(settings.floatingWindowWidth) || DEFAULT_SETTINGS.floatingWindowWidth, 260, 720);
  const maxHeight = clamp(Number(settings.floatingWindowMaxHeight) || DEFAULT_SETTINGS.floatingWindowMaxHeight, 20, 80);
  const position = getFloatPosition();
  const styles = [
    `--npcad-float-width:${width}px`,
    `--npcad-float-max-height:${maxHeight}vh`,
  ];
  if (position) {
    styles.push(`left:${position.x}px`);
    styles.push(`top:${position.y}px`);
    styles.push('right:auto');
    styles.push('bottom:auto');
  }
  return styles.join('; ');
}

function ensurePanelMount() {
  let root = document.getElementById(PANEL_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = PANEL_ID;
    const mountTarget = document.querySelector('#extensions_settings');
    if (!mountTarget) return null;
    mountTarget.append(root);
  }
  return root;
}

function ensureFloatMount() {
  let root = document.getElementById(FLOAT_PANEL_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = FLOAT_PANEL_ID;
    document.body.append(root);
  }
  return root;
}

function ensureModalMount() {
  let root = document.getElementById(FLOAT_MODAL_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = FLOAT_MODAL_ID;
    document.body.append(root);
  }
  return root;
}

function createFloatingHtml(state = ensureState(), settings = getSettings()) {
  if (!settings.floatingWindowEnabled) {
    return '';
  }

  const roles = state.roles.filter(role => role.enabled);
  if (!roles.length) {
    return '';
  }

  const { collapsed, autoCollapsed } = getFloatEffectiveState(settings);
  const visibleItems = clamp(Number(settings.floatingWindowItems) || DEFAULT_SETTINGS.floatingWindowItems, 1, 12);
  const floatStyle = getFloatStyle(settings);
  const selectedRole = getSelectedRole(state);
  const roleItems = roles
    .slice(0, visibleItems)
    .map(
      role => `
        <button type="button" class="npcad-float-item ${role.id === selectedRole.id ? 'is-active' : ''}" data-role-select="${escapeHtml(role.id)}" data-open-modal="1">
          <div class="npcad-float-item-name">${escapeHtml(role.name)}</div>
          <div class="npcad-float-item-action">${escapeHtml(role.currentAction || '暂无行动记录')}</div>
        </button>
      `,
    )
    .join('');

  return `
    <div class="npcad-float ${collapsed ? 'is-collapsed' : ''} ${autoCollapsed ? 'is-context-collapsed' : ''}" style="${escapeHtml(floatStyle)}">
      <div class="npcad-float-head" data-float-drag-handle="1">
        <button type="button" class="npcad-float-title" data-open-modal="1" ${autoCollapsed ? 'disabled' : ''}>${autoCollapsed ? '进入单聊或群聊后展开行动' : '受控角色行动'}</button>
        <div class="npcad-float-actions">
          <button type="button" class="npcad-icon-button" data-action="toggle-float" title="折叠/展开" ${autoCollapsed ? 'disabled' : ''}><i class="fa-solid ${collapsed ? 'fa-up-right-and-down-left-from-center' : 'fa-compress'}"></i></button>
          <button type="button" class="npcad-icon-button" data-open-modal="1" title="放大查看" ${autoCollapsed ? 'disabled' : ''}><i class="fa-solid fa-expand"></i></button>
        </div>
      </div>
      <div class="npcad-float-meta">${autoCollapsed ? '当前不在可交互聊天上下文中，悬浮窗已自动收缩。' : `当前角色：${escapeHtml(selectedRole.name)} · 点击条目可切换角色`}</div>
      <div class="npcad-float-body">${roleItems}</div>
    </div>
  `;
}

function createModalHtml(state = ensureState()) {
  const roles = state.roles.filter(role => role.enabled);
  return `
    <div class="npcad-modal-backdrop is-hidden" data-modal-close="1">
      <div class="npcad-modal" role="dialog" aria-modal="true" aria-label="受控角色行动详情">
        <div class="npcad-modal-head">
          <div>
            <div class="npcad-card-title">受控角色当前行动</div>
            <div class="npcad-modal-subtitle">点击角色卡可切换当前编辑对象</div>
          </div>
          <button type="button" class="npcad-icon-button" data-modal-close="1"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="npcad-modal-grid">
          ${roles.length
            ? roles
                .map(
                  role => `
                    <button type="button" class="npcad-modal-role ${role.id === state.selectedRoleId ? 'is-active' : ''}" data-role-select="${escapeHtml(role.id)}" data-modal-keep="1">
                      <div class="npcad-modal-role-name">${escapeHtml(role.name)}</div>
                      <div class="npcad-modal-role-action">${escapeHtml(role.currentAction || '暂无行动记录')}</div>
                      <div class="npcad-modal-role-meta">目标：${escapeHtml(role.currentGoal || '暂无')}</div>
                    </button>
                  `,
                )
                .join('')
            : '<div class="npcad-empty">暂无启用角色。</div>'}
        </div>
      </div>
    </div>
  `;
}

async function renderPanel() {
  const root = ensurePanelMount();
  if (!root) return;
  const state = await ensureRolesInitialized();
  root.innerHTML = createPanelHtml(state);

  const drawer = root.querySelector('.inline-drawer');
  const content = root.querySelector('.inline-drawer-content');
  const icon = root.querySelector('.inline-drawer-icon');
  const open = isDrawerOpen();

  if (drawer && content) {
    drawer.classList.toggle('open', open);
    content.style.display = open ? 'block' : 'none';
  }

  if (icon) {
    icon.classList.toggle('down', !open);
    icon.classList.toggle('up', open);
    icon.classList.toggle('fa-circle-chevron-down', !open);
    icon.classList.toggle('fa-circle-chevron-up', open);
  }
}

async function renderFloatingWidgets() {
  const state = await ensureRolesInitialized();
  const settings = getSettings();
  const floatRoot = ensureFloatMount();
  const modalRoot = ensureModalMount();
  if (floatRoot) {
    floatRoot.innerHTML = createFloatingHtml(state, settings);
  }
  if (modalRoot) {
    modalRoot.innerHTML = createModalHtml(state);
  }
}

async function renderAll() {
  // 记录当前聚焦的字段标识
  const activeEl = document.activeElement;
  let focusKey = null;
  if (activeEl) {
    const fieldEl = activeEl.closest('[data-role-field]');
    if (fieldEl) focusKey = fieldEl.dataset.roleField;
  }

  await renderPanel();
  await renderFloatingWidgets();

  // 恢复焦点
  if (focusKey) {
    const newEl = document.querySelector(`#${PANEL_ID} [data-role-field="${focusKey}"]`);
    if (newEl) {
      newEl.focus();
      if (newEl.setSelectionRange) {
        const len = newEl.value.length;
        newEl.setSelectionRange(len, len);
      }
    }
  }
}

function coerceSettingValue(key, rawValue) {
  if (['enabled', 'actionReportEnabled', 'hideActionBlockFromMessage', 'floatingWindowEnabled', 'autoCollapseOutsideCharacterChat'].includes(key)) {
    return Boolean(rawValue);
  }
  if (['externalAiBaseUrl', 'externalAiApiKey', 'externalAiModel'].includes(key)) {
    return String(rawValue ?? '');
  }
  if (['externalAiEnabled'].includes(key)) {
    return Boolean(rawValue);
  }
  if (["promptDepth","historyLimit","floatingWindowItems","floatingWindowWidth","floatingWindowMaxHeight"].includes(key)) {
    return Number(rawValue);
  }
  return String(rawValue ?? '');
}

function coerceRoleFieldValue(role, key, rawValue) {
  if (key === 'enabled') {
    return Boolean(rawValue);
  }
  if (['autonomyIntensity', 'goalTurnInterval', 'appearanceStep', 'behaviorStep'].includes(key)) {
    return Number(rawValue);
  }
  if (key === 'appearanceStages') {
    return normalizeStageList(splitLines(rawValue), getAppearanceArcById(role.appearanceArcId).stages);
  }
  if (key === 'behaviorStages') {
    return normalizeStageList(splitLines(rawValue), getBehaviorArcById(role.behaviorArcId).stages);
  }
  if (key === 'goalTemplates.early' || key === 'goalTemplates.middle' || key === 'goalTemplates.late') {
    return splitLines(rawValue);
  }
  return String(rawValue ?? '');
}

async function updateSelectedRoleField(key, rawValue) {
  const state = await ensureRolesInitialized();
  const selectedRole = getSelectedRole(state);
  const coerced = coerceRoleFieldValue(selectedRole, key, rawValue);
  const nextRole = { ...selectedRole };

  if (key.startsWith('goalTemplates.')) {
    const bucket = key.split('.')[1];
    nextRole.goalTemplates = cloneGoalTemplates(selectedRole.goalTemplates);
    nextRole.goalTemplates[bucket] = coerced.length ? coerced : [...GOAL_TEMPLATES[bucket]];
  } else if (key === 'appearanceArcId') {
    const nextArc = getAppearanceArcById(coerced);
    nextRole.appearanceArcId = nextArc.id;
    nextRole.appearanceStages = normalizeStageList(selectedRole.appearanceStages, nextArc.stages);
  } else if (key === 'behaviorArcId') {
    const nextArc = getBehaviorArcById(coerced);
    nextRole.behaviorArcId = nextArc.id;
    nextRole.behaviorStages = normalizeStageList(selectedRole.behaviorStages, nextArc.stages);
  } else if (key === 'customLongTermDrive') {
    nextRole.customLongTermDrive = coerced;
    nextRole.longTermDrive = String(coerced || '').trim() || pickDeterministic(LONG_TERM_DRIVES, `${selectedRole.seed}:drive`);
  } else if (key === 'currentGoal') {
    nextRole.currentGoal = String(coerced || '').trim();
    nextRole.goalChain = createGoalChainState({
      ...selectedRole.goalChain,
      early: {
        ...getGoalLayer(selectedRole, 'early'),
        goal: nextRole.currentGoal,
        completed: false,
        progressSignals: 0,
        lastUpdatedAt: new Date().toISOString(),
        completionLockedAt: '',
      },
    });
  } else {
    nextRole[key] = coerced;
  }

  await updateRole(selectedRole.id, () => ({
    ...nextRole,
    updatedAt: new Date().toISOString(),
  }));
  await syncPrompt();
  await renderAll();
}

async function resetSelectedRoleState() {
  const state = await ensureRolesInitialized();
  const selectedRole = getSelectedRole(state);
  const replacement = buildDefaultRole(selectedRole.name, selectedRole.name);
  replacement.id = selectedRole.id;
  await updateRole(selectedRole.id, () => ({ ...replacement, id: selectedRole.id, name: selectedRole.name }));
  await syncPrompt();
  await renderAll();
}

async function resetSelectedRoleStages() {
  const state = await ensureRolesInitialized();
  const selectedRole = getSelectedRole(state);
  const appearanceArc = getAppearanceArcById(selectedRole.appearanceArcId);
  const behaviorArc = getBehaviorArcById(selectedRole.behaviorArcId);
  await updateRole(selectedRole.id, role => ({
    ...role,
    appearanceStages: [...appearanceArc.stages],
    behaviorStages: [...behaviorArc.stages],
    goalTemplates: role.goalTemplates || cloneGoalTemplates(GOAL_TEMPLATES),
    goalChain: createGoalChainState(),
    currentGoal: '',
    updatedAt: new Date().toISOString(),
  }));
  await syncPrompt();
  await renderAll();
}

async function deleteSelectedRole() {
  const state = await ensureRolesInitialized();
  if (state.roles.length <= 1) {
    toastr.warning('至少保留一个受控角色。', 'NPC 多角色自主性导演');
    return;
  }
  const selectedRole = getSelectedRole(state);
  const confirmed = window.confirm(`确定删除受控角色“${selectedRole.name}”吗？`);
  if (!confirmed) return;

  const nextRoles = state.roles.filter(role => role.id !== selectedRole.id);
  saveChatState({
    ...state,
    roles: nextRoles,
    selectedRoleId: nextRoles[0]?.id || '',
    updatedAt: new Date().toISOString(),
  });
  await syncPrompt();
  await renderAll();
  toastr.success(`已删除受控角色：${selectedRole.name}`, 'NPC 多角色自主性导演');
}

async function addRoleFromInput() {
  const input = document.getElementById('npcad-new-role-name');
  const name = String(input?.value || '').trim();
  if (!name) {
    toastr.warning('请先输入角色名称。', 'NPC 多角色自主性导演');
    input?.focus();
    return;
  }

  const state = await ensureRolesInitialized();
  const exists = state.roles.some(role => normalizeNameKey(role.name) === normalizeNameKey(name));
  if (exists) {
    toastr.warning('已存在同名受控角色，请换个名字。', 'NPC 多角色自主性导演');
    input?.focus();
    return;
  }

  const nextRole = await ensureRoleInitialized(buildDefaultRole(name, name));
  saveChatState({
    ...state,
    roles: [...state.roles, nextRole],
    selectedRoleId: nextRole.id,
    updatedAt: new Date().toISOString(),
  });
  if (input) {
    input.value = '';
  }
  await syncPrompt();
  await renderAll();
  toastr.success(`已新增受控角色：${name}`, 'NPC 多角色自主性导演');
}

let floatDragState = null;

function openModal() {
  if (!isInteractionContextActive()) {
    return;
  }
  const modal = document.querySelector(`#${FLOAT_MODAL_ID} .npcad-modal-backdrop`);
  modal?.classList.remove('is-hidden');
}

function closeModal() {
  const modal = document.querySelector(`#${FLOAT_MODAL_ID} .npcad-modal-backdrop`);
  modal?.classList.add('is-hidden');
}

function clampFloatPosition(x, y, element) {
  const width = element?.offsetWidth || 360;
  const height = element?.offsetHeight || 120;
  const maxX = Math.max(12, window.innerWidth - width - 12);
  const maxY = Math.max(12, window.innerHeight - height - 12);
  return {
    x: clamp(Number(x) || 12, 12, maxX),
    y: clamp(Number(y) || 12, 12, maxY),
  };
}

function beginFloatDrag(event) {
  const handle = event.target.closest('[data-float-drag-handle]');
  if (!handle || event.target.closest('button')) {
    return;
  }
  const floatPanel = document.querySelector(`#${FLOAT_PANEL_ID} .npcad-float`);
  if (!floatPanel) return;
  const rect = floatPanel.getBoundingClientRect();
  floatDragState = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    originX: rect.left,
    originY: rect.top,
  };
  event.preventDefault();
  handle.setPointerCapture(event.pointerId);
}

function updateFloatDrag(event) {
  if (!floatDragState) return;
  const floatPanel = document.querySelector(`#${FLOAT_PANEL_ID} .npcad-float`);
  if (!floatPanel) return;
  const nextX = floatDragState.originX + (event.clientX - floatDragState.pointerX);
  const nextY = floatDragState.originY + (event.clientY - floatDragState.pointerY);
  const clamped = clampFloatPosition(nextX, nextY, floatPanel);
  floatPanel.style.left = `${clamped.x}px`;
  floatPanel.style.top = `${clamped.y}px`;
  floatPanel.style.right = 'auto';
  floatPanel.style.bottom = 'auto';
}

function endFloatDrag() {
  if (!floatDragState) return;
  const floatPanel = document.querySelector(`#${FLOAT_PANEL_ID} .npcad-float`);
  if (floatPanel) {
    const rect = floatPanel.getBoundingClientRect();
    setFloatPosition(clampFloatPosition(rect.left, rect.top, floatPanel));
  }
  floatDragState = null;
}

function bindPanelEvents() {
  $(document).off('.npcad');
  $(document).off('.npcad-drag');

  $(document).on('inline-drawer-toggle.npcad', `#${PANEL_ID} .inline-drawer`, event => {
    const drawer = event.target?.closest?.('.inline-drawer') || event.currentTarget;
    const isOpen = drawer?.classList?.contains('open');
    setDrawerOpenState(Boolean(isOpen));
  });

  $(document).on('change.npcad input.npcad', `#${PANEL_ID} [data-setting]`, async event => {
    const element = event.target.closest('[data-setting]');
    if (!element) return;
    const key = element.dataset.setting;
    const rawValue = element.type === 'checkbox' ? element.checked : element.value;
    saveSettings({ [key]: coerceSettingValue(key, rawValue) });
    await syncPrompt();
    await renderAll();
  });

  $(document).on('change.npcad input.npcad', `#${PANEL_ID} [data-role-field]`, async event => {
    const element = event.target.closest('[data-role-field]');
    if (!element) return;
    const key = element.dataset.roleField;
    const rawValue = element.type === 'checkbox' ? element.checked : element.value;
    await updateSelectedRoleField(key, rawValue);
  });

  $(document).on('click.npcad', '[data-role-select]', async event => {
    const button = event.target.closest('[data-role-select]');
    if (!button) return;
    const roleId = button.dataset.roleSelect;
    const state = await ensureRolesInitialized();
    if (!state.roles.some(role => role.id === roleId)) return;
    saveChatState({ ...state, selectedRoleId: roleId, updatedAt: new Date().toISOString() });
    await syncPrompt();
    await renderAll();
    if (button.dataset.openModal === '1' && isInteractionContextActive()) {
      openModal();
    }
  });

  $(document).on('click.npcad', `#${PANEL_ID} [data-action], #${FLOAT_PANEL_ID} [data-action]`, async event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;

    if (action === 'add-role') {
      await addRoleFromInput();
      return;
    }

    if (action === 'advance') {
      const state = await ensureRolesInitialized();
      const selectedRole = getSelectedRole(state);
      await updateRole(selectedRole.id, role => advanceRole(role, 'manual'));
      await syncPrompt();
      await renderAll();
      toastr.success('已推进当前角色一轮自主性演化。', 'NPC 多角色自主性导演');
      return;
    }

    if (action === 'goal') {
      const state = await ensureRolesInitialized();
      const selectedRole = getSelectedRole(state);
      await updateRole(selectedRole.id, role => rotateGoalForRole(role, getCurrentIdentifiers(), true));
      await syncPrompt();
      await renderAll();
      toastr.success('已按锁定规则刷新当前角色目标链。', 'NPC 多角色自主性导演');
      return;
    }

    if (action === 'sync') {
      await syncPrompt();
      await renderAll();
      toastr.success('提示词已同步。', 'NPC 多角色自主性导演');
      return;
    }

    if (action === 'reset-role') {
      const confirmed = window.confirm('确定要重置当前受控角色的状态吗？');
      if (!confirmed) return;
      await resetSelectedRoleState();
      toastr.success('当前受控角色已重置。', 'NPC 多角色自主性导演');
      return;
    }

    if (action === 'delete-role') {
      await deleteSelectedRole();
      return;
    }

    if (action === 'reset-stages') {
      await resetSelectedRoleStages();
      toastr.success('当前角色的阶段与目标池已恢复默认。', 'NPC 多角色自主性导演');
      return;
    }

    if (action === 'toggle-float') {
      if (!isInteractionContextActive()) return;
      setFloatCollapsed(!isFloatCollapsed());
      await renderFloatingWidgets();
    }
  });

  $(document).on('click.npcad', '[data-open-modal]', event => {
    const button = event.target.closest('[data-open-modal]');
    if (!button) return;
    openModal();
  });

  $(document).on('click.npcad', `#${FLOAT_MODAL_ID} [data-modal-close], #${FLOAT_MODAL_ID} .npcad-modal-backdrop`, event => {
    const clickedClose = event.target.closest('[data-modal-close]');
    const clickedBackdrop = event.target.classList?.contains('npcad-modal-backdrop');
    if (!clickedClose && !clickedBackdrop) {
      return;
    }
    closeModal();
  });

  $(document).on('pointerdown.npcad-drag', `#${FLOAT_PANEL_ID} [data-float-drag-handle]`, beginFloatDrag);
  $(document).on('pointermove.npcad-drag', updateFloatDrag);
  $(document).on('pointerup.npcad-drag pointercancel.npcad-drag', endFloatDrag);
}

async function handleMessageReceived(messageId) {
  const ctx = getContextSafe();
  const message = ctx.chat?.[messageId];
  const settings = getSettings();
  if (!settings.enabled || !message) return;
  if (message.is_user || message.is_system) return;

  const state = await ensureRolesInitialized();
  const roles = state.roles.filter(role => role.enabled);
  if (!roles.length) return;

  const originalText = getMessageText(message);
  const { actions, hasBlock } = parseActionBlock(originalText, roles);
  let nextState = state;

  if (Object.keys(actions).length) {
    nextState = await updateState(async currentState => ({
      ...currentState,
      roles: await Promise.all(currentState.roles.map(async role => {
        if (!actions[role.id]) return role;
        const withAction = applyRoleAction(role, actions[role.id], 'llm');
        return advanceRole(withAction, 'auto');
      })),
    }));
  } else if (hasBlock) {
    nextState = await updateState(async currentState => ({
      ...currentState,
      roles: await Promise.all(currentState.roles.map(role => (role.enabled ? advanceRole(role, 'auto') : Promise.resolve(role)))),
    }));
    toastr.warning('检测到行动区块，但未匹配到任何受控角色，已回退为推进所有启用角色。', 'NPC 多角色自主性导演');
  } else {
    // 无行动区块时，推进所有启用角色
    nextState = await updateState(async currentState => ({
      ...currentState,
      roles: await Promise.all(currentState.roles.map(role => (role.enabled ? advanceRole(role, 'auto') : Promise.resolve(role)))),
    }));
    toastr.info('未检测到行动区块，已推进所有启用角色。', 'NPC 多角色自主性导演');
  }
  if (hasBlock && settings.hideActionBlockFromMessage) {
    setMessageText(message, stripActionBlock(originalText));
    persistChat();
    ctx.eventSource.emit(ctx.eventTypes.MESSAGE_UPDATED, messageId);
  }

  await syncPrompt();
  await renderAll();

  if (Object.keys(actions).length) {
    const updatedNames = nextState.roles
      .filter(role => Object.keys(actions).includes(role.id))
      .map(role => role.name)
      .join('\u3001');
    toastr.info(`已同步行动：${updatedNames}`, 'NPC 多角色自主性导演');
  }
}

function buildStatusText(role) {
  return [
    `角色：${role.name}`,
    `长期驱动力：${role.longTermDrive}`,
    `前期目标：${getGoalLayer(role, 'early').goal || '暂无'}`,
    `中期目标：${getGoalLayer(role, 'middle').goal || '暂无'}`,
    `后期目标：${getGoalLayer(role, 'late').goal || '暂无'}`,
    `最近行动：${role.currentAction || '暂无记录'}`,
    `穿搭进度：${role.appearanceProgress}%`,
    `行为进度：${role.behaviorProgress}%`,
  ].join('\n');
}

function registerSlashCommands() {
  const ctx = getContextSafe();
  const { SlashCommandParser, SlashCommand } = ctx;
  if (!SlashCommandParser?.addCommandObject || !SlashCommand?.fromProps) {
    return;
  }

  SlashCommandParser.addCommandObject(
    SlashCommand.fromProps({
      name: 'npc-auto-status',
      callback: async () => {
        const state = await ensureRolesInitialized();
        return buildStatusText(getSelectedRole(state));
      },
      returns: '当前受控角色状态文本',
      unnamedArgumentList: [],
      namedArgumentList: [],
      helpString: '<div>输出当前选中受控角色的三层目标、行动和渐变进度。</div>',
    }),
  );

  SlashCommandParser.addCommandObject(
    SlashCommand.fromProps({
      name: 'npc-auto-step',
      callback: async () => {
        const state = await ensureRolesInitialized();
        const selectedRole = getSelectedRole(state);
        const nextState = await updateRole(selectedRole.id, role => advanceRole(role, 'manual'));
        await syncPrompt();
        await renderAll();
        return `已推进 ${getSelectedRole(nextState).name}。当前前期目标：${getGoalLayer(getSelectedRole(nextState), 'early').goal || '暂无'}`;
      },
      returns: '推进后的目标说明',
      unnamedArgumentList: [],
      namedArgumentList: [],
      helpString: '<div>手动推进当前选中受控角色一轮自主性演化，并按锁定规则处理目标链。</div>',
    }),
  );

  SlashCommandParser.addCommandObject(
    SlashCommand.fromProps({
      name: 'npc-auto-reset',
      callback: async () => {
        const state = await ensureRolesInitialized();
        const selectedRole = getSelectedRole(state);
        const replacement = buildDefaultRole(selectedRole.name, selectedRole.name);
        replacement.id = selectedRole.id;
        await updateRole(selectedRole.id, () => replacement);
        await syncPrompt();
        await renderAll();
        return `已重置受控角色：${selectedRole.name}`;
      },
      returns: '重置结果',
      unnamedArgumentList: [],
      namedArgumentList: [],
      helpString: '<div>重置当前选中受控角色的状态。</div>',
    }),
  );
}

function wireEvents() {
  const ctx = getContextSafe();
  ctx.eventSource.on(ctx.eventTypes.APP_READY, async () => {
    await ensureRolesInitialized();
    await renderAll();
    await syncPrompt();
  });

  ctx.eventSource.on(ctx.eventTypes.CHAT_CHANGED, async () => {
    await ensureRolesInitialized();
    await renderAll();
    await syncPrompt();
  });

  ctx.eventSource.on(ctx.eventTypes.MESSAGE_RECEIVED, async messageId => {
    await handleMessageReceived(messageId);
  });

  ctx.eventSource.on(ctx.eventTypes.SETTINGS_UPDATED, async () => {
    await renderAll();
    await syncPrompt();
  });
}

async function bootstrap() {
  await ensureRolesInitialized();
  await renderAll();
  await syncPrompt();
  bindPanelEvents();
  registerSlashCommands();
  wireEvents();
}

jQuery(() => {
  void (async () => {
    try {
      await bootstrap();
    } catch (error) {
      console.error('[NPC 多角色自主性导演] 初始化失败', error);
      toastr.error(String(error?.message || error), 'NPC 多角色自主性导演');
    }
  })();
});
