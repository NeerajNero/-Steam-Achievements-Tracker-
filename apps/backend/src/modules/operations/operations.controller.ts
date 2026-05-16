import { Controller, Get, Header, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class OperationsController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getHome(): string {
    return renderPage({
      title: 'Steam Achievement Tracker',
      eyebrow: 'Local backend',
      body: `
        <section class="hero">
          <div>
            <h1>Steam Achievement Tracker</h1>
            <p>Use the local backend tools below to inspect the API contract and sync queue health.</p>
          </div>
          <div class="actions">
            <a class="button primary" href="/docs">API Docs</a>
            <a class="button" href="/queues">BullMQ Dashboard</a>
          </div>
        </section>
        <section class="grid">
          <a class="tile" href="/health">
            <span>Health</span>
            <strong>Backend status</strong>
          </a>
          <a class="tile" href="/openapi.json">
            <span>OpenAPI JSON</span>
            <strong>Raw contract</strong>
          </a>
          <a class="tile" href="/bull-dashboard">
            <span>Dashboard Alias</span>
            <strong>Queue redirect</strong>
          </a>
        </section>
      `,
    });
  }

  @Get('bull-dashboard')
  @Redirect('/queues', 302)
  getBullDashboardRedirect(): { url: string } {
    return { url: '/queues' };
  }
}

function renderPage(input: {
  title: string;
  eyebrow: string;
  body: string;
}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(input.title)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f7f8fa;
        color: #172033;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: #f7f8fa;
      }

      main {
        width: min(980px, calc(100% - 32px));
        margin: 0 auto;
        padding: 48px 0;
      }

      .eyebrow {
        margin: 0 0 12px;
        color: #647084;
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .hero,
      .tile {
        border: 1px solid #d8dee8;
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(23, 32, 51, 0.06);
      }

      .hero {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 32px;
      }

      h1 {
        margin: 0;
        font-size: 32px;
        line-height: 1.15;
        letter-spacing: 0;
      }

      p {
        margin: 12px 0 0;
        max-width: 620px;
        color: #4a5668;
        line-height: 1.55;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: flex-end;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 18px;
        border: 1px solid #b9c2d1;
        border-radius: 6px;
        color: #172033;
        text-decoration: none;
        font-weight: 700;
        white-space: nowrap;
      }

      .button.primary {
        border-color: #2563eb;
        background: #2563eb;
        color: #ffffff;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin-top: 16px;
      }

      .tile {
        display: block;
        padding: 20px;
        color: inherit;
        text-decoration: none;
      }

      .tile span {
        display: block;
        color: #647084;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .tile strong {
        display: block;
        margin-top: 8px;
        font-size: 18px;
      }

      @media (max-width: 720px) {
        main {
          width: min(100% - 20px, 980px);
          padding: 20px 0;
        }

        .hero {
          align-items: stretch;
          flex-direction: column;
          padding: 22px;
        }

        .actions {
          justify-content: stretch;
        }

        .button {
          flex: 1 1 auto;
        }

        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">${escapeHtml(input.eyebrow)}</p>
      ${input.body}
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
