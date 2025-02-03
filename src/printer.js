const escpos = require("escpos");
const path = require("path");
const { writeFileSync } = require("fs");

escpos.USB = require("escpos-usb");

const device = new escpos.USB();
const printer = new escpos.Printer(device, { encoding: "ISO-8859-1" });

async function printText(input) {
  try {
    device.open(async function () {
      printer.size(0.5, 0.5);
      const lines = input.split("\n");

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.toUpperCase() === "[LINE]") {
          printer.drawLine();
        } else if (trimmedLine.toUpperCase() === "[CUT]") {
          printer.feed().cut();
        } else {
          await processLine(trimmedLine, printer);
        }
      }

      printer.close();
    });
  } catch (error) {
    console.error("Error printing:", error.message);
  }
}

async function processLine(line, printer) {
  let currentPos = 0;
  const length = line.length;
  let buffer = '';
  const styleStack = [];

  while (currentPos < length) {
    const nextOpen = line.indexOf('[', currentPos);
    if (nextOpen === -1) {
      buffer += line.substring(currentPos);
      break;
    }

    buffer += line.substring(currentPos, nextOpen);
    currentPos = nextOpen;

    const nextClose = line.indexOf(']', currentPos);
    if (nextClose === -1) {
      buffer += line.substring(currentPos);
      break;
    }

    const tagContent = line.substring(currentPos + 1, nextClose);
    currentPos = nextClose + 1;

    if (buffer) {
      printer.text(buffer);
      buffer = '';
    }

    if (tagContent.startsWith('/')) {
      const tagName = tagContent.substring(1).toLowerCase();
      if (styleStack.length > 0 && styleStack[styleStack.length - 1].tag === tagName) {
        const { revert } = styleStack.pop();
        revert();
      }
    } else {
      await handleOpenTag(tagContent, line, styleStack, printer, () => currentPos);
    }
  }

  if (buffer) printer.text(buffer);
}

async function handleOpenTag(tagContent, line, styleStack, printer, getCurrentPos) {
  const tagParts = tagContent.toLowerCase().split(' ');
  const tagName = tagParts[0];

  if (['bar', 'qr', 'img'].includes(tagName)) {
    const closingTag = `[/${tagName}]`;
    const closingIndex = line.indexOf(closingTag, getCurrentPos());
    if (closingIndex === -1) return;
    
    const content = line.substring(getCurrentPos(), closingIndex);
    currentPos = closingIndex + closingTag.length;

    switch (tagName) {
      case 'bar':
        printer.style('B').align('ct').barcode(content, 'CODE39', { width: 250, height: 80 });
        break;
      case 'qr':
        await new Promise(() => {
          printer.align('ct').qrimage(content, { type: 'png', size: 10 });
        });
        printer.feed(2);
        break;
      case 'img':
        await printBase64Image(content, printer);
        break;
    }
  } else {
    applyStyleTag(tagName, styleStack, printer);
  }
}

// Función para aplicar estilos
function applyStyleTag(tagName, styleStack, printer) {
  let revertFn;
  switch (tagName) {
    case 'center':
      printer.align('ct');
      revertFn = () => printer.align('lt');
      break;
    case 'left':
      printer.align('lt');
      revertFn = () => {};
      break;
    case 'right':
      printer.align('rt');
      revertFn = () => printer.align('lt');
      break;
    case 'bold':
      printer.style('B');
      revertFn = () => printer.style('NORMAL');
      break;
    case 'underline':
      printer.style('U');
      revertFn = () => printer.style('NORMAL');
      break;
    case 'big':
      printer.size(1, 1);
      revertFn = () => printer.size(0.5, 0.5);
      break;
    default:
      return;
  }
  styleStack.push({ tag: tagName, revert: revertFn });
}

async function printBase64Image(base64String, printer) {
  try {
    const imagePath = path.join(__dirname, "temp_image.png");
  
    const base64Data = base64String.replace(/^data:image\/w+;base64,/, "");
    writeFileSync(imagePath, Buffer.from(base64Data, "base64"));
  
    await new Promise((resolve, reject) => {
      escpos.Image.load(imagePath, function (image) {
        printer.align("ct").raster(image);
        printer.feed(2);
        writeFileSync(imagePath, "");
        resolve();
      })
    })
  } catch (error) {
    console.error("Error printing image:", error.message);
  }
}

module.exports = { printText };