import { encodeContributions, MAX_ITEMS, MAX_TITLE_LENGTH, sampleContributions } from '../contributions.js';
import { pullRequestStatus } from '../live.js';
import type { Contribution, ContributionStatus } from '../types.js';

interface Row {
  date: string;
  id: number;
  number: string;
  repo: string;
  stars: string;
  status: ContributionStatus;
  title: string;
}

type Field = Exclude<keyof Row, 'id'>;

const repoPattern = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;
const defaultTitle = 'Open Source Contributions';

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing #${id}`);
  return found as T;
}

const list = element<HTMLOListElement>('item-list');
const template = element<HTMLTemplateElement>('item-template');
const addButton = element<HTMLButtonElement>('add-item');
const counter = element<HTMLSpanElement>('counter');
const titleInput = element<HTMLInputElement>('title');
const hideTitle = element<HTMLInputElement>('hide-title');
const animation = element<HTMLInputElement>('animation');
const preview = element<HTMLImageElement>('preview');
const stage = element<HTMLDivElement>('preview-stage');
const markdown = element<HTMLInputElement>('markdown');
const copyButton = element<HTMLButtonElement>('copy');

let nextId = 0;
let rows: Row[] = sampleContributions.map((item) => ({
  date: item.date ?? '',
  id: nextId++,
  number: item.number === undefined ? '' : String(item.number),
  repo: item.repo,
  stars: item.stars === undefined ? '' : String(item.stars),
  status: item.status,
  title: item.title ?? '',
}));

function toContribution(row: Row): Contribution | null {
  const repo = row.repo.trim();
  if (!repoPattern.test(repo)) return null;
  const item: Contribution = { repo, status: row.status };
  const number = Number.parseInt(row.number, 10);
  if (number >= 1) item.number = number;
  const stars = Number.parseInt(row.stars, 10);
  if (stars >= 0) item.stars = stars;
  if (/^\d{4}-\d{2}-\d{2}$/.test(row.date)) item.date = row.date;
  if (row.title.trim()) item.title = row.title.trim();
  return item;
}

function cardUrl(): string {
  const params = new URLSearchParams();
  const items = rows.map(toContribution).filter((item): item is Contribution => item !== null);
  if (items.length > 0) params.set('items', encodeContributions(items));
  const theme = document.querySelector<HTMLInputElement>('input[name="theme"]:checked')?.value ?? 'shiny';
  if (theme !== 'shiny') params.set('theme', theme);
  const layout = document.querySelector<HTMLInputElement>('input[name="layout"]:checked')?.value ?? 'rows';
  if (layout !== 'rows') params.set('layout', layout);
  const title = titleInput.value.trim();
  if (title && title !== defaultTitle) params.set('title', title);
  if (hideTitle.checked) params.set('hide_title', 'true');
  if (!animation.checked) params.set('animation', 'false');
  params.set('v', '1');
  return `${window.location.origin}/api/card?${params}`;
}

let previewTimer: number | undefined;
function updateOutput(): void {
  const url = cardUrl();
  markdown.value = `![Open source contributions](${url})`;
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    stage.classList.add('is-loading');
    preview.src = url;
  }, 300);
}

preview.addEventListener('load', () => {
  stage.classList.remove('is-loading');
  stage.classList.remove('is-updated');
  void stage.offsetWidth;
  stage.classList.add('is-updated');
});

function renderRows(focusId?: number): void {
  list.replaceChildren();
  rows.forEach((row, index) => {
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const item = fragment.querySelector<HTMLLIElement>('.item')!;
    item.dataset.id = String(row.id);
    item.querySelector('.item-index')!.textContent = String(index + 1).padStart(2, '0');
    item.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-field]').forEach((input) => {
      input.value = row[input.dataset.field as Field];
    });
    item.classList.toggle('is-invalid', row.repo.trim() !== '' && !repoPattern.test(row.repo.trim()));
    item.querySelector<HTMLButtonElement>('[data-action="up"]')!.disabled = index === 0;
    item.querySelector<HTMLButtonElement>('[data-action="down"]')!.disabled = index === rows.length - 1;
    if (row.id === focusId) item.classList.add('is-new');
    list.append(fragment);
  });
  counter.textContent = `${rows.length} / ${MAX_ITEMS}`;
  addButton.disabled = rows.length >= MAX_ITEMS;
  if (focusId !== undefined) list.querySelector<HTMLInputElement>(`[data-id="${focusId}"] [data-field="repo"]`)?.focus();
  updateOutput();
}

list.addEventListener('input', (event) => {
  const input = event.target as HTMLInputElement | HTMLSelectElement;
  const item = input.closest<HTMLLIElement>('.item');
  const row = rows.find((candidate) => String(candidate.id) === item?.dataset.id);
  if (!row || !item || !input.dataset.field) return;
  const field = input.dataset.field as Field;
  if (field === 'status') row.status = input.value as ContributionStatus;
  else row[field] = input.value;
  if (field === 'repo') item.classList.toggle('is-invalid', row.repo.trim() !== '' && !repoPattern.test(row.repo.trim()));
  updateOutput();
});

async function githubJson(path: string): Promise<Record<string, unknown>> {
  const response = await fetch(`https://api.github.com${path}`, { headers: { Accept: 'application/vnd.github+json' } });
  if (response.status === 403 || response.status === 429) throw new Error('GitHub rate limit reached. Try again later.');
  if (!response.ok) throw new Error(response.status === 404 ? 'Not found on GitHub.' : `GitHub returned ${response.status}.`);
  return await response.json() as Record<string, unknown>;
}

// Fills the star count from the repository and, when a PR number is given,
// the title, date and state from the pull request. Runs in the visitor's
// browser, so it uses their own unauthenticated GitHub rate limit.
async function fillFromGitHub(row: Row, button: HTMLButtonElement): Promise<void> {
  const repo = row.repo.trim();
  if (!repoPattern.test(repo)) {
    list.querySelector<HTMLInputElement>(`[data-id="${row.id}"] [data-field="repo"]`)?.focus();
    return;
  }
  button.disabled = true;
  button.classList.add('is-busy');
  try {
    const number = Number.parseInt(row.number, 10);
    const [repository, pull] = await Promise.all([
      githubJson(`/repos/${repo}`),
      number >= 1 ? githubJson(`/repos/${repo}/pulls/${number}`) : Promise.resolve(null),
    ]);
    if (typeof repository.stargazers_count === 'number') row.stars = String(repository.stargazers_count);
    if (pull) {
      if (typeof pull.title === 'string') row.title = [...pull.title].slice(0, MAX_TITLE_LENGTH).join('');
      const date = pull.merged_at ?? pull.created_at;
      if (typeof date === 'string') row.date = date.slice(0, 10);
      row.status = pullRequestStatus(pull) ?? row.status;
    }
    renderRows();
  } catch (error) {
    button.disabled = false;
    button.classList.remove('is-busy');
    button.classList.add('is-error');
    button.title = error instanceof Error ? error.message : 'Could not reach GitHub.';
    window.setTimeout(() => {
      button.classList.remove('is-error');
      button.title = 'Fill from GitHub';
    }, 4000);
  }
}

list.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
  const item = button?.closest<HTMLLIElement>('.item');
  const index = rows.findIndex((row) => String(row.id) === item?.dataset.id);
  if (!button || !item || index < 0) return;
  const action = button.dataset.action;
  if (action === 'fill') {
    void fillFromGitHub(rows[index]!, button);
    return;
  }
  if (action === 'remove') {
    item.classList.add('is-leaving');
    item.addEventListener('animationend', () => {
      rows.splice(index, 1);
      renderRows();
    }, { once: true });
    return;
  }
  const target = action === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return;
  [rows[index], rows[target]] = [rows[target]!, rows[index]!];
  rows = [...rows];
  renderRows();
});

addButton.addEventListener('click', () => {
  if (rows.length >= MAX_ITEMS) return;
  const row: Row = { date: '', id: nextId++, number: '', repo: '', stars: '', status: 'merged', title: '' };
  rows.push(row);
  renderRows(row.id);
});

for (const control of [titleInput, hideTitle, animation, ...document.querySelectorAll<HTMLInputElement>('input[name="theme"], input[name="layout"]')]) {
  control.addEventListener('input', updateOutput);
}

copyButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(markdown.value);
  copyButton.textContent = 'Copied ✓';
  copyButton.classList.add('is-copied');
  window.setTimeout(() => {
    copyButton.textContent = 'Copy';
    copyButton.classList.remove('is-copied');
  }, 1400);
});

if (window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
  }, { passive: true });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((section) => revealObserver.observe(section));

renderRows();
