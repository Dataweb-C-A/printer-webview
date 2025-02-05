# WebView Printer

This is a simple webview printer that uses the `webview` crate to render a webpage and then integrate with USB thermal printers to print through the browser using WebSocket.

## Usage

1. Clone the repository.
2. Install dependencies:
```bash
npm install
```
3. Configure enviroment variables (.env) in root of project
   - Variables:
       - APP_URL = string
       - PORT = number
5. Run the server:
```bash
npm start
```
5. The app automatically opens.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
