Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r); public struct RECT { public int Left, Top, Right, Bottom; }' -Name W2 -Namespace N2 -PassThru | Out-Null
$p = Get-Process bibiliya-yera -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { Write-Output "not running"; exit }
$r = New-Object N2.W2+RECT
[N2.W2]::GetWindowRect($p.MainWindowHandle, [ref]$r) | Out-Null
Write-Output ("rect L={0} T={1} R={2} B={3}  w={4} h={5}" -f $r.Left,$r.Top,$r.Right,$r.Bottom,($r.Right-$r.Left),($r.Bottom-$r.Top))
Add-Type -AssemblyName System.Windows.Forms
$b = [System.Windows.Forms.Screen]::PrimaryScreen
Write-Output ("screen={0}x{1} working={2}x{3}" -f $b.Bounds.Width,$b.Bounds.Height,$b.WorkingArea.Width,$b.WorkingArea.Height)
