import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error type error without @types/node package
import process from "node:process";
const host = process.env.TAURI_DEV_HOST;

// Almacén seguro en memoria para enlaces efímeros de un solo uso
const ephemeralShares = new Map<
  string,
  { ciphertext: string; nonce: string; expiresAt: number; consumed: boolean; consumedAt?: number }
>();

function ephemeralSharePlugin() {
  return {
    name: "ephemeral-share-plugin",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.method === "POST" && req.url === "/api/shares") {
          let body = "";
          req.on("data", (chunk: any) => (body += chunk));
          req.on("end", () => {
            try {
              const { shareId, ciphertext, nonce, ttlMinutes } = JSON.parse(body);
              ephemeralShares.set(shareId, {
                ciphertext,
                nonce,
                expiresAt: Date.now() + (ttlMinutes || 60) * 60 * 1000,
                consumed: false,
              });
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, shareId }));
            } catch (err: any) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (req.method === "GET" && req.url?.startsWith("/api/shares/")) {
          const shareId = req.url.replace("/api/shares/", "").split("?")[0];
          const record = ephemeralShares.get(shareId);

          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          res.setHeader("Surrogate-Control", "no-store");
          res.setHeader("Content-Type", "application/json");

          if (!record) {
            res.writeHead(410);
            res.end(
              JSON.stringify({
                error: "Este enlace de un solo uso no existe o ya ha sido consumido y destruido permanentemente.",
              })
            );
            return;
          }

          if (record.consumed) {
            // Tolerancia de 2.5s para evitar fallos por doble montaje de React.StrictMode en desarrollo
            if (record.consumedAt && Date.now() - record.consumedAt < 2500) {
              res.writeHead(200);
              res.end(JSON.stringify({ ciphertext: record.ciphertext, nonce: record.nonce }));
              return;
            }

            res.writeHead(410);
            res.end(
              JSON.stringify({
                error: "Este enlace de un solo uso ya ha sido consumido y destruido permanentemente.",
              })
            );
            return;
          }

          if (Date.now() > record.expiresAt) {
            ephemeralShares.delete(shareId);
            res.writeHead(410);
            res.end(JSON.stringify({ error: "Este enlace seguro ha caducado." }));
            return;
          }

          // Marcar como consumido inmediatamente (Burn-After-Reading)
          record.consumed = true;
          record.consumedAt = Date.now();

          // Programar eliminación total e irrevocable de la memoria RAM en 2.5 segundos
          setTimeout(() => {
            ephemeralShares.delete(shareId);
          }, 2500);

          res.writeHead(200);
          res.end(JSON.stringify({ ciphertext: record.ciphertext, nonce: record.nonce }));
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), ephemeralSharePlugin()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
