@app
begin-app

@static

@http
post /api/github/webhooks

@tables
data
  scopeID *String
  dataID **String
  ttl TTL
