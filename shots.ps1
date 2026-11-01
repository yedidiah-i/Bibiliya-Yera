Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
[DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
[DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, uint d, UIntPtr e);
'@ -Name W -Namespace N -PassThru | Out-Null

$p = Get-Process bibiliya-yera -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { Write-Output "NOT RUNNING"; exit 1 }
$h = $p.MainWindowHandle
[N.W]::ShowWindow($h, 6) | Out-Null
Start-Sleep -Milliseconds 300
[N.W]::ShowWindow($h, 9) | Out-Null
[N.W]::SetForegroundWindow($h) | Out-Null
Start-Sleep -Milliseconds 700
if ([N.W]::GetForegroundWindow() -ne $h) {
  [N.W]::SetForegroundWindow($h) | Out-Null
  Start-Sleep -Milliseconds 500
}
if ([N.W]::GetForegroundWindow() -ne $h) { Write-Output "ABORT: app is not the foreground window"; exit 2 }

function Shot($name) {
  Start-Sleep -Milliseconds 700
  $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
  $bmp.Save((Join-Path (Get-Location) "screenshots\$name.png"))
  $g.Dispose(); $bmp.Dispose()
  Write-Output "shot $name"
}
function Click($x, $y) {
  [N.W]::SetCursorPos($x, $y) | Out-Null
  Start-Sleep -Milliseconds 120
  [N.W]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)
  [N.W]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)
}
function Keys($s) { [System.Windows.Forms.SendKeys]::SendWait($s) }

Shot "app-home"
Keys "^k"; Start-Sleep -Milliseconds 600
Keys "zaburi"; Start-Sleep -Milliseconds 500
Keys "{ENTER}"; Start-Sleep -Milliseconds 900
Shot "app-reader"
Click 760 420; Start-Sleep -Milliseconds 900
Shot "app-study"
Keys "{ESC}"; Start-Sleep -Milliseconds 300
Keys "^f"; Start-Sleep -Milliseconds 600
Keys "urukundo"; Start-Sleep -Milliseconds 1200
Shot "app-search"
Keys "{ESC}"
Write-Output "done"
