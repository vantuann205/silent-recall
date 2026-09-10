param([ValidateSet('protect', 'unprotect')][string]$Mode)
$ErrorActionPreference = 'Stop'
try {
    Add-Type -AssemblyName System.Security
    $inputText = [Console]::In.ReadToEnd()
    $scope = [System.Security.Cryptography.DataProtectionScope]::CurrentUser
    $entropy = [Text.Encoding]::UTF8.GetBytes('SilentRecall/preprod/wallets/v1')
    if ($Mode -eq 'protect') {
        $bytes = [Text.Encoding]::UTF8.GetBytes($inputText)
        $result = [Security.Cryptography.ProtectedData]::Protect($bytes, $entropy, $scope)
        [Console]::Out.Write([Convert]::ToBase64String($result))
    } else {
        $bytes = [Convert]::FromBase64String($inputText.Trim())
        $result = [Security.Cryptography.ProtectedData]::Unprotect($bytes, $entropy, $scope)
        [Console]::Out.Write([Text.Encoding]::UTF8.GetString($result))
    }
} catch {
    [Console]::Error.WriteLine('Wallet protection operation failed. Use the original Windows account.')
    exit 1
} finally {
    if ($bytes) { [Array]::Clear($bytes, 0, $bytes.Length) }
    if ($result) { [Array]::Clear($result, 0, $result.Length) }
    $inputText = $null
}
