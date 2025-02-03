const escpos = require("escpos");
var im = require("imagemagick");
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

// Función privada para procesar cada línea
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

// Función para manejar etiquetas de apertura
async function handleOpenTag(tagContent, line, styleStack, printer, getCurrentPos) {
  const tagParts = tagContent.toLowerCase().split(' ');
  const tagName = tagParts[0];
  const content = tagParts.slice(1).join(' ');

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
        await new Promise(resolve => {
          printer.align('ct').qrimage(content, { type: 'png', size: 10 }, resolve);
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
  const imagePath = path.join(__dirname, "temp_image.png");
  const resizedPath = path.join(__dirname, "temp_image_resized.png"); // Archivo separado para redimensión

  try {
    // 1. Decodificar y guardar imagen original
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
    writeFileSync(imagePath, Buffer.from(base64Data, "base64"));

    // 2. Redimensionar y convertir a formato compatible
    await new Promise((resolve, reject) => {
      im.convert([
        imagePath,
        "-resize", "x170",          // Altura fija de 170px
        "-colorspace", "Gray",      // Forzar escala de grises
        "-threshold", "60%",        // Aumentar contraste
        "-type", "bilevel",         // 1-bit de profundidad
        resizedPath
      ], (err) => err ? reject(err) : resolve());
    });

    // 3. Cargar y imprimir imagen procesada
    await new Promise((resolve, reject) => {
      escpos.Image.load(resizedPath, (err, image) => {
        if (err) return reject(err);
        
        printer.align("ct")
          .raster(image, "dwdh")
          .feed(3);
        
        // Limpiar archivos temporales
        writeFileSync(imagePath, "");
        writeFileSync(resizedPath, "");
        resolve();
      });
    });

  } catch (error) {
    console.error("Error procesando imagen:", error.message);
  }
}

module.exports = { printText };