# Subwaydle Remastered

A fork of the Wordle-inspired NYC Subway daily puzzle game. Modified for real transit enthusiasts by prioritizing direct, efficient transit paths.

Contains some source code lifted from the [open-source clone](https://github.com/cwackerfuss/word-guessing-game) by Hannah Park. Subwaydle Remastered is a static JavaScript app, written using Create React App with React, Sass, Semantic UI React and Mapbox. A few Ruby scripts were written to generate JSON data files used by the app.

See the original live at https://www.subwaydle.com

## Upgrades vs. original

This fork includes the following modifications compared to [the original repository](https://github.com/blahblahblah-/subwaydle):

- ✅ **Same-color hint**: Added a deeper orange hint when a guessed route shares the same color/transit line as the answer route:
  - Ex.: A, C, E are all Eighth Avenue Line
  - Helps players identify when they're on the right track but chose a different route on the same line
- ✅ **Route filtering logic**: Modified `scripts/possible_guesses_generator.rb` to filter out roundabout routes by:
  - Checking if a direct single-route path exists between origin and destination
  - Filtering routes with `travel_distance_factor` >= 1.4 (routes that are 40%+ longer than the direct distance)
  - Applying minimum distance and progress factor thresholds to prioritize efficient paths
- ✅ **Practice mode**: Added practice mode to support 4 game modes:
  - Weekday, Weekend, Late Night, and Accessible route practice options
  - URL-based puzzle sharing (`?practice=mode&game=index`)
  - Share functionality that includes mode indicators
- ✅ **Performance improvements**: Implemented lazy loading of game data:
  - Only loads data files needed for the current game mode
  - Reduces initial bundle size
  - Initial page load is now 5x faster
- ✅ **Component organization**: Reorganized codebase into logical directory structure:
  - Separated game, modal, stats, and UI components into dedicated folders
  - Extracted contexts and hooks for better code organization
  - Improved maintainability and code clarity
- ✅ **Code quality**: Enhanced code reliability and developer experience:
  - Added PropTypes validation to all components
  - Added ErrorBoundary component for graceful error handling
  - Fixed build warnings and updated dependencies

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

Inspirations:
* [Wordle](https://www.powerlanguage.co.uk/wordle/)
* [Chengyu Wordle](https://cheeaun.github.io/chengyu-wordle/)
* [Nerdle](https://nerdlegame.com/)