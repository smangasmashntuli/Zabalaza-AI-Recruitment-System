import requests, time
BACK='http://localhost:8000'
H={'Content-Type':'application/json','Origin':'http://localhost:3000'}
# register
u='manualtest_'+str(int(time.time()))
reg={'email':u+'@example.com','username':u,'password':'TestPass123!','full_name':'Manual Test','role':'candidate'}
r=requests.post(BACK+'/api/v1/auth/register',json=reg,headers=H)
print('reg',r.status_code,r.text[:200])
# login
login_data={'username':u,'password':'TestPass123!'}
resp=requests.post(BACK+'/api/v1/auth/login',data=login_data,headers={'Origin':'http://localhost:3000'})
print('login',resp.status_code,resp.text[:200])
if resp.status_code==200:
    token=resp.json().get('access_token')
    H2={'Content-Type':'application/json','Authorization':f'Bearer {token}','Origin':'http://localhost:3000'}
    update={'skills':['A','B','C']}
    put=requests.put(BACK+'/api/v1/candidates/me',json=update,headers=H2)
    print('put',put.status_code,put.text[:1000])
else:
    print('login failed')

