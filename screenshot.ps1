param([string]$Out = "screenshots\app.png")
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h); [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);' -Name W -Namespace N -PassThru | Out-Null
[System.Windows.Forms.SendKeys]::SendWait("{ESC}")
Start-Sleep -Milliseconds 400
$p = Get-Process bibiliya-yera -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if ($p) {
  [N.W]::ShowWindow($p.MainWindowHandle, 9) | Out-Null
  [N.W]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
}
Start-Sleep -Milliseconds 900
$b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
$bmp.Save((Join-Path (Get-Location) $Out))
Write-Output "saved $Out ($($b.Width)x$($b.Height))"
