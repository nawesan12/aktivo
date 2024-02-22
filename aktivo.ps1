# Define function to generate random symbols
function Get-RandomSymbol {
    $symbols = '#', '@', '*', '&', '+', '=', '-', '/', '\', '|', '(', ')', '[', ']', '{', '}', '<', '>'
    Get-Random -InputObject $symbols
}

# Get terminal dimensions
$columns = $Host.UI.RawUI.BufferSize.Width
$lines = $Host.UI.RawUI.BufferSize.Height

# Calculate position for the text
$text = "  Mas que #Aktivo  "
$textLength = $text.Length
$startColumn = ($columns - $textLength) / 2
$startLine = $lines / 2

# Clear the screen
Clear-Host

# Print random symbols around the text
for ($i = 0; $i -lt $lines; $i++) {
    for ($j = 0; $j -lt $columns; $j++) {
        if ($i -eq $startLine -and $j -ge $startColumn -and $j -lt ($startColumn + $textLength)) {
            Write-Host -NoNewline $text
            $j += $textLength - 1
        } else {
            Write-Host -NoNewline (Get-RandomSymbol)
        }
    }
    Write-Host
}
