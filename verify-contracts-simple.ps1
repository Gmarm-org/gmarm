# Script simple para verificar contratos generados
Write-Host "🔍 Verificando contratos generados..." -ForegroundColor Green

$contractsDir = "documentacion/contratos_generados"
if (Test-Path $contractsDir) {
    $contractFiles = Get-ChildItem -Path $contractsDir -Recurse -Filter "*.pdf"
    
    Write-Host "📋 Encontrados $($contractFiles.Count) contratos:" -ForegroundColor Yellow
    
    foreach ($file in $contractFiles) {
        Write-Host "`n📄 Verificando: $($file.Name)" -ForegroundColor Cyan
        
        try {
            $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
            $header = [System.Text.Encoding]::ASCII.GetString($bytes[0..7])
            
            if ($header -like "%PDF-*") {
                Write-Host "   ✅ PDF válido - Tamaño: $($bytes.Length) bytes" -ForegroundColor Green
                
                # Verificar tipo de cliente por nombre de archivo
                if ($file.Name -like "*cliente_1*" -or $file.Name -like "*cliente_2*") {
                    Write-Host "   📋 Cliente Militar Fuerza Terrestre" -ForegroundColor Blue
                } elseif ($file.Name -like "*cliente_3*") {
                    Write-Host "   📋 Cliente Civil" -ForegroundColor Blue
                } elseif ($file.Name -like "*cliente_4*") {
                    Write-Host "   📋 Cliente Empresa de Seguridad" -ForegroundColor Blue
                }
            } else {
                Write-Host "   ❌ No es un PDF válido" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "   ❌ Error al leer archivo: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ Directorio de contratos no encontrado: $contractsDir" -ForegroundColor Red
}

Write-Host "`n🎉 Verificación completada!" -ForegroundColor Green
