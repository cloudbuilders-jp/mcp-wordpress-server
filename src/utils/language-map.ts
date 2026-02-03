/**
 * Markdown コードブロック言語 → Highlighting Code Block 用マッピング
 */

export interface LanguageMapping {
  langType: string;
  langName: string;
}

export const LANGUAGE_MAP: Record<string, LanguageMapping> = {
  // JavaScript variants
  javascript: { langType: 'js', langName: 'JavaScript' },
  js: { langType: 'js', langName: 'JavaScript' },
  jsx: { langType: 'jsx', langName: 'JSX' },
  typescript: { langType: 'ts', langName: 'TypeScript' },
  ts: { langType: 'ts', langName: 'TypeScript' },
  tsx: { langType: 'tsx', langName: 'TSX' },

  // Python
  python: { langType: 'py', langName: 'Python' },
  py: { langType: 'py', langName: 'Python' },

  // Web technologies
  html: { langType: 'html', langName: 'HTML' },
  css: { langType: 'css', langName: 'CSS' },
  scss: { langType: 'scss', langName: 'SCSS' },
  sass: { langType: 'sass', langName: 'Sass' },
  less: { langType: 'less', langName: 'Less' },
  json: { langType: 'json', langName: 'JSON' },
  xml: { langType: 'xml', langName: 'XML' },

  // Shell/CLI
  bash: { langType: 'bash', langName: 'Bash' },
  sh: { langType: 'bash', langName: 'Bash' },
  shell: { langType: 'bash', langName: 'Shell' },
  zsh: { langType: 'bash', langName: 'Zsh' },
  powershell: { langType: 'powershell', langName: 'PowerShell' },
  ps1: { langType: 'powershell', langName: 'PowerShell' },

  // Server-side languages
  php: { langType: 'php', langName: 'PHP' },
  ruby: { langType: 'ruby', langName: 'Ruby' },
  rb: { langType: 'ruby', langName: 'Ruby' },
  go: { langType: 'go', langName: 'Go' },
  golang: { langType: 'go', langName: 'Go' },
  rust: { langType: 'rust', langName: 'Rust' },
  java: { langType: 'java', langName: 'Java' },
  kotlin: { langType: 'kotlin', langName: 'Kotlin' },
  scala: { langType: 'scala', langName: 'Scala' },
  swift: { langType: 'swift', langName: 'Swift' },

  // C-family
  c: { langType: 'c', langName: 'C' },
  cpp: { langType: 'cpp', langName: 'C++' },
  'c++': { langType: 'cpp', langName: 'C++' },
  csharp: { langType: 'csharp', langName: 'C#' },
  cs: { langType: 'csharp', langName: 'C#' },
  objectivec: { langType: 'objectivec', langName: 'Objective-C' },

  // Data/Config formats
  sql: { langType: 'sql', langName: 'SQL' },
  mysql: { langType: 'sql', langName: 'MySQL' },
  postgresql: { langType: 'sql', langName: 'PostgreSQL' },
  yaml: { langType: 'yaml', langName: 'YAML' },
  yml: { langType: 'yaml', langName: 'YAML' },
  toml: { langType: 'toml', langName: 'TOML' },
  ini: { langType: 'ini', langName: 'INI' },

  // Markup/Text
  markdown: { langType: 'md', langName: 'Markdown' },
  md: { langType: 'md', langName: 'Markdown' },
  latex: { langType: 'latex', langName: 'LaTeX' },
  tex: { langType: 'latex', langName: 'LaTeX' },

  // Other
  diff: { langType: 'diff', langName: 'Diff' },
  docker: { langType: 'docker', langName: 'Dockerfile' },
  dockerfile: { langType: 'docker', langName: 'Dockerfile' },
  makefile: { langType: 'makefile', langName: 'Makefile' },
  nginx: { langType: 'nginx', langName: 'Nginx' },
  apache: { langType: 'apache', langName: 'Apache' },
  graphql: { langType: 'graphql', langName: 'GraphQL' },
  regex: { langType: 'regex', langName: 'Regex' },
  vim: { langType: 'vim', langName: 'Vim' },
  lua: { langType: 'lua', langName: 'Lua' },
  perl: { langType: 'perl', langName: 'Perl' },
  r: { langType: 'r', langName: 'R' },
  dart: { langType: 'dart', langName: 'Dart' },
  elixir: { langType: 'elixir', langName: 'Elixir' },
  erlang: { langType: 'erlang', langName: 'Erlang' },
  haskell: { langType: 'haskell', langName: 'Haskell' },
  clojure: { langType: 'clojure', langName: 'Clojure' },
};

/**
 * 言語識別子から Highlighting Code Block 用のマッピングを取得
 * マップにない場合は言語名をそのまま使用
 */
export function getLanguageMapping(lang: string | undefined): LanguageMapping | null {
  if (!lang) return null;

  const normalized = lang.toLowerCase().trim();

  if (LANGUAGE_MAP[normalized]) {
    return LANGUAGE_MAP[normalized];
  }

  // マップにない場合は言語名をそのまま使用（先頭大文字）
  return {
    langType: normalized,
    langName: normalized.charAt(0).toUpperCase() + normalized.slice(1),
  };
}
