$file = "00_gmarm_completo.sql"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

$content = $content -replace 'mltiples','múltiples'
$content = $content -replace 'codificacin','codificación'
$content = $content -replace 'insercin','inserción'
$content = $content -replace 'CREACI"N','CREACIÓN'
$content = $content -replace 'relacin','relación'
$content = $content -replace 'identificacin','identificación'
$content = $content -replace 'aprobacin','aprobación'
$content = $content -replace 'ubicacin','ubicación'
$content = $content -replace 'Informacin','Información'
$content = $content -replace 'electrnico','electrónico'
$content = $content -replace 'verificacin','verificación'
$content = $content -replace 'importacin','importación'
$content = $content -replace 'Nmero','Número'
$content = $content -replace 'Cunto','Cuánto'
$content = $content -replace 'Lmite','Límite'
$content = $content -replace 'lmite','límite'
$content = $content -replace 'mximo','máximo'
$content = $content -replace 'categora','categoría'
$content = $content -replace 'policas','policías'
$content = $content -replace 'configuracin','configuración'

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "Caracteres corregidos"

