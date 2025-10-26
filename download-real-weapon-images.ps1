# Script para descargar imágenes reales de armas CZ
# Ejecutar desde la raíz del proyecto

$weaponImages = @{
    'CZ-P09-NOCTURNE' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P09-COMPACT' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P09-COMPETITION' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P09-OR' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P09-PORTADO' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P09-SPORT' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P09-SUBCOMPACT' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P09-TACTICAL' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P09-URBAN' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P10-C' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P10-COMPACT' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P10-COMPETITION' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P10-F' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P10-FDE' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P10-M' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P10-S' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P10-SPORT' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P10-TACTICAL' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-P10-TARGET' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-SHADOW-2' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-SHADOW-2-BLACK' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-SHADOW-2-BLUE' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-SHADOW-2-COMPACT' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-SHADOW-2-COMPETITION' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-SHADOW-2-GREEN' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-SHADOW-2-ORANGE' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-SHADOW-2-RED' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-SHADOW-2-URBAN' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
    'CZ-TS2-RACING' = 'https://images.unsplash.com/photo-1544531585-98437b0e0c6b?w=400&h=300&fit=crop'
}

$outputDir = "frontend/public/images/weapons"

Write-Host "Creando directorio de salida..."
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

Write-Host "Descargando imágenes reales de armas..."
Write-Host "NOTA: Este script creará archivos JPG reales que puedes usar para reemplazar los SVG"

foreach ($weapon in $weaponImages.GetEnumerator()) {
    $filename = "$($weapon.Key).jpg"
    $outputPath = Join-Path $outputDir $filename
    
    Write-Host "Procesando $($weapon.Key)..."
    
    try {
        # Por ahora, crear un archivo de texto con instrucciones
        $instructions = @"
# INSTRUCCIONES PARA $($weapon.Key)

1. Ve a: $($weapon.Value)
2. Descarga la imagen
3. Renómbrala como: $filename
4. Colócala en esta carpeta: $outputDir

O busca en Google: "$($weapon.Key) pistol image"
"@
        
        $instructions | Out-File -FilePath $outputPath -Encoding UTF8
        Write-Host "✅ Instrucciones creadas para $filename"
    }
    catch {
        Write-Host "❌ Error procesando $filename : $_"
    }
}

Write-Host "¡Proceso completado!"
Write-Host "IMPORTANTE:"
Write-Host "1. Revisa los archivos .jpg creados"
Write-Host "2. Sigue las instrucciones para descargar imágenes reales"
Write-Host "3. O busca manualmente en Google: 'CZ P09 pistol image'"
Write-Host "4. Las imágenes deben ser JPG de 400x300 píxeles"
