import { PlatformAccessory, Service } from 'homebridge';
import { PhoneLock } from './phonelock';
import { ExampleHomebridgePlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class PhoneLockAccessory {
  private service: Service;

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private lock: PhoneLock
  ) {
    console.log('New phonelock accessory');

    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Name, 'Dørlås');

    // Init accessory service in Homebridge
    this.service =
      this.accessory.getService(this.platform.Service.LockMechanism) ||
      this.accessory.addService(this.platform.Service.LockMechanism);

    this.service
      .getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(() => Promise.resolve(this.lock.locked_state));

    this.lock.onLockedState(state => {
      this.service
        .getCharacteristic(this.platform.Characteristic.LockCurrentState)
        .setValue(state);
      this.service
        .getCharacteristic(this.platform.Characteristic.LockTargetState)
        .setValue(state);
    });

    this.service
      .getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onGet(() => Promise.resolve(this.lock.locked_state))
      .onSet(val =>
        Promise.resolve(this.lock.setLockedState(!!val)).then(
          () => this.lock.locked_state
        )
      );
  }
}
