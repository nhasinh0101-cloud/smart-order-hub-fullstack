param(
  [string]$MongoUri = 'mongodb://127.0.0.1:27017',
  [string]$Database = 'smart_order_hub'
)

$ErrorActionPreference = 'Stop'
$dataDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Get-Command mongoimport -ErrorAction SilentlyContinue)) {
  throw 'Không tìm thấy mongoimport. Hãy cài MongoDB Database Tools và thêm thư mục bin vào PATH.'
}
if (-not (Get-Command mongosh -ErrorAction SilentlyContinue)) {
  throw 'Không tìm thấy mongosh. Hãy cài MongoDB Shell và thêm thư mục cài đặt vào PATH.'
}

Get-ChildItem -Path $dataDirectory -Filter '*.json' | Sort-Object Name | ForEach-Object {
  $collection = $_.BaseName
  Write-Host "Importing $($_.Name) -> $Database.$collection"
  & mongoimport --uri $MongoUri --db $Database --collection $collection --file $_.FullName --jsonArray --drop
  if ($LASTEXITCODE -ne 0) { throw "mongoimport thất bại cho $($_.Name)" }
}

Write-Host "Creating indexes in $Database"
& mongosh "$MongoUri/$Database" (Join-Path $dataDirectory 'create_indexes.js')
if ($LASTEXITCODE -ne 0) { throw 'Tạo index MongoDB thất bại.' }

Write-Host "Đã import dữ liệu vào MongoDB database '$Database'."
