-- Agregar columnas adicionales a la tabla appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS observaciones TEXT,
ADD COLUMN IF NOT EXISTS tipo_recordatorio TEXT,
ADD COLUMN IF NOT EXISTS fecha_recordatorio TIMESTAMPTZ;