const {app, Menu, Tray} = require('electron');

const Wemo = require('wemo-client');
var wemo = new Wemo();

let tray;
var contextMenu;

let selectedDevice = 0;
let devices = [];

const search = function() {
    console.log('Searching for devices...');

    wemo.discover(function(device) {
        console.log('Device "%s" found.', device.friendlyName);
        
        var client = wemo.client(device);
        client.on('binaryState', function(value) {
            for (var i = 0; i < devices.length; i++) {
                if (devices[i].device === this.device) {
                    console.log('State of device "%s" changed to %s.', this.device.friendlyName, value);
                    setIcon(value == 1 ? 'on' : 'off');
                    devices[i].state = value;
                    updateMenu();
                }
            }
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
    {type: 'separator'},
    {label: 'Search', click: search},
    {label: 'Quit', role: 'quit'}
];

const updateMenu = function() {
    var deviceMenuItems = [];
    if(devices.length > 0) {
        deviceMenuItems.push({label: 'Devices:', enabled: false});
        for(var i = 0; i < devices.length; i++) {
            var currentDevice = i;
            deviceMenuItems.push({
                label: devices[i].device.friendlyName + ' (' + (devices[i].state == 1 ? 'On' : 'Off') + ')',
                type: 'radio',
                checked: selectedDevice === i ? true : false,
                click: () => {selectedDevice = currentDevice}
            });
        }
    } else {
        deviceMenuItems.push({label: 'No devices found.', enabled: false});
    }

    contextMenu = Menu.buildFromTemplate(deviceMenuItems.concat(menuOptions));

    tray.setContextMenu(contextMenu);
}

app.on('ready', () => {
    tray = new Tray('icons/icon-off.png');
    tray.setToolTip('Boolb');

    tray.on('click', (event) => {
        if(devices.length > 0) {
            toggleDevice();
        }
    });

    updateMenu();

    search();
});

const setIcon = function(state) {
    tray.setImage('icons/icon-' + state + '.png');
}

const toggleDevice = function() {
    var device = devices[selectedDevice];

    console.log('Toggling device "%s".', device.device.friendlyName);
    console.log('Setting state to %s.', device.state == 1 ? 'off' : 'on');

    device.client.setBinaryState(device.state == 1 ? 0 : 1);
}
