$ErrorActionPreference = 'Stop'
$docxPath = "d:\SINDICATO\Esquema_BD_Sindicato_2026.docx"
$zipPath = "d:\SINDICATO\Esquema_BD_Sindicato_2026.zip"
$tempDir = "d:\SINDICATO\tmp_docx_extract"

if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
Copy-Item -Path $docxPath -Destination $zipPath -Force
Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force

[xml]$doc = Get-Content "$tempDir\word\document.xml" -Raw
$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

$paragraphs = $doc.SelectNodes("//w:p", $ns)
foreach ($p in $paragraphs) {
    Write-Output $p.InnerText
}

Remove-Item $tempDir -Recurse -Force
Remove-Item $zipPath -Force
