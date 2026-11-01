Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow(); [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, System.Text.StringBuilder s, int n); [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h); [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);' -Name W -Namespace N -PassThru | Out-Null
$p = Get-Process bibiliya-yera -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { Write-Output "NOT RUNNING"; exit 1 }
$h = $p.MainWindowHandle
Write-Output ("app hwnd=" + $h)
[N.W]::ShowWindow($h, 9) | Out-Null
[N.W]::SetForegroundWindow($h) | Out-Null
Start-Sleep -Milliseconds 800
$fg = [N.W]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 256
[N.W]::GetWindowText($fg, $sb, 256) | Out-Null
Write-Output ("fg=" + $fg + " title='" + $sb.ToString() + "' match=" + ($fg -eq $h))
