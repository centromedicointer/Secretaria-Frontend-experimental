# CLAUDE.md - Frontend Dashboard

This file provides guidance to Claude Code when working with the React dashboard in this directory.

## Project Overview

This is the **React Dashboard** for the WhatsApp Enterprise System - a real-time data visualization and monitoring interface that connects to the PostgreSQL database via Supabase.

## Architecture

```
PostgreSQL Database → Supabase API → React Dashboard (This Frontend)
```

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Supabase** for database connection
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Recharts** for data visualization
- **React Query** for data fetching

## Key Components

### Core Pages
- `src/pages/Index.tsx` - Main dashboard with real-time metrics
- `src/pages/Analytics.tsx` - Medical appointment analytics
- `src/pages/Messages.tsx` - WhatsApp message monitoring
- `src/pages/Workflows.tsx` - n8n workflow status

### Data Integration
- `src/integrations/supabase/` - Supabase client configuration
- `src/hooks/` - Custom React hooks for data fetching
- `src/components/` - Reusable UI components

## Development Commands

### Setup and Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

### Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Required environment variables:
VITE_SUPABASE_URL=https://vdrfdlpwycoghtpqdgvx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Database Integration

### Key Tables Accessed
- `evolution_metricas` - Real-time WhatsApp metrics
- `appointment_analytics` - Medical appointment data
- `n8n_usuarios_unicos` - Unique user statistics
- `v_dashboard_hoy` - Today's dashboard view
- `v_dashboard_semana` - Weekly comparison view

### Data Fetching Patterns
```typescript
// Example hook usage
const { data: metrics, isLoading } = useQuery({
  queryKey: ['evolution-metrics'],
  queryFn: () => supabase
    .from('evolution_metricas')
    .select('*')
    .single()
});
```

## Common Development Tasks

### Adding New Dashboard Components
1. Create component in `src/components/`
2. Add data fetching hook if needed
3. Update routing in `src/App.tsx`
4. Add to navigation if required

### Connecting to New Database Tables
1. Add types in `src/integrations/supabase/types.ts`
2. Create custom hook in `src/hooks/`
3. Use in components with proper error handling

### Styling Guidelines
- Use Tailwind CSS classes
- Follow existing component patterns
- Ensure responsive design
- Use consistent color scheme

### Performance Considerations
- Use React Query for caching
- Implement proper loading states
- Optimize re-renders with useMemo/useCallback
- Lazy load heavy components

## File Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase configuration
│   ├── pages/              # Main application pages
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
├── .env.example           # Environment template
└── package.json           # Dependencies and scripts
```

## Troubleshooting

### Common Issues
- **Supabase connection errors**: Check environment variables
- **Type errors**: Run `npm run type-check`
- **Build failures**: Clear node_modules and reinstall
- **Data not loading**: Verify database permissions in Supabase

### Development Notes
- Dashboard updates in real-time via Supabase subscriptions
- Charts auto-refresh every 30 seconds
- Error boundaries handle API failures gracefully
- All database queries use Row Level Security (RLS)

## Version Information
- Frontend Version: Aligned with main system v2.1.2
- React Version: 18.x
- Last Updated: August 17, 2025
- Status: Production Ready