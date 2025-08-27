$body = @{ email = 'ncr@a1betting.com'; password = 'A1Betting1337!' } | ConvertTo-Json
try {
    $resp = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/auth/login' -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
    $resp | ConvertTo-Json -Depth 10
} catch {
    # Try to extract response content from HttpResponseMessage-like exceptions
    $ex = $_.Exception
    if ($ex -and $ex.Response) {
        try {
            $content = $ex.Response.Content.ReadAsStringAsync().Result
            try {
                $obj = $content | ConvertFrom-Json
                $obj | ConvertTo-Json -Depth 10
            } catch {
                $content
            }
        } catch {
            # Fallback: print the exception object as JSON
            $ex | ConvertTo-Json -Depth 5
        }
    } else {
        $_ | ConvertTo-Json -Depth 5
    }
}
