const escpos = require('escpos');
escpos.USB = require('escpos-usb');

function printText(text) {
  try {
    const device = new escpos.USB();
    const printer = new escpos.Printer(device);

    device.open(() => {
      printer
        .text(text)
        .cut()
        .close();
    })
  } catch (error) {
    console.error('Error trying to print:', error.message);
  }
}

module.exports = { printText };