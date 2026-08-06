import type { Language } from '../types';

export type AdminCommandKey =
  | 'help'
  | 'give-sns'
  | 'give-card'
  | 'set-season'
  | 'clear-cache'
  | 'mock-webtoon'
  | 'low-spec';

export interface AdminCommandDefinition {
  key: AdminCommandKey;
  command: string;
  aliases: string[];
  descriptionKey: string;
  exampleKey: string;
  permissionKey: string;
  risk: 'safe' | 'confirm';
}

export interface AdminHelpItem {
  key: AdminCommandKey;
  command: string;
  description: string;
  example: string;
  permission: string;
  risk: 'safe' | 'confirm';
}

export type ParsedAdminCommand =
  | { key: 'help' }
  | { key: 'give-sns'; amount: number }
  | { key: 'give-card'; cardId: number; quantity: number }
  | { key: 'set-season'; season: string }
  | { key: 'clear-cache' }
  | { key: 'mock-webtoon' }
  | { key: 'low-spec'; enabled: boolean };

export type ParsedAdminCommandResult =
  | { ok: true; command: ParsedAdminCommand }
  | { ok: false; errorKey: string };

export const ADMIN_COMMANDS: AdminCommandDefinition[] = [
  {
    key: 'help',
    command: '/help',
    aliases: ['/help'],
    descriptionKey: 'admin_slash_desc_help',
    exampleKey: 'admin_slash_example_help',
    permissionKey: 'admin_slash_permission_guarded',
    risk: 'safe',
  },
  {
    key: 'give-sns',
    command: '/give-sns',
    aliases: ['/give-sns'],
    descriptionKey: 'admin_slash_desc_give_sns',
    exampleKey: 'admin_slash_example_give_sns',
    permissionKey: 'admin_slash_permission_guarded',
    risk: 'safe',
  },
  {
    key: 'give-card',
    command: '/give-card',
    aliases: ['/give-card'],
    descriptionKey: 'admin_slash_desc_give_card',
    exampleKey: 'admin_slash_example_give_card',
    permissionKey: 'admin_slash_permission_guarded',
    risk: 'safe',
  },
  {
    key: 'set-season',
    command: '/set-season',
    aliases: ['/set-season'],
    descriptionKey: 'admin_slash_desc_set_season',
    exampleKey: 'admin_slash_example_set_season',
    permissionKey: 'admin_slash_permission_guarded',
    risk: 'confirm',
  },
  {
    key: 'clear-cache',
    command: '/clear-cache',
    aliases: ['/clear-cache'],
    descriptionKey: 'admin_slash_desc_clear_cache',
    exampleKey: 'admin_slash_example_clear_cache',
    permissionKey: 'admin_slash_permission_guarded',
    risk: 'confirm',
  },
  {
    key: 'mock-webtoon',
    command: '/mock-webtoon',
    aliases: ['/mock-webtoon'],
    descriptionKey: 'admin_slash_desc_mock_webtoon',
    exampleKey: 'admin_slash_example_mock_webtoon',
    permissionKey: 'admin_slash_permission_guarded',
    risk: 'safe',
  },
  {
    key: 'low-spec',
    command: '/low-spec',
    aliases: ['/low-spec'],
    descriptionKey: 'admin_slash_desc_low_spec',
    exampleKey: 'admin_slash_example_low_spec',
    permissionKey: 'admin_slash_permission_guarded',
    risk: 'safe',
  },
];

const normalizeCommandToken = (token: string): string => token.trim().toLowerCase();

const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value > 0;

const getCommandDefinition = (token: string): AdminCommandDefinition | undefined => {
  const normalized = normalizeCommandToken(token);
  return ADMIN_COMMANDS.find((item) => item.aliases.includes(normalized));
};

export const isAdminSlashInput = (input: string): boolean => {
  const normalized = input.trim();
  if (!normalized.startsWith('/')) return false;
  const [firstToken = ''] = normalized.split(/\s+/);
  return Boolean(getCommandDefinition(firstToken));
};

export const parseAdminCommand = (input: string): ParsedAdminCommandResult | null => {
  const normalized = input.trim();
  if (!normalized.startsWith('/')) return null;

  const tokens = normalized.split(/\s+/);
  const commandToken = tokens[0] ?? '';
  const definition = getCommandDefinition(commandToken);
  if (!definition) return null;

  switch (definition.key) {
    case 'help':
      return { ok: true, command: { key: 'help' } };
    case 'give-sns': {
      const amount = Number.parseInt(tokens[1] ?? '', 10);
      if (!isPositiveInteger(amount)) {
        return { ok: false, errorKey: 'admin_slash_error_amount' };
      }
      return { ok: true, command: { key: 'give-sns', amount } };
    }
    case 'give-card': {
      const cardId = Number.parseInt(tokens[1] ?? '', 10);
      const quantity = Number.parseInt(tokens[2] ?? '1', 10);
      if (!isPositiveInteger(cardId)) {
        return { ok: false, errorKey: 'admin_slash_error_card_id' };
      }
      if (!isPositiveInteger(quantity)) {
        return { ok: false, errorKey: 'admin_slash_error_card_quantity' };
      }
      return { ok: true, command: { key: 'give-card', cardId, quantity } };
    }
    case 'set-season': {
      const season = tokens[1]?.trim();
      if (!season || !/^season\d+$/i.test(season)) {
        return { ok: false, errorKey: 'admin_slash_error_season' };
      }
      return { ok: true, command: { key: 'set-season', season: season.toLowerCase() } };
    }
    case 'clear-cache':
      return { ok: true, command: { key: 'clear-cache' } };
    case 'mock-webtoon':
      return { ok: true, command: { key: 'mock-webtoon' } };
    case 'low-spec': {
      const value = tokens[1]?.trim().toLowerCase();
      if (value !== 'on' && value !== 'off') {
        return { ok: false, errorKey: 'admin_slash_error_low_spec' };
      }
      return { ok: true, command: { key: 'low-spec', enabled: value === 'on' } };
    }
    default:
      return { ok: false, errorKey: 'admin_slash_error_unknown' };
  }
};

export const buildAdminHelpItems = (
  language: Language,
  translate: (key: string, lang: Language, params?: Record<string, string | number>) => string,
): AdminHelpItem[] => {
  return ADMIN_COMMANDS.map((item) => ({
    key: item.key,
    command: item.command,
    description: translate(item.descriptionKey, language),
    example: translate(item.exampleKey, language),
    permission: translate(item.permissionKey, language),
    risk: item.risk,
  }));
};
