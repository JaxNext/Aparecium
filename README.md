# Aparecium

Aparecium is a browser extension that can explain words, phrases, or sentences, inspired by the charm Aparecium from Harry Potter. This extension is designed to enhance your browsing experience by providing explanations for the text you encounter online.

## Features

[![](./assets/apa.gif)]()

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aparecium.git
   ```
2. Navigate to the project directory:
   ```bash
   cd aparecium
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the extension:
   ```bash
   npm run build
   ```
5. Load the extension in your browser:
   - Open your browser's extensions page.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `extension` directory from the project.

## Usage

1. Open the extension side panel.
2. Highlight any text on a webpage, the selected text will be catch by Aparecium automatically.
3. Now you can see the explanation of the selected text in the side panel.

## Roadmap

- ✅ Basic explanation.
- ✅ Support manually input text into a textarea.
- ✅ Clear button for input text.
- ✅ Copy button for output text.
- [ ] Abortion.
- [ ] Usability detection in detail level.
- [ ] Detail level.
- [ ] Output as plain text, markdown, or html.
- [ ] Structured output.
- [ ] Translate input text into English in case LLM can't understand.
- [ ] Translate output text into multiple languages.
- [ ] Share input and output text as an image.
- [ ] History list.
- [ ] Remember settings.
- [ ] Rate the explanation. (Valuable?)
- [ ] Pronunciation and TTS. (?)

## Development

### Prerequisites

- Node.js and npm installed on your machine.

### Scripts

- `npm run dev`: Start the development server.
- `npm run build`: Build the extension for production.
- `npm run lint`: Lint the codebase.

### Configuration

- **Vite**: The project uses Vite for fast builds and hot module replacement.
- **Tailwind CSS**: Tailwind is used for styling components.
- **TypeScript**: The codebase is written in TypeScript for type safety.

### Project Structure

- `src/`: Contains the source code for the extension.
  - `components/`: Vue components used in the extension.
  - `lib/`: Utility functions.
  - `assets/`: Styles and images.
- `extension/`: Contains files specific to the browser extension.
- `public/`: Static assets.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Contact

For questions or feedback, please contact [qianjunyinggo@gmail.com](mailto:qianjunyinggo@gmail.com).
