const escpos = require('escpos');
var im = require('imagemagick');
const path = require('path');

const { writeFileSync } = require('fs');

escpos.USB = require('escpos-usb');

const device = new escpos.USB();
const printer = new escpos.Printer(device);

async function printText(input) {
  try {
    device.open(async function () {
      printer.size(0.5, 0.5);

      const lines = input.split("\n");

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const match = trimmedLine.match(/\[(.*?)\](.*?)\[\/(.*?)\]/);

        if (match) {
          const [, tag, content] = match;

          switch (tag.toLowerCase()) {
            case "center":
              printer.align("ct").text(content);
              break;
            case "left":
              printer.align("lt").text(content);
              break;
            case "right":
              printer.align("rt").text(content);
              break;
            case "bold":
              printer.style("B").text(content);
              break;
            case "underline":
              printer.style("U").text(content);
              break;
            case "big":
              printer.size(1, 1).text(content);
              break;
            case "qr":
              await new Promise(resolve => {
                printer.align('ct').qrimage(content, { type: 'png', size: 10 }, resolve);
              });
              printer.feed(2);
              break;
            case "img":
              await printBase64Image(content, printer);
              break;
          }
        } else if (trimmedLine.toUpperCase() === "[LINE]") {
          printer.drawLine();
        } else if (trimmedLine.toUpperCase() === "[CUT]") {
          printer.feed().cut();
        } else {
          printer.text(trimmedLine);
        }
      }

      printer.close();
    });
  } catch (error) {
    console.error('Error printing:', error.message);
  }
}

async function printBase64Image(base64String, printer) {
  try {
    const imagePath = path.join(__dirname, 'temp_image.png');

    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
    writeFileSync(imagePath, Buffer.from(base64Data, 'base64'));

    console.log(imagePath)

    await new Promise((resolve, reject) => {
      escpos.Image.load(imagePath, function (image) {
        printer.align("ct").raster(image);
        printer.feed(3);
        writeFileSync(imagePath, '');
        resolve();
      });
    });
  } catch (error) {
    console.error('Error printing image:', error.message);
  }
}

module.exports = { printText };
