# HIS Connection API สำหรับ nRefer, ISOnline, CUP Datacenter and Quality drug store

## การติดตั้ง
### 1.โปรแกรมที่จำเป็นในการใช้งาน
```
ติดตั้งโปรแกรมที่ต้องใช้งาน
===============
1. NodeJS
   1.1 Windows, Mac download ที่ https://nodejs.org/en/download/
   1.2 Linux ทำตามขั้นตอน https://github.com/nodesource/distributions/blob/master/README.md#rpminstall
2. ติดตั้ง package ที่จำเป็น > npm install -g pm2 nodemon typescript ts-node
3. ติดตั้ง git โดย download จาก website https://git-scm.com/
```

### 2.Source code
```
1.สร้าง Folder ที่จะใช้เก็บ API เช่น mkdir c:\API
2.cd api
3.ทำการ clone source จาก github ด้วยคำสั่ง git clone https://github.com/superpck/hisgateway-nrefer-and-is his_connect
4.cd his_connect
5.npm install
6.กรณีพบ vulnerabilities ให้ทำการ fix ด้วยคำสั่ง npm audit fix --force
7.copy file config.default แล้วตั้งชื่อ file ใหม่เป็น config
8.แก้ไขค่าต่างๆ ใน file config ให้ถูกต้อง
```

## Test API
```
ทดสอบการทำงานด้วยคำสั่ง nodemon
เปิด http://localhost:<port ที่กำหนดตาม config> ใน browser เพื่อแสดงผล
ทดสอบการเชื่อต่อฐานข้อมูล http://localhost:<port>/his/alive
กรณี Linux สามารถ config ค่าด้วย url http://localhost:<port>/setup-api
```

## Running ใช้งานจริง
```
# ควร run จาก javascript ที่ compile แล้ว
1.compile source ด้วยคำสั่ง tsc
2.กรณี windows ให้ติดตั้ง auto start ด้วยคำสั่ง
  2.1 npm install pm2-windows-startup -g
  2.2 pm2-startup install
3. กรณี Linux ให้ใช้คำสั้ง pm2 startup
4. start การใช้งาน API ด้วยคำสั่ง pm2 start app/app.js -i 2 --name "his-connect"
## ชื่อ --name จะต้องตรงกับค่า PM2_NAME ใน config file
5. ใช้คำสั่ง pm2 save เพื่อบันทึกค่าที่ใช้งานในปัจจุบัน
```

# การ Update Source code
```
1. เข้าไปที่ folder ที่เก็บ API เช่น > cd \api\his_connect
2. update source code จาก github > git pull
3. ติดตั้ง package (เผื่อมีการติดตั้งเพิ่มเติม) > npm install
4. กรณีพบ vulnerabilities ให้ทำการ fix ด้วยคำสั่ง > npm audit fix --force
5. ทำการ compile source code ด้วยคำสั่ง > tsc
6. Restart API ที่เคย run ไว้แล้วด้วยคำสั่ง > pm2 restart his-connect
```

# push to git กรณีเป็นทีมพัฒนา (Develop@MOPH)
```
> git add .
> git commit -m "คำอธิบายสิ่งที่แก้ไข"
> git push origin <branch name>
กรณี push ไม่ได้ ให้ทำการ git pull ก่อน
```

# credit
```
- อ.สถิตย์ เรียนพิศ https://github.com/siteslave
```

# ข้อควรระวัง
```
- mssql ให้ติดตั้ง version 4.1.0 หรือ 6 เท่านั้น "npm install --save mssql@4.1.0"
```

เอกสารการติดตั้ง
https://docs.google.com/document/d/1jKXwA12WNyRr-phcjQXRLz9xTJz5BreTPDBy2saWpOs
