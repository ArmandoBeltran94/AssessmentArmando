import { fixture, Selector} from 'testcafe';
import { getDevices, updateDevice, deleteDevice, createDevice} from './requests'

fixture`Assessment Automation`
	.page('http://192.168.1.72:3001/')
	// .page('http://localhost:3001/')

const listDevices = Selector('div.list-devices')
const deviceName = listDevices.find('span.device-name')
const deviceType = listDevices.find('span.device-type')
const deviceCapacity = listDevices.find('span.device-capacity')	

const getRandomString = length => {
    let result           = '';
    const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

test('Test 1', async t => {
	const deviceOptions = text => deviceName.withText(text).parent(1).find('div.device-options') //search div whit class device-options
	const deviceEdit = text => deviceOptions(text).find('a.device-edit')	//search button edit in div whit class device-options
	const deviceRemove = text => deviceOptions(text).find('button.device-remove')	//search button remove in div whit class device-options

	const devices =	await getDevices() // Get Devices from API

	for (const device of devices) {
		await t
			.expect(deviceName.withText(device.system_name).visible).ok() // Validate device name
			.expect(deviceType.withText(device.type).visible).ok() // Validate device type
			.expect(deviceCapacity.withText(device.hdd_capacity).visible).ok() // Validate davice capacity
			.expect(deviceEdit(device.system_name).exists).ok() //Validate button exists
			.expect(deviceRemove(device.system_name).exists).ok()	//Validate button exists
	}
});

test('Test 2', async t => {
	const submitAddDevice = Selector('a.submitButton')
	const submitSavaDevice = Selector('button.submitButton')
	const inputName = Selector('input#system_name')
	const selectType = Selector('select#type')
	const newname = getRandomString(5) 	//device name to add
	const newType = 'MAC'			//device type to add
	const newCapacity = '800'		//devide capacity to add
	const optionType = selectType.find('option').withText(newType) //Search for a select option
	const inputCapacity = Selector('input#hdd_capacity')

	await t
		.click(submitAddDevice)
		.typeText(inputName, newname)
		.click(selectType)
		.click(optionType)
		.typeText(inputCapacity, newCapacity)
		.click(submitSavaDevice)
		
	await t.eval(() => location.reload(true))
	
	const devices =	await getDevices()
	const newDevice = devices.find(device => device.system_name === newname) // search for new device added
	
	await t
		.expect(deviceName.withText(newDevice.system_name).visible).ok() // Validate device name
		.expect(deviceType.withText(newDevice.type).visible).ok() // Validate device type
		.expect(deviceCapacity.withText(newDevice.hdd_capacity).visible).ok() // Validate davice capacity
	
});

test('Test 3', async t => {
	const devices =	await getDevices()
	const newName = 'RENAMED DEVICE'
	const payload = {
		'system_name': newName,
		'type': devices[0].type,
		'hdd_capacity': devices[0].hdd_capacity
	}
	await updateDevice(devices[0].id, payload)	//Update device through API
	await t.eval(() => location.reload(true))
	const devicesUpdated = await getDevices()

	await t
		.expect(devicesUpdated[0].system_name).eql(newName)	// Validate device name in data
		.expect(deviceName.withText(newName).visible).ok() // Validate device name in UI
});

test('Test 4', async t => {
	const newName = getRandomString(5)
	const payload = {
		'system_name': newName,
		'type': 'MAC',
		'hdd_capacity': '1000'
	}

	await createDevice(payload)	//Create new device through API
	await t.eval(() => location.reload(true))

	await t.expect(deviceName.withText(newName).visible).ok()	// Validate new device name is visible on UI

	const devices =	await getDevices()
	const newDevice = devices.find(value => value.system_name === newName)	//Get new device data

	await deleteDevice(newDevice.id)	// Deleted the last device
	await t.eval(() => location.reload(true))
	await t.expect(deviceName.withText(newName).visible).notOk() // Validate new device name is not visible on UI

})