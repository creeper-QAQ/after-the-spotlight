param([int]$Port = 4180, [switch]$OpenBrowser, [string]$SiteRoot = (Join-Path $PSScriptRoot 'site'))
$ErrorActionPreference = 'Stop'
$rootPath = [System.IO.Path]::GetFullPath($SiteRoot).TrimEnd('\', '/')
if (-not (Test-Path -LiteralPath (Join-Path $rootPath 'index.html'))) { throw 'Site files missing. Extract the complete delivery package first.' }
# Bind only to this computer. TCP avoids HTTP URL-registration/admin requirements.
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Collections.Generic;
public static class DeliveryPreview {
  static TcpListener listener;
  static string root;
  static readonly Dictionary<string,string> types = new Dictionary<string,string>(StringComparer.OrdinalIgnoreCase) {
    {".html","text/html; charset=utf-8"}, {".js","text/javascript; charset=utf-8"},
    {".mjs","text/javascript; charset=utf-8"}, {".css","text/css; charset=utf-8"},
    {".json","application/json; charset=utf-8"}, {".geojson","application/geo+json"},
    {".svg","image/svg+xml"}, {".jpg","image/jpeg"}, {".jpeg","image/jpeg"},
    {".png","image/png"}, {".webp","image/webp"}, {".woff2","font/woff2"},
    {".webm","video/webm"}, {".mp4","video/mp4"}
  };
  public static void Start(string siteRoot, int port) {
    root = Path.GetFullPath(siteRoot).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
    listener = new TcpListener(IPAddress.Loopback, port);
    listener.Start();
  }
  public static void Run() { while (true) ThreadPool.QueueUserWorkItem(Serve, listener.AcceptTcpClient()); }
  public static void Stop() { if (listener != null) listener.Stop(); }
  static void Reply(NetworkStream stream, int status, string type, byte[] body, bool head, string extraHeaders = "") {
    string message = status == 200 ? "OK" : status == 206 ? "Partial Content" : status == 416 ? "Range Not Satisfiable" : status == 404 ? "Not Found" : status == 405 ? "Method Not Allowed" : "Service Unavailable";
    byte[] headers = Encoding.ASCII.GetBytes("HTTP/1.1 " + status + " " + message + "\r\nContent-Type: " + type + "\r\nContent-Length: " + body.Length + "\r\nCache-Control: no-cache\r\nX-Content-Type-Options: nosniff\r\n" + extraHeaders + "Connection: close\r\n\r\n");
    stream.Write(headers, 0, headers.Length);
    if (!head) stream.Write(body, 0, body.Length);
  }
  static void Serve(object state) {
    using (TcpClient client = (TcpClient)state) {
      try {
        using (NetworkStream stream = client.GetStream()) {
          stream.ReadTimeout = 5000; stream.WriteTimeout = 30000;
          var reader = new StreamReader(stream, Encoding.ASCII, false, 4096, true);
          string request = reader.ReadLine();
          if (request == null || request.Length > 8192) return;
          string line; int headerLength = 0; string range = null;
          while (!String.IsNullOrEmpty(line = reader.ReadLine())) {
            headerLength += line.Length; if (headerLength > 16384) return;
            if (line.StartsWith("Range:", StringComparison.OrdinalIgnoreCase)) range = line.Substring(6).Trim();
          }
          string[] parts = request.Split(' ');
          if (parts.Length < 2) return;
          bool head = parts[0] == "HEAD";
          if (parts[0] != "GET" && !head) { Reply(stream, 405, "text/plain", Encoding.UTF8.GetBytes("Method not allowed"), false); return; }
          string url = Uri.UnescapeDataString(parts[1].Split('?')[0]);
          if (!url.StartsWith("/")) { Reply(stream, 404, "text/plain", new byte[0], head); return; }
          if (url.StartsWith("/api/", StringComparison.Ordinal)) {
            string result = url == "/api/reply-status" ? "{\"available\":false}" : url == "/api/media-status" ? "{\"audioAvailable\":false}" : "{\"error\":\"Optional service unavailable in static edition.\"}";
            Reply(stream, url == "/api/reply-status" || url == "/api/media-status" ? 200 : 503, "application/json; charset=utf-8", Encoding.UTF8.GetBytes(result), head); return;
          }
          if (url == "/") url = "/index.html";
          string file = Path.GetFullPath(Path.Combine(root, url.TrimStart('/')));
          if (!file.StartsWith(root, StringComparison.OrdinalIgnoreCase) || !File.Exists(file)) { Reply(stream, 404, "text/plain", Encoding.UTF8.GetBytes("Not found"), head); return; }
          string type;
          if (!types.TryGetValue(Path.GetExtension(file), out type)) type = "application/octet-stream";
          byte[] bytes = File.ReadAllBytes(file);
          string rangeHeaders = "Accept-Ranges: bytes\r\n";
          if (!head && range != null && range.StartsWith("bytes=", StringComparison.OrdinalIgnoreCase) && !range.Contains(",")) {
            string[] bounds = range.Substring(6).Split('-');
            long start = 0, end = bytes.LongLength - 1, suffix;
            bool valid = bounds.Length == 2 && bytes.Length > 0;
            if (valid && bounds[0].Length == 0) {
              valid = Int64.TryParse(bounds[1], out suffix) && suffix > 0;
              if (valid) start = Math.Max(0, bytes.LongLength - suffix);
            } else if (valid) {
              valid = Int64.TryParse(bounds[0], out start) && start >= 0;
              if (bounds[1].Length > 0) valid = valid && Int64.TryParse(bounds[1], out end);
              valid = valid && start < bytes.LongLength && end >= start;
              end = Math.Min(end, bytes.LongLength - 1);
            }
            if (!valid) {
              Reply(stream, 416, type, new byte[0], false, rangeHeaders + "Content-Range: bytes */" + bytes.Length + "\r\n");
              return;
            }
            byte[] selected = new byte[(int)(end - start + 1)];
            Buffer.BlockCopy(bytes, (int)start, selected, 0, selected.Length);
            Reply(stream, 206, type, selected, false, rangeHeaders + "Content-Range: bytes " + start + "-" + end + "/" + bytes.Length + "\r\n");
          } else Reply(stream, 200, type, bytes, head, rangeHeaders);
        }
      } catch { /* A closed browser request must not stop the local preview. */ }
    }
  }
}
'@
$started = $false
for ($attempt = 0; $attempt -lt 5; $attempt++) {
  try { [DeliveryPreview]::Start($rootPath, ($Port + $attempt)); $Port += $attempt; $started = $true; break }
  catch { if ($attempt -eq 4) { throw } }
}
if (-not $started) { throw 'No local preview port is available.' }
Write-Host "Open http://127.0.0.1:$Port/ in Edge or Chrome. Keep this window open; close it to stop the preview."
if ($OpenBrowser) { Start-Process "http://127.0.0.1:$Port/" }
try { [DeliveryPreview]::Run() } finally { [DeliveryPreview]::Stop() }
