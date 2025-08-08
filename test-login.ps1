# Test Login Script for GMARM API

$baseUrl = "http://localhost:8080"
$loginUrl = "$baseUrl/api/auth/login"

# Test different credentials (trying various password combinations)
$testCredentials = @(
    @{ email = "admin@gmarm.com"; password = "admin123" },
    @{ email = "vendedor1@gmarm.com"; password = "123456" },
    @{ email = "admin@gmarm.com"; password = "123456" },
    @{ email = "vendedor1@gmarm.com"; password = "admin123" },
    @{ email = "admin@gmarm.com"; password = "password" },
    @{ email = "vendedor1@gmarm.com"; password = "password" },
    @{ email = "admin@gmarm.com"; password = "admin" },
    @{ email = "vendedor1@gmarm.com"; password = "admin" }
)

foreach ($cred in $testCredentials) {
    $credentials = $cred | ConvertTo-Json
    
    Write-Host "Testing login with credentials: $credentials" -ForegroundColor Yellow
    
    try {
        # Make login request
        $response = Invoke-RestMethod -Uri $loginUrl -Method POST -ContentType "application/json" -Body $credentials
        
        Write-Host "Login successful!" -ForegroundColor Green
        Write-Host "Token: $($response.token)" -ForegroundColor Cyan
        
        # Test an authenticated endpoint
        $headers = @{
            "Authorization" = "Bearer $($response.token)"
            "Content-Type" = "application/json"
        }
        
        # Test getting user profile
        $profileUrl = "$baseUrl/api/auth/me"
        Write-Host "Testing authenticated endpoint: $profileUrl" -ForegroundColor Yellow
        
        $profileResponse = Invoke-RestMethod -Uri $profileUrl -Method GET -Headers $headers
        Write-Host "Profile response: $($profileResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Green
        
        break  # Exit loop if successful
        
    } catch {
        Write-Host "Error with $($cred | ConvertTo-Json): $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "---" -ForegroundColor Gray
}
