# Script para generar imágenes SVG de armas CZ
# Ejecutar desde la raíz del proyecto

$weaponCodes = @(
    'CZ-P09-NOCTURNE', 'CZ-P09-COMPACT', 'CZ-P09-COMPETITION', 'CZ-P09-OR',
    'CZ-P09-PORTADO', 'CZ-P09-SPORT', 'CZ-P09-SUBCOMPACT', 'CZ-P09-TACTICAL',
    'CZ-P09-URBAN', 'CZ-P10-C', 'CZ-P10-COMPACT', 'CZ-P10-COMPETITION',
    'CZ-P10-F', 'CZ-P10-FDE', 'CZ-P10-M', 'CZ-P10-S', 'CZ-P10-SPORT',
    'CZ-P10-TACTICAL', 'CZ-P10-TARGET', 'CZ-SHADOW-2', 'CZ-SHADOW-2-BLACK',
    'CZ-SHADOW-2-BLUE', 'CZ-SHADOW-2-COMPACT', 'CZ-SHADOW-2-COMPETITION',
    'CZ-SHADOW-2-GREEN', 'CZ-SHADOW-2-ORANGE', 'CZ-SHADOW-2-RED',
    'CZ-SHADOW-2-URBAN', 'CZ-TS2-RACING'
)

$outputDir = "frontend/public/images/weapons"

Write-Host "Creando directorio de salida..."
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

Write-Host "Generando imágenes SVG para cada arma..."

foreach ($code in $weaponCodes) {
    $filename = "$code.svg"
    $outputPath = Join-Path $outputDir $filename
    
    # Extraer información del código
    $model = $code -replace 'CZ-', ''
    $displayName = $model -replace '-', ' '
    
    Write-Host "Generando $filename..."
    
    # Crear contenido SVG
    $svgContent = @"
<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2d3748;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#4a5568;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2d3748;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#e53e3e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c53030;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fondo -->
  <rect width="400" height="300" fill="#f7fafc"/>
  
  <!-- Arma principal -->
  <g transform="translate(100, 80)">
    <!-- Cañón -->
    <rect x="0" y="120" width="200" height="8" rx="4" fill="url(#gunGradient)"/>
    
    <!-- Cuerpo principal -->
    <rect x="180" y="100" width="60" height="48" rx="8" fill="url(#gunGradient)"/>
    
    <!-- Empuñadura -->
    <path d="M 180 148 L 200 148 L 210 180 L 190 180 Z" fill="url(#gunGradient)"/>
    
    <!-- Gatillo -->
    <rect x="195" y="140" width="4" height="12" rx="2" fill="#e53e3e"/>
    
    <!-- Mira -->
    <rect x="190" y="95" width="20" height="6" rx="3" fill="url(#accentGradient)"/>
    
    <!-- Detalles -->
    <circle cx="210" cy="124" r="3" fill="#e53e3e"/>
    <circle cx="210" cy="132" r="3" fill="#e53e3e"/>
  </g>
  
  <!-- Texto -->
  <text x="200" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#2d3748">
    $displayName
  </text>
  <text x="200" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#718096">
    9MM - PISTOLA
  </text>
</svg>
"@
    
    # Guardar archivo SVG
    $svgContent | Out-File -FilePath $outputPath -Encoding UTF8
    Write-Host "✅ $filename generado"
}

Write-Host "¡Generación completada!"
Write-Host "Se crearon $($weaponCodes.Count) imágenes SVG en: $outputDir"
