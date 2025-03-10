# Boxento

Boxento is a lightweight, open-source, customizable start page for tech-savvy, always-online users. Built with React, Vite, Tailwind CSS, and shadcn/ui, it features a simple homepage with dynamic, draggable, resizable widgets including Calendar, Weather, World Clocks, and Quick Links. Boxento is designed to be small, modular, and easy to extend, with a focus on UX and community contributions.

## Table of Contents
- [About](#about)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
- [Usage](#usage)
- [Widgets](#widgets)
  - [Built-in Widgets](#built-in-widgets)
  - [Creating Your Own Widgets](#creating-your-own-widgets)
  - [Resizable Widgets](#resizable-widgets)
- [Authentication](#authentication)
  - [Firebase Setup](#firebase-setup)
  - [User Authentication](#user-authentication)
- [Package Management](#package-management)
- [Hosting Boxento](#hosting-boxento)
  - [Hosting Yourself](#hosting-yourself)
  - [Hosting for Contributors](#hosting-for-contributors)
- [Contributing](#contributing)
  - [Pull Request Process](#pull-request-process)
  - [Approval Criteria](#approval-criteria)
  - [Design Guidelines](#design-guidelines)
- [License](#license)
- [Roadmap](#roadmap)
- [Contact](#contact)

## About
Boxento is inspired by the need for a flexible dashboard for developers, sysadmins, and tech enthusiasts who live online. The goal is to keep it lightweight, open-source, and community-driven with support for both local widgets and third-party integrations.

## Features
- **Lightweight & Modular**: Built with React + Vite for fast, minimal performance, using Vite as the industry-standard build tool and Bun for package management and runtime.
- **Modern UI Components**: Utilizes shadcn/ui for beautiful, accessible, and consistent UI elements.
- **Resizable Widgets**: Drag, drop, and resize all widgets to show more or less information (e.g., Calendar shows month overview at 2x2, full calendar at 6x6).
- **Theme Support**: All widgets support both light and dark modes, toggled via a sun icon in the top-right corner.
- **Open-Source Friendly**: MIT-licensed, easy for anyone to contribute widgets.
- **UX-Focused**: Intuitive drag-and-drop, keyboard shortcuts (cmd + k for widget picker), and clean aesthetics.
- **High Performance**: Optimized with Vite's tree-shaking and lazy loading, ensuring fast load times even with resizable widgets.

## Getting Started

### Prerequisites
- Bun (v1.0+ or latest, see [bun.sh](https://bun.sh))
- Git (optional, for cloning/forking)

### Installation
Clone the repository:
```bash
git clone https://github.com/sushaantu/boxento.git
cd boxento
```

Install dependencies with Bun:
```bash
bun install
```

Boxento uses shadcn/ui components, which are already included in the project. Vite is the build tool, handling development and production builds seamlessly. If you need to add additional shadcn/ui components, use the shadcn-ui CLI:

```bash
bunx shadcn-ui@latest add [component-name]
```

For example, to add the Dialog component:
```bash
bunx shadcn-ui@latest add dialog
```

Check the components.json file in the project root to see installed shadcn/ui components and their configurations.

### Running Locally
Start the development server with Bun, which runs Vite:
```bash
bun run dev
```

Open your browser to http://localhost:5173 (Vite's default port). Vite provides fast hot module replacement (HMR) for rapid development.

## Usage
- **Homepage**: Land on "You can add widgets" with a button to add built-in widgets.
- **Widgets**: Drag and resize tiles to fit your workflow—larger sizes (up to 6x6) show more details, while the standard 2x2 size shows essential information.
- **Settings**: Click the gear icon on a widget for basic settings (e.g., location for Weather), stored in localStorage.
- **Theme Toggle**: Switch between light and dark modes using the sun icon in the top-right corner, stored in localStorage. This toggles the entire screen and all widgets, ensuring consistent theming across Boxento.

## Widgets

### Built-in Widgets
Boxento comes with these widgets:

- **Calendar**: Shows today's date and events
- **Weather**: Displays local weather
- **World Clocks**: Shows times in multiple timezones
- **Quick Links**: Editable grid of clickable bookmarks
- **Notes**: A minimalist notepad for capturing thoughts and ideas

### Creating Your Own Widgets
Boxento is open-source, and anyone can create and contribute widgets! For detailed instructions, see our [Widget Development Guide](docs/WIDGET_DEVELOPMENT.md).

Here's a quick overview of the process:

1. **Fork the Repository**:
   - Visit github.com/sushaantu/boxento and click "Fork."

2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/sushaantu/boxento.git
   cd boxento
   ```

3. **Install Dependencies**:
   ```bash
   bun install
   ```

4. **Create a Widget**:
   - Follow the template and guidelines in the [Widget Development Guide](docs/WIDGET_DEVELOPMENT.md)
   - Remember that all widgets must have a minimum size of 2x2 and maximum size of 6x6
   - Ensure your widget supports both light and dark themes

5. **Test Locally**:
   - Run `bun run dev` and test your widget thoroughly

6. **Submit a Pull Request (PR)**:
   - Create a PR on GitHub against `sushaantu/boxento:main`, including a description, testing steps, and screenshots if possible

See [Contributing](#contributing) and [Design Guidelines](#design-guidelines) for additional details.

### Resizable Widgets
All widgets are resizable with react-grid-layout:

- **Size Constraints**: All widgets have a minimum size of 2x2 grid units and a maximum size of 6x6 grid units
- **Responsive Content**: Widgets adapt their content based on size—smaller sizes show essential information, larger sizes show more details
- **Size Persistence**: Widget sizes are stored in localStorage for persistence
- **Size Enforcement**: The application enforces the minimum 2x2 size constraint for all widgets

For detailed information about widget sizing and development, see the [Widget Development Guide](docs/WIDGET_DEVELOPMENT.md).

## Authentication

Boxento supports user authentication and cloud storage of dashboard configurations using Firebase. This allows users to access their personalized dashboard from any device.

### Firebase Setup

To set up Firebase for your Boxento instance:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Register a web app in your Firebase project
3. Enable Authentication (Email/Password and Google Sign-in methods)
4. Set up Firestore Database with appropriate security rules
5. Add your Firebase configuration to the `.env` file:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### User Authentication

Boxento provides a simple authentication flow:

1. Users can sign up with email/password or Google authentication
2. Dashboard configurations are automatically saved to the cloud
3. Users can access their dashboard from any device by logging in
4. All data is securely stored and accessible only to the authenticated user

## Package Management

Boxento uses [Bun](https://bun.sh/) as its primary package manager. Bun offers faster installation times and improved performance compared to npm or yarn.

### Using Bun

To install dependencies:
```bash
bun install
```

To run scripts:
```bash
bun run dev     # Start development server
bun run build   # Build for production
bun run preview # Preview production build
bun run typecheck # Run TypeScript type checking
```

### Package Management Standards

- Use Bun exclusively for all package management operations
- Do not commit package-lock.json, yarn.lock, or pnpm-lock.yaml files
- Always use `bun run` to execute scripts defined in package.json
- When adding new dependencies, use `bun add [package]`
- For dev dependencies, use `bun add -d [package]`

### Hosting Yourself
Build the static site:
```bash
bun run build
```
This generates a `dist/` folder with HTML, CSS, and JS.

Host locally (for testing):
- Install serve with Bun: `bun add -g serve`
- Run: `serve -s dist` and access at http://localhost:3000

Host on GitHub Pages (recommended):
- Push to GitHub, set up a GitHub Action in `.github/workflows/deploy.yml` to build and deploy `dist/`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches:
      - main
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build  # Uses Vite for building the static site
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: dist
```
- Enable GitHub Pages in repo settings (gh-pages branch, /root directory)
- Access at https://sushaantu.github.io/boxento

### Hosting for Contributors
Contributors can host their fork similarly:

- Build: `bun run build`
- Host on GitHub Pages (as above) or locally with serve

## Contributing
We welcome contributions to Boxento! Follow these steps:

### Pull Request Process
1. Fork and clone the repo (see [Creating Your Own Widgets](#creating-your-own-widgets))
2. Create a widget or fix in `/src/components/widgets/` or elsewhere
3. Test locally with `bun run dev`
4. Commit and push to your fork
5. Create a PR on GitHub against `main`, including:
   - Clear title (e.g., "Add NotesWidget: Editable Notes Tile")
   - Description (purpose, features, testing steps, screenshots if possible)
   - Ensure no breaking changes to existing code

### Approval Criteria
PRs are reviewed and approved based on:

- **Functionality**: Works with React + Vite, integrates with `react-grid-layout` (draggable, resizable), handles `width`/`height` props
- **Theme Support**: Properly supports both light and dark modes, toggled via the sun icon (use Tailwind's `dark:` classes)
- **Design Aesthetic**: Matches Boxento's style (see [Design Guidelines](#design-guidelines))
- **Component Usage**: Uses shadcn/ui components for UI elements where appropriate
- **Code Quality**: Follows React best practices, uses Tailwind CSS, no unnecessary dependencies, and ensures compatibility with Vite's build process
- **Documentation**: Includes a PR description and updates `/docs` if needed
- **Performance & Accessibility**: Lightweight, accessible (ARIA labels, keyboard nav if interactive), optimized with Vite's tree-shaking

Expect feedback within 1-3 days—update your PR based on comments, and it'll be merged if criteria are met.

### Design Guidelines
All widgets must follow Boxento's aesthetic for consistency:

- **Component Library**: Use shadcn/ui components for standard UI elements (buttons, inputs, modals, etc.).
- **Typography**: Use the Inter font throughout the application.
- **Borders**: Use a consistent 8px radius (Tailwind `rounded-lg`) and 1px shadow (Tailwind `shadow`) for all widgets.
- **Colors**: Use semantic color classes (e.g., `bg-white dark:bg-gray-800`, `text-black dark:text-white`) that work seamlessly with both light and dark modes.
- **Theming**: All widgets must support both light and dark modes using Tailwind's `dark:` prefix. The theme is toggled via a sun icon (or moon icon) in the top-right corner, using shadcn/ui components.
- **Spacing**: Use 16px padding (`p-4`) inside widgets and 8px margins between tiles (handled by `react-grid-layout`).
- **Animations**: Keep animations minimal—use Tailwind hover effects (`hover:shadow-md`) or transitions (`transition-all duration-200`) for resize/drag interactions.
- **Responsiveness**: Adjust content dynamically for different sizes (2x2 minimum to 6x6 maximum) based on `width` and `height` props, ensuring readability and usability at all supported sizes.

## License
Boxento is licensed under the MIT License—see the LICENSE file for details.

## Roadmap
- Initial release with core widgets and functionality
- Expanding widget library with community contributions
- Adding third-party service integrations 
- Enhancing customization options and user experience

## Contact
- Maintainer: Sushaantu
- Repository: github.com/sushaantu/boxento
- Discussions: Join us on X or open an issue/PR on GitHub for feedback
