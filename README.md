# Node-RED nodes for the bunq API

IMPORTANT NOTICE: This software is currently in beta phase. >90% of the code works perfectly, but malfunctions can occur!

---

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
### Pre-Setup
> You need to know what you are doing with this node-red plugin. Inform yourself about bunq.com API and create an API key or use the Sandbox function/node of this plugin to play around.

### Setup
> Go to the installation dir of your node-red instance (might be: /home/pi/.node-red). And type:
```
npm install https://github.com/M4LE5/node-red-contrib-bunq/tarball/master
or
npm install git+https://github.com/M4LE5/node-red-contrib-bunq.git
```

## Configuration
### Sandbox
[![Sandbox usage](https://raw.githubusercontent.com/M4LE5/node-red-contrib-bunq/master/flow_sandbox.png)](https://raw.githubusercontent.com/M4LE5/node-red-contrib-bunq/master/flow_sandbox.png)

1. Put a Sandbox node (Action: Create Sandbox User) on a tab and create a new config connection. -> Deploy and run
2. Copy the API-key into the newly created config connection.
3. Put an Installation node on the tab. -> Deploy and run
4. Copy the given Token into config connection (as Installation token).
5. Put a Device node on the tab and configure the properties as you like. -> Deploy and run

### Production Mode
If you need to create the installation and add device then you need to perform these steps:

1. Put a Installation node on a tab and create a new config connection.
2. Copy the API-key into the newly created config connection. -> Deploy and run
3. Copy the given Token into config connection (as Installation token).
5. Put a Device node on the tab and configure the properties as you like. -> Deploy and run

If you got a private/public key .pem-file, you can point to this file on config node in the input field "Private Key Client".

---

## FAQ

- Why my payment (bunq Monetary Node) is always only saved as draft?
    - Because you handle with your own money by using an open API. If something happen wrong, you can get lost your money!
	
---

## License

[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://badges.mit-license.org)

- **[MIT license](http://opensource.org/licenses/mit-license.php)**
- Copyright 2020 © M4LE5.

# Disclaimer
### Use this Software at your own risk!