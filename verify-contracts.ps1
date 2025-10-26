# Script para verificar el contenido de los contratos generados
Write-Host "🔍 Verificando contratos generados..." -ForegroundColor Green

# Función para extraer texto básico de PDF (solo para verificación)
function Get-PDFText {
    param([string]$FilePath)
    
    try {
        # Leer los primeros bytes del PDF para verificar que es válido
        $bytes = [System.IO.File]::ReadAllBytes($FilePath)
        $header = [System.Text.Encoding]::ASCII.GetString($bytes[0..7])
        
        if ($header -like "%PDF-*") {
            Write-Host "✅ PDF válido: $FilePath" -ForegroundColor Green
            Write-Host "   Tamaño: $($bytes.Length) bytes" -ForegroundColor Cyan
            
            # Buscar texto específico en el contenido binario
            $content = [System.Text.Encoding]::ASCII.GetString($bytes)
            
            # Verificar contenido específico según el tipo de cliente
            if ($FilePath -like "*cliente_1*" -or $FilePath -like "*cliente_2*") {
                if ($content -like "*MILITAR*" -or $content -like "*FUERZA TERRESTRE*") {
                    Write-Host "   ✅ Contiene contenido militar" -ForegroundColor Green
                } else {
                    Write-Host "   ❌ No contiene contenido militar" -ForegroundColor Red
                }
            } elseif ($FilePath -like "*cliente_3*") {
                if ($content -like "*CIVIL*") {
                    Write-Host "   ✅ Contiene contenido civil" -ForegroundColor Green
                } else {
                    Write-Host "   ❌ No contiene contenido civil" -ForegroundColor Red
                }
            } elseif ($FilePath -like "*cliente_4*") {
                if ($content -like "*EMPRESA*" -or $content -like "*SEGURIDAD*") {
                    Write-Host "   ✅ Contiene contenido empresa" -ForegroundColor Green
                } else {
                    Write-Host "   ❌ No contiene contenido empresa" -ForegroundColor Red
                }
            }
            
            return $true
        } else {
            Write-Host "❌ No es un PDF válido: $FilePath" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error al leer archivo: $FilePath - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Verificar todos los contratos generados
$contractsDir = "documentacion/contratos_generados"
if (Test-Path $contractsDir) {
    $contractFiles = Get-ChildItem -Path $contractsDir -Recurse -Filter "*.pdf"
    
    Write-Host "`n📋 Encontrados $($contractFiles.Count) contratos:" -ForegroundColor Yellow
    
    foreach ($file in $contractFiles) {
        Write-Host "`n📄 Verificando: $($file.Name)" -ForegroundColor Cyan
        Get-PDFText -FilePath $file.FullName
    }
} else {
    Write-Host "❌ Directorio de contratos no encontrado: $contractsDir" -ForegroundColor Red
}

Write-Host "`n🎉 Verificación completada!" -ForegroundColor Green
