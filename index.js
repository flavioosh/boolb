const {app, Menu, Tray} = require('electron');

const Wemo = require('wemo-client');
var wemo = new Wemo();

var devices = [];

const search = function() {
    console.log('Searching for devices...');
    wemo.discover(function(device) {
        console.log('Device "' + device.friendlyName + '" found.');
        var client = wemo.client(device);
        client.on('binaryState', function(value) {
            for (var i = 0; i < devices.length; i++) {
                if (devices[i].device === this.device) {
                    console.log('State of device "' + this.device.friendlyName + '" changed to ' + value + '.');
                    tray.setImage('icons/icon-' + (value == 1 ? 'on' : 'off') + '.png')
                    devices[i].state = value;
                }
            }
            updateMenu();
        });
        devices.push({
            device: device,
            client: client,
            state: device.binaryState
        });
        updateMenu();
    });
}

const menuOptions = [
    {label: 'Search', click: search},
    {type: 'separator'},
    {label: 'Quit', click: app.quit}
];

const updateMenu = function() {
    var deviceMenuItems = [];
    if(devices.length > 0) {
        for(var i = 0; i < devices.length; i++) {
            var device = devices[0]
            deviceMenuItems.push({
                label: device.device.friendlyName,
                type: 'checkbox',
                checked: device.state == 1,
                click: toggleSwitch(device)
            });
        }
    }else {
        deviceMenuItems.push({label: 'No devices found.', enabled: false});
    }
    contextMenu = Menu.buildFromTemplate(deviceMenuItems.concat(menuOptions));

    tray.setContextMenu(contextMenu);
}

let tray = null;
var contextMenu = null;

app.on('ready', () => {
    tray = new Tray('icons/icon-off.png');
    tray.setToolTip('Boolb');

    tray.on('click', (event) => {
        if(devices.length > 0) {
            toggleSwitch(devices[0])();
        }
    });

    updateMenu();

    search();
});

const toggleSwitch = function(device) {
    return function() {
        console.log('Toggling "' + device.device.friendlyName + '".');
        console.log('Setting state to ' + (device.state == 1 ? 'off' : 'on') + '.');
        device.client.setBinaryState(device.state == 1 ? 0 : 1);
    }
}
