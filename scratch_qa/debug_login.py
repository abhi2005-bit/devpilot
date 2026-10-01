import urllib.request, json, time
def pw(action, arg1=None, arg2=None, options=None):
    req = urllib.request.Request('http://localhost:9999', data=json.dumps({'action': action, 'arg1': arg1, 'arg2': arg2, 'options': options or {}}).encode('utf-8'), headers={'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(req).read().decode()).get('result')

pw('goto', 'http://localhost:5173/login')
time.sleep(2)
pw('fill', 'input[type="email"]', 'nonexistent_test_abc@example.com')
pw('fill', 'input[type="password"]', 'wrongpassword')
pw('click', 'button[type="submit"]', None, {"force": True})
time.sleep(2)
print("BODY:")
print(pw('eval', 'document.body.innerText'))
