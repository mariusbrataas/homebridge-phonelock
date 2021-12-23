import rpiGpio from 'rpi-gpio';

const gpio = rpiGpio.promise;

const SETTINGS = {
  gpio_lock: 7,
  gpio_bell: 22
};

const seconds = (val: number) => val * 1000;
const minutes = (val: number) => seconds(val * 60);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class PinHandler {
  constructor(
    private pin_number: number,
    private direction: 'read' | 'write'
  ) {}

  public onChange = (listener: (state: boolean) => void) => {
    rpiGpio.on('change', (_, value) => listener(value));
  };

  public read = () => this.setup().then(() => gpio.read(this.pin_number));

  public write = (state: boolean) =>
    this.setup().then(() => {
      if (this.direction !== 'write') throw "Pin is not set to 'write'";
      return this.read().then(current_state =>
        state !== current_state
          ? gpio.write(this.pin_number, state).then(() => state)
          : current_state
      );
    });

  public click = () =>
    this.write(true)
      .then(() => sleep(500))
      .then(() => this.write(false));

  private setup = (() => {
    var promise: Promise<void>;
    return () =>
      promise ||
      (promise = gpio
        .setup(
          this.pin_number,
          this.direction === 'read' ? gpio.DIR_IN : gpio.DIR_OUT
        )
        .then(() => {}));
  })();
}

export class PhoneLock {
  private _locked_state: boolean;
  private onLockedStateListener?: (state: boolean) => void;
  private lock_pin: PinHandler;
  private bell_pin: PinHandler;

  constructor() {
    this._locked_state = false;
    this.lock_pin = new PinHandler(7, 'write');
    this.bell_pin = new PinHandler(22, 'read');
  }

  public get locked_state() {
    return this._locked_state;
  }

  private set locked_state(state: boolean) {
    if (state !== this._locked_state) {
      console.log('Set lock state: ', state);
      this._locked_state = state;
      if (this.onLockedStateListener) this.onLockedStateListener(state);
    }
  }

  public onLockedState = (listener: PhoneLock['onLockedStateListener']) => {
    this.onLockedStateListener = listener;
  };

  public setLockedState = (() => {
    var timeout: NodeJS.Timeout & number;
    return (state: boolean, expire?: number) => {
      clearTimeout(timeout);
      this.locked_state = state;
      if (!this.locked_state)
        timeout = setTimeout(() => {
          this.locked_state = true;
        }, expire || seconds(10)) as NodeJS.Timeout & number;
    };
  })();
}
