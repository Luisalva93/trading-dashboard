# Trading Dashboard — Guía de Deploy en Railway

## Qué es esto
App web de trading journal con calendario mensual, estadísticas y gráficas.
- **Backend:** Node.js + Express + PostgreSQL
- **Frontend:** React
- **Hosting:** Railway (gratis hasta $5/mes de uso, suficiente para uso personal)

---

## PASO 1 — Crear cuenta en Railway
1. Ve a https://railway.app
2. Regístrate con tu cuenta de GitHub (necesitas tener GitHub también)

---

## PASO 2 — Subir el código a GitHub

1. Crea una cuenta en https://github.com si no tienes
2. Crea un repositorio nuevo llamado `trading-dashboard`
3. Sube estos archivos con la siguiente estructura:

```
trading-dashboard/
├── backend/
│   ├── index.js
│   ├── package.json
│   ├── db/init.js
│   └── routes/trades.js
└── frontend/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── index.js
        ├── index.css
        ├── App.js
        ├── api.js
        └── components/
            ├── Calendar.js
            ├── StatsBar.js
            ├── PnlChart.js
            └── TradeModal.js
```

---

## PASO 3 — Deploy del Backend en Railway

1. En Railway, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Elige tu repositorio `trading-dashboard`
4. Railway detectará el backend. En configuración:
   - **Root Directory:** `backend`
   - **Start Command:** `node index.js`

5. Agrega una base de datos PostgreSQL:
   - Haz clic en **"+ New"** → **"Database"** → **"PostgreSQL"**
   - Railway creará la DB automáticamente

6. En las variables de entorno del backend agrega:
   - `DATABASE_URL` → Railway lo pone automático si linkins la DB
   - `NODE_ENV` = `production`
   - `PORT` = `3001`

7. Haz deploy. Railway te dará una URL tipo:
   `https://tu-backend.railway.app`

---

## PASO 4 — Deploy del Frontend en Railway

1. En el mismo proyecto Railway, haz clic en **"+ New"** → **"GitHub Repo"**
2. Elige el mismo repo pero con:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Start Command:** `npx serve -s build`

3. Agrega variable de entorno:
   - `REACT_APP_API_URL` = `https://tu-backend.railway.app` (la URL del paso 3)

4. Haz deploy. Obtendrás una URL tipo:
   `https://tu-frontend.railway.app`

¡Esa es tu app! Guárdala en favoritos o agrégala a tu pantalla de inicio en el celular.

---

## Uso diario

- Entra a tu URL del frontend
- Haz clic en cualquier día para registrar P&L, número de trades y notas
- Las estadísticas y gráfica se actualizan automáticamente
- Navega entre meses con las flechas ‹ ›

---

## ¿Problemas?

- Si el backend no conecta, verifica que `DATABASE_URL` esté correcta en las variables de Railway
- Si el frontend no carga datos, verifica que `REACT_APP_API_URL` apunte al backend sin slash final
