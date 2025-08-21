# Script para generar imágenes SVG únicas para cada arma CZ
# Ejecutar desde la raíz del proyecto

$weaponCodes = @(
    'CZ-P09-NOCTURNE', 'CZ-P09-COMPACT', 'CZ-P09-COMPETITION', 'CZ-P09-OR',
    'CZ-P09-PORTADO', 'CZ-P09-SPORT', 'CZ-P09-SUBCOMPACT', 'CZ-P09-TACTICAL',
    'CZ-P09-URBAN', 'CZ-P10-C', 'CZ-P10-COMPACT', 'CZ-P10-COMPETITION',
    'CZ-P10-F', 'CZ-P10-FDE', 'CZ-P10-M', 'CZ-P10-S', 'CZ-P10-SPORT',
    'CZ-P10-TACTICAL', 'CZ-P10-TARGET', 'CZ-SHADOW-2', 'CZ-SHADOW-2-BLACK',
    'CZ-P10-BLUE', 'CZ-SHADOW-2-COMPACT', 'CZ-SHADOW-2-COMPETITION',
    'CZ-SHADOW-2-GREEN', 'CZ-SHADOW-2-ORANGE', 'CZ-SHADOW-2-RED',
    'CZ-SHADOW-2-URBAN', 'CZ-TS2-RACING'
)

$outputDir = "frontend/public/images/weapons"

Write-Host "Creando directorio de salida..."
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

Write-Host "Generando imágenes SVG únicas para cada arma..."

foreach ($code in $weaponCodes) {
    $filename = "$code.svg"
    $outputPath = Join-Path $outputDir $filename
    
    # Extraer información del código
    $model = $code -replace 'CZ-', ''
    $displayName = $model -replace '-', ' '
    
    # Colores únicos para cada modelo
    $colors = @{
        'P09' = @{ primary = '#2d3748'; accent = '#e53e3e'; secondary = '#4a5568' }
        'P10' = @{ primary = '#1a365d'; accent = '#3182ce'; secondary = '#2b6cb0' }
        'SHADOW-2' = @{ primary = '#553c9a'; accent = '#9f7aea'; secondary = '#805ad5' }
        'TS2' = @{ primary = '#744210'; accent = '#d69e2e'; secondary = '#b7791f' }
    }
    
    # Determinar colores basados en el modelo
    $colorScheme = if ($code -like 'CZ-P09*') { $colors['P09'] }
                   elseif ($code -like 'CZ-P10*') { $colors['P10'] }
                   elseif ($code -like 'CZ-SHADOW-2*') { $colors['SHADOW-2'] }
                   elseif ($code -like 'CZ-TS2*') { $colors['TS2'] }
                   else { $colors['P09'] }
    
    Write-Host "Generando $filename con colores $($colorScheme.primary)..."
    
    # Crear contenido SVG único
    $svgContent = @"
<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:$($colorScheme.primary);stop-opacity:1" />
      <stop offset="50%" style="stop-color:$($colorScheme.secondary);stop-opacity:1" />
      <stop offset="100%" style="stop-color:$($colorScheme.primary);stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:$($colorScheme.accent);stop-opacity:1" />
      <stop offset="100%" style="stop-color:$($colorScheme.accent);stop-opacity:0.8" />
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
    <rect x="195" y="140" width="4" height="12" rx="2" fill="$($colorScheme.accent)"/>
    
    <!-- Mira -->
    <rect x="190" y="95" width="20" height="6" rx="3" fill="url(#accentGradient)"/>
    
    <!-- Detalles únicos por modelo -->
    <circle cx="210" cy="124" r="3" fill="$($colorScheme.accent)"/>
    <circle cx="210" cy="132" r="3" fill="$($colorScheme.accent)"/>
    
    <!-- Características específicas del modelo -->
    $(if ($code -like '*COMPETITION*') {
      '<rect x="185" y="90" width="30" height="4" rx="2" fill="url(#accentGradient)"/>'
    } elseif ($code -like '*TACTICAL*') {
      '<rect x="185" y="88" width="30" height="6" rx="3" fill="url(#accentGradient)"/>'
    } elseif ($code -like '*SPORT*') {
      '<circle cx="200" cy="92" r="4" fill="url(#accentGradient)"/>'
    } else {
      '<rect x="190" y="92" width="20" height="4" rx="2" fill="url(#accentGradient)"/>'
    })
  </g>
  
  <!-- Texto -->
  <text x="200" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="$($colorScheme.primary)">
    $displayName
  </text>
  <text x="200" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="$($colorScheme.secondary)">
    9MM - PISTOLA
  </text>
</svg>
"@
    
    # Guardar archivo SVG
    $svgContent | Out-File -FilePath $outputPath -Encoding UTF8
    Write-Host "✅ $filename generado con colores únicos"
}

Write-Host "¡Generación completada!"
Write-Host "Se crearon $($weaponCodes.Count) imágenes SVG únicas en: $outputDir"
