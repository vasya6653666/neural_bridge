# Cloud config

The cloud config lets the user keep steering, custom agents, skills, powers, hooks and workflows in the web account and get
them in the IDE on every machine they sign in from.

## Where it is

Web account (`panel.neuralbridge.ru`), menu «Конфиг агента» / Agent config. Pages (Russian / English label):

- «Синхронизация» / Sync — the switch that applies the cloud config in the IDE, and a one-time upload of local settings to
  the cloud;
- «Steering», «Скиллы» / Skills, «Агенты» / Agents, «Хуки» / Hooks, «Workflows», «Powers и MCP» / Powers & MCP — one page per
  kind of file; buttons «Установить из каталога» / Install from catalog and «Загрузить папку» / Upload folder;
- «Запасная модель» / Model fallback — see below.

Whether the cloud config is included depends on the plan; the web account shows it. Do not list plans or prices.

## How the IDE uses it

- The switch is **off** for a new account. While it is off, the IDE does not use the cloud config.
- When it is on, the cloud files are connected at the start of each IDE session. Local files of the same kind always take
  precedence over cloud ones.
- In the chat the IDE shows a card **Fetching your cloud config** with the result of the sync.
- If the user turns the switch off, the IDE removes the files it synced before and the card says
  «Cloud config sync is off for your account. Your previously synced settings were removed.»
- If the sync fails, the IDE keeps using the last synced files.
- Synced hooks and powers can run commands and connect to services, with the same approvals as local ones (see
  `approvals.md`).

## Team accounts

In a company account, owners and admins manage the company's files. They can choose whether employees may only add their own
files of a kind or may not change that kind at all. Employees receive company files in the IDE.

## Fallback model

The web account has a page «Запасная модель» / Model fallback. NeuralBridge IDE does not use it yet: do not tell the user it works.

## What is not in the cloud config

MCP servers are synced only as part of powers. The agent's memory is not synced.
