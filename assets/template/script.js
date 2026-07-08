const data = window.resumeData;
const avatarStorageKey = "html-resume-avatar";

const text = (value) => document.createTextNode(value || "");

function createElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.append(text(content));
  return element;
}

function initials(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

function renderBasics() {
  document.title = `${data.basics.name} - ${data.basics.title}`;
  document.getElementById("candidate-name").textContent = data.basics.name;
  document.getElementById("candidate-target").textContent = data.basics.intent;
  document.getElementById("candidate-summary").textContent = data.basics.summary;
  document.getElementById("avatar-fallback").textContent = initials(data.basics.name);

  const contacts = [
    ["所在地", data.basics.location],
    ["手机", data.basics.phone],
    ["邮箱", data.basics.email],
    ["方向", data.basics.title]
  ];

  const container = document.getElementById("contact-info");
  contacts.forEach(([label, value]) => {
    const item = createElement("article", "contact-item");
    item.append(createElement("strong", "", label));
    item.append(createElement("span", "", value));
    container.append(item);
  });
}

function setAvatar(source) {
  const avatar = document.getElementById("candidate-avatar");
  const fallback = document.getElementById("avatar-fallback");

  if (!source) {
    avatar.hidden = true;
    avatar.removeAttribute("src");
    fallback.hidden = false;
    return;
  }

  avatar.src = source;
  avatar.hidden = false;
  fallback.hidden = true;
}

function renderAvatar() {
  setAvatar(localStorage.getItem(avatarStorageKey) || data.basics.avatar);
}

function renderPositioning() {
  const container = document.querySelector('[data-list="positioning"]');
  data.positioning.forEach((item) => {
    container.append(createElement("li", "", item));
  });
}

function renderHighlights() {
  const container = document.querySelector('[data-list="highlights"]');
  data.highlights.forEach((item) => {
    const article = createElement("article", "highlight-card");
    article.append(createElement("strong", "", item.label));
    article.append(createElement("span", "", item.value));
    container.append(article);
  });
}

function renderExperience() {
  const container = document.querySelector('[data-list="experience"]');

  data.experience.forEach((item) => {
    const article = createElement("article", "timeline-item");
    const header = createElement("header", "item-header");
    const titleWrap = createElement("div");
    const meta = [item.role, item.location].filter(Boolean).join(" · ");

    titleWrap.append(createElement("h4", "", item.company));
    titleWrap.append(createElement("p", "role", meta));
    header.append(titleWrap);
    header.append(createElement("time", "", item.period));
    article.append(header);
    article.append(createElement("p", "item-summary", item.summary));

    if (item.achievements?.length) {
      const list = createElement("ul", "achievement-list");
      item.achievements.forEach((achievement) => {
        list.append(createElement("li", "", achievement));
      });
      article.append(list);
    }

    container.append(article);
  });
}

function renderProjects() {
  const container = document.querySelector('[data-list="projects"]');

  data.projects.forEach((item) => {
    const article = createElement("article", "mini-card");
    const header = createElement("header", "mini-header");
    header.append(createElement("h4", "", item.name));
    header.append(createElement("time", "", item.period));
    article.append(header);
    article.append(createElement("p", "", item.description));
    container.append(article);
  });
}

function renderEducation() {
  const container = document.querySelector('[data-list="education"]');

  data.education.forEach((item) => {
    const article = createElement("article", "mini-card");
    const header = createElement("header", "mini-header");
    header.append(createElement("h4", "", item.school));
    header.append(createElement("time", "", item.period));
    article.append(header);
    article.append(createElement("p", "", `${item.degree} · ${item.location}`));
    article.append(createElement("p", "muted-line", item.honors));
    container.append(article);
  });
}

function renderSkills() {
  const board = document.getElementById("skill-board");
  const groups = [
    ["证书", data.credentials],
    ["金融/分析", data.skills.finance],
    ["工具", data.skills.tools],
    ["语言", data.skills.languages]
  ];

  groups.forEach(([label, values]) => {
    const group = createElement("article", "skill-group");
    group.append(createElement("h4", "", label));
    const tags = createElement("div", "tag-list");
    values.forEach((value) => tags.append(createElement("span", "", value)));
    group.append(tags);
    board.append(group);
  });
}

function toMarkdown() {
  const lines = [
    `# ${data.basics.name} - ${data.basics.title}`,
    "",
    data.basics.intent,
    "",
    `所在地：${data.basics.location}`,
    `手机：${data.basics.phone}`,
    `邮箱：${data.basics.email}`,
    "",
    "## 个人定位",
    data.basics.summary,
    "",
    ...data.positioning.map((item) => `- ${item}`),
    "",
    "## 核心优势",
    ...data.highlights.map((item) => `- **${item.label}：**${item.value}`),
    "",
    "## 工作经历"
  ];

  data.experience.forEach((item) => {
    lines.push("", `### ${item.company} - ${item.role}`, `${item.location} | ${item.period}`, "", item.summary);
    item.achievements.forEach((achievement) => lines.push(`- ${achievement}`));
  });

  lines.push("", "## 项目与研究");
  data.projects.forEach((item) => {
    lines.push("", `### ${item.name}`, `${item.period}`, item.description);
  });

  lines.push("", "## 教育背景");
  data.education.forEach((item) => {
    lines.push("", `### ${item.school}`, `${item.degree} | ${item.location} | ${item.period}`, item.honors);
  });

  lines.push("", "## 证书与技能");
  lines.push(`- 证书：${data.credentials.join(" / ")}`);
  lines.push(`- 金融/分析：${data.skills.finance.join(" / ")}`);
  lines.push(`- 工具：${data.skills.tools.join(" / ")}`);
  lines.push(`- 语言：${data.skills.languages.join(" / ")}`);

  return lines.join("\n");
}

async function copyToClipboard(value, button) {
  await navigator.clipboard.writeText(value);
  const original = button.textContent;
  button.textContent = "已复制";
  setTimeout(() => {
    button.textContent = original;
  }, 1400);
}

function bindActions() {
  document.getElementById("avatar-upload").addEventListener("change", (event) => {
    const [file] = event.currentTarget.files;
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      localStorage.setItem(avatarStorageKey, reader.result);
      setAvatar(reader.result);
    });
    reader.readAsDataURL(file);
  });

  document.querySelector('[data-action="clear-avatar"]').addEventListener("click", () => {
    localStorage.removeItem(avatarStorageKey);
    document.getElementById("avatar-upload").value = "";
    setAvatar(data.basics.avatar);
  });

  document.querySelector('[data-action="print"]').addEventListener("click", () => window.print());
  document.querySelector('[data-action="copy-markdown"]').addEventListener("click", (event) => {
    copyToClipboard(toMarkdown(), event.currentTarget);
  });
  document.querySelector('[data-action="copy-json"]').addEventListener("click", (event) => {
    copyToClipboard(JSON.stringify(data, null, 2), event.currentTarget);
  });
}

renderBasics();
renderAvatar();
renderPositioning();
renderHighlights();
renderExperience();
renderProjects();
renderEducation();
renderSkills();
bindActions();
