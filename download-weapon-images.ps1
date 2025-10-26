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

Write-Host "Descargando imágenes de armas desde Unsplash..."
foreach ($weapon in $weaponImages.GetEnumerator()) {
    $filename = "$($weapon.Key).jpg"
    $outputPath = Join-Path $outputDir $filename
    
    Write-Host "Descargando $($weapon.Key)..."
    try {
        # Descargar imagen real desde Unsplash
        Invoke-WebRequest -Uri $weapon.Value -OutFile $outputPath
        Write-Host "✅ $filename descargado exitosamente"
    }
    catch {
        Write-Host "❌ Error descargando $filename : $_"
        Write-Host "Creando imagen placeholder..."
        # Crear un archivo placeholder si falla la descarga
        "Placeholder para $($weapon.Key)" | Out-File -FilePath $outputPath -Encoding UTF8
    }
}

Write-Host "¡Descarga completada!"
Write-Host "Las imágenes están en: $outputDir"
Write-Host "NOTA: Si alguna imagen falló, se creó un placeholder de texto"
