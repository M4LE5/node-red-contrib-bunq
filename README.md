# Node-RED nodes for the bunq API (ALPHA release)
Contains the following nodes:
- API Init nodes with Sandbox, Create Installation, Add Device 
- Create session
- Get user info
- List events
- List monetary accounts, create payments
- List cards
- Get insights
- List and create bunq.me tabs
- List user trees

## Installation
### Setup
> Go to the installation dir of your node-red instance (might be: /home/pi/.node-red). And type:
```
npm install https://github.com/M4LE5/node-red-contrib-bunq/tarball/master
or
npm install git+https://github.com/M4LE5/node-red-contrib-bunq.git
```

---

## FAQ

- Why my payment (bunq Monetary Node) is always only saved as draft?
    - Because you handle with your own money by using an open API. If something happen, you can get lost your money!
	
---

## License

[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://badges.mit-license.org)

- **[MIT license](http://opensource.org/licenses/mit-license.php)**
- Copyright 2020 © M4LE5.

# Disclaimer
### Use this Software at your own risk!