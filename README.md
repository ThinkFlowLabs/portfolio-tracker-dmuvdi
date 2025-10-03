# Bitfin Portfolio Tracker

Panel de control profesional para tracking de portfolio de trading con análisis avanzado de rendimiento.

## Características

- 📊 **Análisis completo de rendimiento**: Estadísticas detalladas de trading
- 📈 **Visualización avanzada**: Gráficos interactivos de P&L acumulativo
- 💰 **Tracking en tiempo real**: Precios actualizados y cálculos mark-to-market
- 🎯 **Métricas profesionales**: Win rate, profit factor, drawdown analysis
- 📱 **PWA Ready**: Instalable como aplicación móvil

## Tecnologías

- React + TypeScript
- Vite
- TailwindCSS
- Shadcn/ui
- Recharts
- Firebase Data Integration

## Desarrollo Local

### Requisitos

- Node.js 18+ y npm instalados
- Acceso a los archivos JSON de Firebase (transaction_portfolio.json, closed_transactions.json)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/ThinkFlowLabs/portfolio-tracker-dmuvdi.git

# Navegar al directorio del proyecto
cd portfolio-tracker-dmuvdi

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:8080`

### Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linter ESLint
```

## Estructura del Proyecto

```
src/
├── components/
│   ├── portfolio/          # Componentes específicos del portfolio
│   │   ├── CumulativePnLChart.tsx
│   │   ├── StatsGrid.tsx
│   │   ├── TradesTable.tsx
│   │   └── MonthlyCharts.tsx
│   └── ui/                 # Componentes UI base (shadcn)
├── lib/
│   ├── tradeCalculations.ts    # Lógica de cálculos
│   ├── dataLogger.ts          # Sistema de logging
│   └── utils.ts               # Utilidades
├── types/
│   └── trade.ts               # Tipos TypeScript
└── pages/
    └── Index.tsx              # Página principal
```

## API Integration

La aplicación consume datos de:

- **Firebase JSON**: Datos de transacciones y portfolio
- **Bitfin Server API**: Precios históricos (`https://bitfinserver-production.up.railway.app`)

## Features Principales

### 📊 Análisis de Performance

- Cálculo de P&L acumulativo mark-to-market
- Estadísticas de trading (win rate, profit factor)
- Análisis mensual de rendimiento

### 📈 Visualización

- Gráficos interactivos con Recharts
- Vista en USD y porcentaje
- Responsive design

### 📋 Data Management

- Sistema de logging completo
- Exportación de datos de cálculo
- Tracking de API calls y performance

## Deployment

El proyecto está configurado para deployment en Vercel/Netlify:

```bash
npm run build
```

Los archivos se generan en `dist/` listos para servir estáticamente.

## Licencia

Este proyecto es privado y pertenece a Bitfin App.
