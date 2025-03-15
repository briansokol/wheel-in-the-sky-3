# Changelog

All notable changes to this project are documented here.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0](#3.0.0) - Unreleased

Complete rewrite (again). Version 3 has migrated from NextJS and is now an SPA using the Vite build framework, with a Hono backend API. All proprietary code has been removed and the project is now completely open source.

### Added

- Config page shows a preview of the wheel as you change settings.

### Changed

- Wheel no longer "floats" to the center of the segment. It will stop where it stops.
- Wheel is now individual DOM elements. This helps ensure consitency across browsers.
- Spinning is handled by custom-written code.
- UI is completely rewritten using [HeroUI](https://heroui.com).
- Options and navigation have been moved to a new mobile-friendly navbar.
- Project is open source.

### Removed

- Greensock, which is closed source (and expensive), is no longer used to handle the spinning.
- App sounds have been removed. They were difficult to support across browser implementations, and were often buggy. They may return in the future, no promises.

### Security

- Updated Node to version 22.
- All dependencies have been updated or replaced.
- App hosting was moved from Heroku to Cloudflare.

## [2.5.0](#2.5.0) - 2024-01-23

### Added

- Add ability to persist some wheel state in local storage by giving each wheel a unique ID behind the scenes.
    - You will need to edit and re-save any existing wheels to get access to features that require the unique ID.
- Add ability to remove previous winners from the wheel using unique ID to persist winners.

### Security

- Node version updated to 20.
- Dependencies updated to fix vulnerabilities.

## [2.4.1](#2.4.1) - 2022-09-16

### Fixed

- Fix missing background on home page.

### Security

- Updates some dependencies to fix vulnerabilities.

## [2.4.0](#2.4.0) - 2021-12-17

### Added

- Adds customizable background colors.

### Changed

- Replaces color picker component. You can now get exact RGB colors with the picker or using hex values.

## [2.3.0](#2.3.0) - 2021-12-16

### Added

- Adds option for fully custom color pattern.

## [2.2.1](#2.2.1) - 2021-12-10

### Changed

- Improves font and image optimization.

## [2.2.0](#2.2.0) - 2021-12-09

### Added

- Adds actual home page (mostly for SEO purposes).
- Added more disclaimers to the About Page.
- Added ability to copy the winner banner directly to the clipboard in browsers that support this. - There is now a 2 step process to get the banner. You must click the image icon to generate the banner, then choose download or copy. - This was necessary to comply with clipboard security in Safari.

### Changed

- Separated wheel and browser settings on the Options Page.
- Improving performance of Bootstrap SSR.

### Removed

- Stopped the background cloud from animating for pErFoRmAnCe.

### Fixed

- Fixed issue with canceling editing wheel config without an existing config to return to.

## [2.1.0](#2.1.0) - 2021-12-08

### Added

- Added ability to customize colors of wheel using different methods.
- Added client side routing/rendering between pages after the first page load.

### Changed

- Clarified explanation of "Randomizing names" option to be more specific and yet somehow also more vague.
- Disabled links to other pages while the wheel is spinning to avoid ref errors when the wheel component unmounts. This was necessary with client-side routing.
- Changed order of options in the configuration page for clarity.

## [2.0.2](#2.0.2) - 2021-12-05

### Added

- Added Lato font to both site and banner for consistency.
- Added language attribute to html document.
- Added additional clarifying meta tags.

### Changed

- Updated layout of downloadable banner to be more readable.

### Fixed

- Fixed favicon rendering.

## [2.0.1](#2.0.1) - 2021-12-03

### Added

- Added "About" page with changelog.
- Added version number to the bottom of every page.
- Added app name to banner download.

### Changed

- Replaced "Change Wheel Options" button with a link and added a link to the about page.

## [2.0.0](#2.0.0) - 2021-12-02

Major rewrite using Next.js!

### Added

- Added feature to download a banner image of the winner that can be posted to chat rooms (available when the wheel stops spinning).
- Added consistent emoji icons across all platforms and browsers.
- Added option to hide the names on the wheel. Useful if you have a lot of wheel segments or just want to be extra surprised.

### Changed

- Rewritten using Next.js 12.
- Moved from Netlify to Heroku, added Cloudflare for caching and DNS.
- Switched design system from Mantine to Bootstrap.
- Options page has been completely rewritten.
- Url now contains the config as a URL segment and not a query param (should automatically convert old style to new style).
- Minor visual tweaks to text and backgrounds.

## [1.2.1](#1.2.1) - 2021-05-27

### Changed

- Changing the default selection for sounds to "off".

## [1.2.0](#1.2.0) - 2021-05-08

### Changed

- Major style refactor using [Mantine](https://mantine.dev).

## [1.1.1](#1.1.1) - 2021-05-05

### Changed

- Updated accessibility of checkboxes on options page.

### Fixed

- Fixed audio crash in Safari.

## [1.1.0](#1.1.0) - 2021-05-04

### Added

- Added sound to wheel spin (click while spinning and celebration horn for the winner).
- Added click to spin. You can still drag to spin if you want.
- Added animated cloud in the background that occasionally floats by.

### Changed

- Replaced gradient wheel with SVG-based wheel. Looks nicer.
- Moved options to the bottom of the page.

## [1.0.2](#1.0.2) - 2021-05-03

### Added

- Added Favicon.

### Removed

- Removed duplicate meta tag.

## [1.0.1](#1.0.1) - 2021-05-02

### Changed

- Adjusted colors.
- Better error handling.
- Lazy loading routes for faster initial render.

## [1.0.0](#1.0.0) - 2021-04-30

### Added

- Initial release proof of concept.
- The wheel spins!
