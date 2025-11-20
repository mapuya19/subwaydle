# Subwaydle Remastered

A fork of the Wordle-inspired NYC Subway daily puzzle game. Modified for real transit enthusiasts by prioritizing direct, efficient transit paths.

Contains some source code lifted from the [open-source clone](https://github.com/cwackerfuss/word-guessing-game) by Hannah Park. Subwaydle Remastered is a static JavaScript app, written using Create React App with React, Sass, Semantic UI React and Mapbox. A few Ruby scripts were written to generate JSON data files used by the app.

See the original live at https://www.subwaydle.com

## Upgrades vs. original

This fork includes the following modifications compared to [the original repository](https://github.com/blahblahblah-/subwaydle):

- ✅ **Same-color hint**: Orange hint when a guessed route shares the same transit line as the answer (e.g., A, C, E are all Eighth Avenue Line)
- ✅ **Route filtering logic**: Filters out roundabout routes, prioritizing direct paths with travel distance factors < 1.4x the direct distance
- ✅ **Practice mode**: Four game modes (Weekday, Weekend, Late Night, Accessible) with URL-based puzzle sharing
- ✅ **Performance improvements**: Lazy loading of game data reduces initial bundle size and improves page load by 5x
- ✅ **Component organization**: Reorganized codebase into logical directories (game, modal, stats, UI) with extracted contexts and hooks
- ✅ **Code quality**: Added PropTypes validation, ErrorBoundary component, and fixed build warnings

## Running locally

`````
brew install yarn
yarn install
yarn start
`````

* To show the map that is displayed after finishing the puzzle: sign up for an account with [Mapbox](https://www.mapbox.com), get a token and add it to an `.env` file as `REACT_APP_MAPBOX_TOKEN`.

* Ruby scripts in the `scripts/` directory produce the JSON files in `src/data` that are used by the app. *Warning:* viewing the `src/data` can reveal spoilers to the puzzle! All guesses are checked against the keys in the respective `solutions.json` file to be a valid trip, and the `answers.json` contains an array for the answer of each day. The values of the `solutions.json` object contain an example trip of stations that are traveled through for the trip.

## Deployment

This app is configured for deployment on [Vercel](https://vercel.com).

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables in the Vercel dashboard:
   - `REACT_APP_MAPBOX_TOKEN` - Your Mapbox API token
4. Deploy!

Vercel will automatically detect this is a Create React App and build it correctly.

Subway Route Symbols ® Metropolitan Transportation Authority. Used with permission.

## Credits

Train bullet SVGs are from [mta-subway-bullets](https://github.com/louh/mta-subway-bullets) by Lou Huang, licensed under CC0-1.0.

Inspirations:
* [Wordle](https://www.powerlanguage.co.uk/wordle/)
* [Chengyu Wordle](https://cheeaun.github.io/chengyu-wordle/)
* [Nerdle](https://nerdlegame.com/)