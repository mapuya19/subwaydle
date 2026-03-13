# Subwaydle Remastered

A fork of the Wordle-inspired NYC Subway daily puzzle game. Enhanced by prioritizing direct, efficient transit paths.

Contains some source code lifted from the [open-source clone](https://github.com/cwackerfuss/word-guessing-game) by Hannah Park. Subwaydle Remastered is a static TypeScript/React app, built with Vite, React 19, Sass, Semantic UI React and Mapbox GL. A few Ruby scripts were written to generate JSON data files used by the app.

See the original live at https://www.subwaydle.com

## Tech stack

- **Runtime**: React 19, TypeScript 5.9
- **Build**: Vite 8, Sass
- **Testing**: Vitest 4, Testing Library, jsdom
- **Linting**: ESLint 9 (flat config), typescript-eslint, react-hooks, react-refresh
- **UI**: Semantic UI React (with React 19 compatibility shim), Mapbox GL 3
- **Package manager**: Yarn 4 (Berry)

## Upgrades vs. original

This fork includes the following modifications compared to [the original repository](https://github.com/blahblahblah-/subwaydle):

- **Build system**: Migrated from Create React App to Vite 8 for faster builds and better performance
- **TypeScript**: Complete conversion from JavaScript to TypeScript with strict type safety (zero `any` in source code)
- **React 19**: Upgraded to React 19 with a compatibility shim for semantic-ui-react (replaces removed `ReactDOM.findDOMNode`)
- **ESLint 9**: Flat config with typescript-eslint, react-hooks, and react-refresh plugins. Zero errors, zero warnings
- **Same-color hint**: Orange hint when a guessed route shares the same transit line as the answer (e.g., A, C, E are all Eighth Avenue Line)
- **Route filtering logic**: Filters out roundabout routes, prioritizing direct paths with travel distance factors < 1.4x the direct distance
- **Practice mode**: Four game modes (Weekday, Weekend, Late Night, Accessible) with URL-based puzzle sharing
- **Performance improvements**: Lazy loading of game data reduces initial bundle size and improves page load by 5x
- **Component organization**: Reorganized codebase into logical directories (game, modal, stats, UI) with extracted contexts and hooks
- **Dependency hygiene**: Zero vulnerabilities, all dependencies at latest compatible versions

## Running locally

`````
brew install yarn
yarn install
yarn start
`````

* To show the map that is displayed after finishing the puzzle: sign up for an account with [Mapbox](https://www.mapbox.com), get a token and add it to an `.env` file as `VITE_MAPBOX_TOKEN`.

* Ruby scripts in the `scripts/` directory produce the JSON files in `src/data` that are used by the app. *Warning:* viewing the `src/data` can reveal spoilers to the puzzle! All guesses are checked against the keys in the respective `solutions.json` file to be a valid trip, and the `answers.json` contains an array for the answer of each day. The values of the `solutions.json` object contain an example trip of stations that are traveled through for the trip.

## Deployment

This app is configured for deployment on [Vercel](https://vercel.com).

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables in the Vercel dashboard:
   - `VITE_MAPBOX_TOKEN` - Your Mapbox API token
4. Deploy!

Vercel will automatically detect this is a Vite app and build it correctly.

Subway Route Symbols ® Metropolitan Transportation Authority. Used with permission.

## Credits

Train bullet SVGs are from [mta-subway-bullets](https://github.com/louh/mta-subway-bullets) by Lou Huang, licensed under CC0-1.0.

Inspirations:
* [Wordle](https://www.powerlanguage.co.uk/wordle/)
* [Chengyu Wordle](https://cheeaun.github.io/chengyu-wordle/)
* [Nerdle](https://nerdlegame.com/)